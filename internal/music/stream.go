package music

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type stream struct {
	URL     string
	Created time.Time
	Mixed   bool
}
type Playback struct {
	URL   string `json:"url"`
	Mixed bool   `json:"mixed"`
}

func validMedia(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.User != nil || u.Port() != "" {
		return false
	}
	host := u.Hostname()
	return strings.HasSuffix(host, ".bilivideo.com") || strings.HasSuffix(host, ".bilivideo.cn") || strings.HasSuffix(host, ".akamaized.net")
}
func StartStreams(s *Service) (func(), error) {
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	s.baseURL = "http://" + listener.Addr().String()
	server := &http.Server{Handler: http.HandlerFunc(s.serveStream), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 30 * time.Second}
	go server.Serve(listener)
	return func() { server.Close() }, nil
}
func (s *Service) Resolve(ctx context.Context, bv, cid string) (Playback, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	if !bvPattern.MatchString(bv) || !idPattern.MatchString(cid) {
		return Playback{}, errors.New("歌曲标识无效")
	}
	type segment struct {
		URL       string   `json:"url"`
		BackupURL []string `json:"backup_url"`
	}
	type audio struct {
		URL            string   `json:"baseUrl"`
		SnakeURL       string   `json:"base_url"`
		BackupURL      []string `json:"backupUrl"`
		SnakeBackupURL []string `json:"backup_url"`
		Bandwidth      int      `json:"bandwidth"`
		Codecs         string   `json:"codecs"`
	}
	type response struct {
		Dash *struct {
			Audio []audio `json:"audio"`
		} `json:"dash"`
		DURL []segment `json:"durl"`
	}
	params := url.Values{"bvid": {bv}, "cid": {cid}, "fnval": {"4048"}, "fnver": {"0"}, "fourk": {"0"}, "qn": {"80"}}
	data, err := requestJSON[response](ctx, s, "/x/player/wbi/playurl", params, true)
	if err != nil {
		return Playback{}, err
	}
	dest := ""
	mixed := false
	bandwidth := 0
	if data.Dash != nil {
		for _, a := range data.Dash.Audio {
			if a.Codecs != "" && !strings.HasPrefix(a.Codecs, "mp4a") {
				continue
			}
			candidates := append([]string{a.URL, a.SnakeURL}, a.BackupURL...)
			candidates = append(candidates, a.SnakeBackupURL...)
			u := supportedMedia(candidates)
			if u != "" && (dest == "" || a.Bandwidth > bandwidth) {
				dest = u
				bandwidth = a.Bandwidth
			}
		}
	}
	if dest == "" {
		if len(data.DURL) == 0 {
			params.Set("fnval", "1")
			params.Set("qn", "32")
			data, err = requestJSON[response](ctx, s, "/x/player/wbi/playurl", params, true)
			if err != nil {
				return Playback{}, err
			}
		}
		if len(data.DURL) != 1 {
			return Playback{}, errors.New("没有可播放的音频或单段混合流")
		}
		dest = supportedMedia(append([]string{data.DURL[0].URL}, data.DURL[0].BackupURL...))
		mixed = true
	}
	if !validMedia(dest) {
		return Playback{}, errors.New("B站返回的主备播放地址均不可用，请稍后重试")
	}
	probe, err := http.NewRequestWithContext(ctx, "GET", dest, nil)
	if err != nil {
		return Playback{}, errors.New("媒体地址无效")
	}
	probe.Header.Set("User-Agent", userAgent)
	probe.Header.Set("Referer", "https://www.bilibili.com/")
	probe.Header.Set("Range", "bytes=0-31")
	probeResponse, err := s.media.Do(probe)
	if err != nil {
		return Playback{}, errors.New("媒体连接失败")
	}
	head, readErr := io.ReadAll(io.LimitReader(probeResponse.Body, 32))
	probeResponse.Body.Close()
	if readErr != nil || (probeResponse.StatusCode != 200 && probeResponse.StatusCode != 206) {
		return Playback{}, fmt.Errorf("媒体请求失败 HTTP %d", probeResponse.StatusCode)
	}
	if len(head) < 12 || (string(head[4:8]) != "ftyp" && string(head[4:8]) != "styp") {
		return Playback{}, errors.New("媒体容器不支持；仅支持 MP4/AAC，不会自动转码")
	}
	token := make([]byte, 24)
	if _, err = rand.Read(token); err != nil {
		return Playback{}, err
	}
	id := hex.EncodeToString(token)
	s.streamsMu.Lock()
	for key, v := range s.streams {
		if time.Since(v.Created) > time.Minute*30 {
			delete(s.streams, key)
		}
	}
	s.streams[id] = stream{dest, time.Now(), mixed}
	s.streamsMu.Unlock()
	return Playback{s.baseURL + "/stream/" + id, mixed}, nil
}
func (s *Service) ReleaseStream(raw string) {
	if !strings.HasPrefix(raw, s.baseURL+"/stream/") {
		return
	}
	id := strings.TrimPrefix(raw, s.baseURL+"/stream/")
	s.streamsMu.Lock()
	delete(s.streams, id)
	s.streamsMu.Unlock()
}
func (s *Service) serveStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "HEAD" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if r.Host != strings.TrimPrefix(s.baseURL, "http://") {
		http.Error(w, "invalid host", http.StatusForbidden)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/stream/")
	s.streamsMu.Lock()
	item, ok := s.streams[id]
	s.streamsMu.Unlock()
	if !ok {
		http.NotFound(w, r)
		return
	}
	req, err := http.NewRequestWithContext(r.Context(), r.Method, item.URL, nil)
	if err != nil {
		http.Error(w, "invalid stream", 502)
		return
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Referer", "https://www.bilibili.com/")
	req.Header.Set("Accept-Encoding", "identity")
	if value := r.Header.Get("Range"); value != "" {
		req.Header.Set("Range", value)
	}
	if value := r.Header.Get("If-Range"); value != "" {
		req.Header.Set("If-Range", value)
	}

	res, err := s.media.Do(req)
	if err != nil {
		http.Error(w, "媒体请求失败", 502)
		return
	}
	defer res.Body.Close()
	for _, h := range []string{"Content-Type", "Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"} {
		if v := res.Header.Get(h); v != "" {
			w.Header().Set(h, v)
		}
	}
	if res.StatusCode == 200 || res.StatusCode == 206 {
		mime := "audio/mp4"
		if item.Mixed {
			mime = "video/mp4"
		}
		w.Header().Set("Content-Type", mime)
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(res.StatusCode)
	if r.Method != "HEAD" {
		io.Copy(w, res.Body)
	}
}
func (s *Service) Probe(ctx context.Context) error {
	_, err := s.wbi(ctx)
	if err != nil {
		return fmt.Errorf("访客连接：%w", err)
	}
	return nil
}

func newMediaClient() *http.Client {
	return &http.Client{Timeout: 0, Transport: &http.Transport{Proxy: http.ProxyFromEnvironment, ResponseHeaderTimeout: 20 * time.Second, DisableKeepAlives: true}, CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 5 || !validMedia(req.URL.String()) {
			return errors.New("unsupported media redirect")
		}
		return nil
	}}
}

func supportedMedia(candidates []string) string {
	for _, candidate := range candidates {
		if validMedia(candidate) {
			return candidate
		}
	}
	return ""
}
