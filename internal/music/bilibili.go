package music

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"math/rand/v2"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"

type Service struct {
	db        *sql.DB
	initError string
	libraryMu sync.Mutex
	client    *http.Client
	media     *http.Client
	keyMu     sync.Mutex
	key       string
	keyTime   time.Time
	streamsMu sync.Mutex
	streams   map[string]stream
	baseURL   string
}

func NewService() *Service {
	jar, _ := cookiejar.New(nil)
	return &Service{client: &http.Client{Jar: jar, Timeout: 25 * time.Second}, media: newMediaClient(), streams: make(map[string]stream)}
}
func Init(s *Service, path string) error {
	db, err := OpenLibrary(path)
	if err != nil {
		s.initError = err.Error()
		return err
	}
	s.db = db
	return nil
}
func Close(s *Service) {
	if s.db != nil {
		s.db.Close()
	}
}
func requestJSON[T interface{}](ctx context.Context, s *Service, endpoint string, params url.Values, signed bool) (T, error) {
	var result T
	if signed {
		key, err := s.wbi(ctx)
		if err != nil {
			return result, err
		}
		params.Set("wts", strconv.FormatInt(time.Now().Unix(), 10))
		query := sign(params, key)
		endpoint += "?" + query
	} else if len(params) > 0 {
		endpoint += "?" + params.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.bilibili.com"+endpoint, nil)
	if err != nil {
		return result, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Referer", "https://www.bilibili.com/")
	if req.URL.Path == "/x/space/wbi/arc/search" {
		req.Header.Set("Referer", "https://space.bilibili.com/"+params.Get("mid")+"/upload/video")
		req.Header.Set("Origin", "https://space.bilibili.com")
		req.Header.Set("Accept-Language", "en,zh-CN;q=0.9,zh;q=0.8")
	}
	res, err := s.client.Do(req)
	if err != nil {
		return result, errors.New("B站请求失败，请检查网络后重试")
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusPreconditionFailed {
		return result, errors.New("B站风控暂时拦截了请求（HTTP 412），请稍后重试")
	}
	if res.StatusCode != 200 {
		return result, fmt.Errorf("B站接口 HTTP %d；请求未完成", res.StatusCode)
	}
	var envelope struct {
		Code    *int            `json:"code"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	}
	if err = json.NewDecoder(io.LimitReader(res.Body, 8<<20)).Decode(&envelope); err != nil {
		return result, errors.New("B站返回了无法读取的数据")
	}
	if envelope.Code == nil {
		return result, errors.New("B站响应缺少状态码")
	}
	if *envelope.Code == -352 || *envelope.Code == -401 {
		return result, fmt.Errorf("B站风控暂时拦截了请求（%d），请稍后重试", *envelope.Code)
	}
	if *envelope.Code != 0 && !(endpoint == "/x/web-interface/nav" && *envelope.Code == -101) {
		return result, fmt.Errorf("B站接口错误 %d：%s", *envelope.Code, envelope.Message)
	}
	if len(envelope.Data) == 0 || string(envelope.Data) == "null" {
		return result, errors.New("B站响应没有数据")
	}
	if err = json.Unmarshal(envelope.Data, &result); err != nil {
		return result, errors.New("B站接口数据格式已变化")
	}
	return result, nil
}
func sign(params url.Values, key string) string {
	clean := url.Values{}
	for k, values := range params {
		for _, v := range values {
			clean.Add(k, strings.Map(func(r rune) rune {
				if strings.ContainsRune("!'()*", r) {
					return -1
				}
				return r
			}, v))
		}
	}
	q := strings.ReplaceAll(clean.Encode(), "+", "%20")
	sum := md5.Sum([]byte(q + key))
	return q + "&w_rid=" + hex.EncodeToString(sum[:])
}
func (s *Service) wbi(ctx context.Context) (string, error) {
	s.keyMu.Lock()
	defer s.keyMu.Unlock()
	if s.key != "" && time.Since(s.keyTime) < time.Hour {
		return s.key, nil
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://www.bilibili.com/", nil)
	req.Header.Set("User-Agent", userAgent)
	res, err := s.client.Do(req)
	if err != nil {
		return "", errors.New("无法建立 B站访客会话")
	}
	res.Body.Close()
	spi, err := requestJSON[struct {
		B3 string `json:"b_3"`
		B4 string `json:"b_4"`
	}](ctx, s, "/x/frontend/finger/spi", nil, false)
	if err != nil {
		return "", err
	}
	origin, _ := url.Parse("https://api.bilibili.com/")
	cookies := []*http.Cookie{}
	if spi.B3 != "" {
		cookies = append(cookies, &http.Cookie{Name: "buvid3", Value: spi.B3, Domain: ".bilibili.com", Path: "/", Secure: true})
	}
	if spi.B4 != "" {
		cookies = append(cookies, &http.Cookie{Name: "buvid4", Value: spi.B4, Domain: ".bilibili.com", Path: "/", Secure: true})
	}
	s.client.Jar.SetCookies(origin, cookies)
	nav, err := requestJSON[struct {
		WBI struct {
			Img string `json:"img_url"`
			Sub string `json:"sub_url"`
		} `json:"wbi_img"`
	}](ctx, s, "/x/web-interface/nav", nil, false)
	if err != nil {
		return "", err
	}
	raw := strings.TrimSuffix(path.Base(nav.WBI.Img), path.Ext(nav.WBI.Img)) + strings.TrimSuffix(path.Base(nav.WBI.Sub), path.Ext(nav.WBI.Sub))
	if len(raw) != 64 {
		return "", errors.New("B站签名参数不可用")
	}
	indexes := []int{46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13}
	var b strings.Builder
	for _, i := range indexes {
		b.WriteByte(raw[i])
	}
	s.key = b.String()
	s.keyTime = time.Now()
	return s.key, nil
}

type Video struct {
	BV       string `json:"bv"`
	Title    string `json:"title"`
	Uploader string `json:"uploader"`
	Cover    string `json:"cover"`
	Duration string `json:"duration"`
}
type Uploader struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}
type SearchPage struct {
	Videos    []Video    `json:"videos"`
	Uploaders []Uploader `json:"uploaders"`
	HasMore   bool       `json:"hasMore"`
	Page      int        `json:"page"`
}

var markup = regexp.MustCompile(`<[^>]*>`)

func plain(s string) string { return html.UnescapeString(markup.ReplaceAllString(s, "")) }
func imageURL(s string) string {
	if strings.HasPrefix(s, "//") {
		return "https:" + s
	}
	if strings.HasPrefix(s, "http://") {
		return "https://" + strings.TrimPrefix(s, "http://")
	}
	return s
}
func (s *Service) Search(ctx context.Context, keyword, kind string, page int) (SearchPage, error) {
	out := SearchPage{Page: page, Videos: []Video{}, Uploaders: []Uploader{}}
	keyword = strings.TrimSpace(keyword)
	if keyword == "" || len([]rune(keyword)) > 100 || page < 1 {
		return out, errors.New("请输入 1–100 个字符的关键词")
	}
	if kind != "video" && kind != "bili_user" {
		return out, errors.New("搜索类型无效")
	}
	data, err := requestJSON[struct {
		Pages  *int `json:"numPages"`
		Result []struct {
			BV       string      `json:"bvid"`
			Title    string      `json:"title"`
			Author   string      `json:"author"`
			Pic      string      `json:"pic"`
			Duration string      `json:"duration"`
			Mid      json.Number `json:"mid"`
			Name     string      `json:"uname"`
			Avatar   string      `json:"upic"`
		} `json:"result"`
	}](ctx, s, "/x/web-interface/wbi/search/type", url.Values{"keyword": {keyword}, "search_type": {kind}, "page": {strconv.Itoa(page)}, "tids": {"0"}}, true)
	if err != nil {
		return out, err
	}
	if data.Pages == nil {
		return out, errors.New("B站搜索缺少分页信息")
	}
	out.HasMore = page < *data.Pages
	for _, r := range data.Result {
		if kind == "video" {
			if !bvPattern.MatchString(r.BV) {
				continue
			}
			out.Videos = append(out.Videos, Video{r.BV, plain(r.Title), r.Author, imageURL(r.Pic), r.Duration})
		} else {
			if !idPattern.MatchString(string(r.Mid)) {
				continue
			}
			out.Uploaders = append(out.Uploaders, Uploader{string(r.Mid), r.Name, imageURL(r.Avatar)})
		}
	}
	return out, nil
}
func (s *Service) Submissions(ctx context.Context, mid string, page int, keyword string) (SearchPage, error) {
	out := SearchPage{Page: page, Videos: []Video{}, Uploaders: []Uploader{}}
	if !idPattern.MatchString(mid) || page < 1 {
		return out, errors.New("UP 主或页码无效")
	}
	keyword = strings.TrimSpace(keyword)
	if len([]rune(keyword)) > 100 {
		return out, errors.New("投稿关键词不能超过 100 个字符")
	}
	params := url.Values{
		"mid": {mid}, "pn": {strconv.Itoa(page)}, "ps": {"30"}, "order": {"pubdate"}, "tid": {"0"},
		"keyword": {keyword}, "order_avoided": {"true"}, "platform": {"web"}, "web_location": {"333.1387"}, "special_type": {""}, "index": {"0"},
		"dm_img_list": {"[]"},
	}
	// Match yt-dlp's compact dm_* encoding; these compatibility values do not guarantee acceptance.
	const printable = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ \t\n\r\v\f"
	for _, field := range []struct {
		name     string
		min, max int
	}{{"dm_img_str", 16, 64}, {"dm_cover_img_str", 32, 128}} {
		raw := make([]byte, field.min+rand.IntN(field.max-field.min+1))
		for i := range raw {
			raw[i] = printable[rand.IntN(len(printable))]
		}
		encoded := base64.StdEncoding.EncodeToString(raw)
		params.Set(field.name, encoded[:len(encoded)-2])
	}
	// A stable desktop viewport, with the same coordinate encoding used by yt-dlp.
	wh, offset, top := rand.IntN(114), rand.IntN(514), rand.IntN(101)
	params.Set("dm_img_inter", fmt.Sprintf(`{"ds":[],"wh":[%d,%d,%d],"of":[%d,%d,%d]}`, 4680+3*wh, 4860+wh, wh, 3*top+offset, 4*top+2*offset, offset))
	data, err := requestJSON[struct {
		Page struct {
			Count *int `json:"count"`
		} `json:"page"`
		List struct {
			Videos []struct {
				BV     string `json:"bvid"`
				Title  string `json:"title"`
				Author string `json:"author"`
				Pic    string `json:"pic"`
				Length string `json:"length"`
			} `json:"vlist"`
		} `json:"list"`
	}](ctx, s, "/x/space/wbi/arc/search", params, true)
	if err != nil {
		return out, err
	}
	if data.Page.Count == nil {
		return out, errors.New("投稿响应缺少分页信息")
	}
	out.HasMore = page*30 < *data.Page.Count
	for _, v := range data.List.Videos {
		if bvPattern.MatchString(v.BV) {
			out.Videos = append(out.Videos, Video{v.BV, v.Title, v.Author, imageURL(v.Pic), v.Length})
		}
	}
	return out, nil
}

type Collection struct {
	ID    string `json:"id"`
	MID   string `json:"mid"`
	Title string `json:"title"`
	Kind  string `json:"kind"`
}
type Detail struct {
	Tracks     []Track     `json:"tracks"`
	Collection *Collection `json:"collection"`
}

func (s *Service) Detail(ctx context.Context, bv string) (Detail, error) {
	out := Detail{Tracks: []Track{}}
	if !bvPattern.MatchString(bv) {
		return out, errors.New("BV 号无效")
	}
	data, err := requestJSON[struct {
		Title string `json:"title"`
		Pic   string `json:"pic"`
		Owner struct {
			Mid  json.Number `json:"mid"`
			Name string      `json:"name"`
		} `json:"owner"`
		Pages []struct {
			CID      json.Number `json:"cid"`
			Part     string      `json:"part"`
			Page     int         `json:"page"`
			Duration int         `json:"duration"`
		} `json:"pages"`
		Season *struct {
			ID    json.Number `json:"id"`
			Title string      `json:"title"`
			Mid   json.Number `json:"mid"`
		} `json:"ugc_season"`
	}](ctx, s, "/x/web-interface/wbi/view", url.Values{"bvid": {bv}}, true)
	if err != nil {
		return out, err
	}
	for _, p := range data.Pages {
		title := p.Part
		if title == "" {
			title = data.Title
		}
		t := Track{bv, string(p.CID), title, data.Title, data.Owner.Name, imageURL(data.Pic), p.Duration, p.Page}
		if err = validateTrack(t); err != nil {
			return out, err
		}
		out.Tracks = append(out.Tracks, t)
	}
	if len(out.Tracks) == 0 {
		return out, errors.New("该视频没有可选择的分 P")
	}
	if data.Season != nil {
		mid := string(data.Season.Mid)
		if mid == "" || mid == "0" {
			mid = string(data.Owner.Mid)
		}
		out.Collection = &Collection{string(data.Season.ID), mid, data.Season.Title, "season"}
	}
	return out, nil
}

type CollectionPage struct {
	Items   []Collection `json:"items"`
	HasMore bool         `json:"hasMore"`
}

func (s *Service) Collections(ctx context.Context, mid string, page int) (CollectionPage, error) {
	out := CollectionPage{Items: []Collection{}}
	if !idPattern.MatchString(mid) || page < 1 {
		return out, errors.New("UP 主或页码无效")
	}
	type meta struct {
		ID       json.Number `json:"season_id"`
		SeriesID json.Number `json:"series_id"`
		Name     string      `json:"name"`
	}
	type entry struct {
		Meta meta `json:"meta"`
	}
	data, err := requestJSON[struct {
		Items struct {
			Seasons []entry `json:"seasons_list"`
			Series  []entry `json:"series_list"`
			Page    struct {
				Total *int `json:"total"`
			} `json:"page"`
		} `json:"items_lists"`
	}](ctx, s, "/x/polymer/web-space/seasons_series_list", url.Values{"mid": {mid}, "page_num": {strconv.Itoa(page)}, "page_size": {"20"}}, false)
	if err != nil {
		return out, err
	}
	if data.Items.Page.Total == nil {
		return out, errors.New("合集响应缺少分页信息")
	}
	out.HasMore = page*20 < *data.Items.Page.Total
	for _, e := range data.Items.Seasons {
		out.Items = append(out.Items, Collection{string(e.Meta.ID), mid, e.Meta.Name, "season"})
	}
	for _, e := range data.Items.Series {
		out.Items = append(out.Items, Collection{string(e.Meta.SeriesID), mid, e.Meta.Name, "series"})
	}
	return out, nil
}
func (s *Service) CollectionItems(ctx context.Context, c Collection, page int) (SearchPage, error) {
	out := SearchPage{Page: page, Videos: []Video{}, Uploaders: []Uploader{}}
	if !idPattern.MatchString(c.ID) || !idPattern.MatchString(c.MID) || page < 1 {
		return out, errors.New("合集信息无效")
	}
	endpoint := "/x/polymer/web-space/seasons_archives_list"
	params := url.Values{"mid": {c.MID}, "season_id": {c.ID}, "page_num": {strconv.Itoa(page)}, "page_size": {"30"}, "sort_reverse": {"false"}}
	if c.Kind == "series" {
		endpoint = "/x/series/archives"
		params = url.Values{"mid": {c.MID}, "series_id": {c.ID}, "pn": {strconv.Itoa(page)}, "ps": {"30"}, "only_normal": {"true"}, "sort": {"desc"}}
	} else if c.Kind != "season" {
		return out, errors.New("合集类型不支持")
	}
	data, err := requestJSON[struct {
		Archives []struct {
			BV       string `json:"bvid"`
			Title    string `json:"title"`
			Pic      string `json:"pic"`
			Duration int    `json:"duration"`
		} `json:"archives"`
		Page struct {
			Total *int `json:"total"`
		} `json:"page"`
	}](ctx, s, endpoint, params, false)
	if err != nil {
		return out, err
	}
	if data.Page.Total == nil {
		return out, errors.New("合集响应缺少分页信息")
	}
	out.HasMore = page*30 < *data.Page.Total
	for _, v := range data.Archives {
		if bvPattern.MatchString(v.BV) {
			out.Videos = append(out.Videos, Video{v.BV, v.Title, "", imageURL(v.Pic), fmt.Sprintf("%d:%02d", v.Duration/60, v.Duration%60)})
		}
	}
	return out, nil
}
