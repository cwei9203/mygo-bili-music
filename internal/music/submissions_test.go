package music

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func TestSubmissionsRequest(t *testing.T) {
	for _, failure := range []string{"", "412", "-352", "-401"} {
		t.Run("response"+failure, func(t *testing.T) {
			s := NewService()
			s.key, s.keyTime = "test", time.Now()
			calls := 0
			s.client.Transport = transportFunc(func(r *http.Request) (*http.Response, error) {
				calls++
				q := r.URL.Query()
				for k, want := range map[string]string{"mid": "123", "pn": "2", "ps": "30", "tid": "0", "order": "pubdate", "keyword": "夜鹿", "order_avoided": "true", "platform": "web", "web_location": "333.1387", "special_type": "", "index": "0", "dm_img_list": "[]"} {
					if !q.Has(k) || q.Get(k) != want {
						t.Errorf("%s=%q, want %q", k, q.Get(k), want)
					}
				}
				if r.Header.Get("Referer") != "https://space.bilibili.com/123/upload/video" || r.Header.Get("Origin") != "https://space.bilibili.com" || r.Header.Get("Accept-Language") == "" {
					t.Error("missing space headers")
				}
				if q.Get("dm_img_str") == "" || q.Get("dm_cover_img_str") == "" {
					t.Error("missing dm strings")
				}
				var inter struct {
					DS []int  `json:"ds"`
					WH [3]int `json:"wh"`
					OF [3]int `json:"of"`
				}
				if err := json.Unmarshal([]byte(q.Get("dm_img_inter")), &inter); err != nil {
					t.Fatal(err)
				}
				if inter.DS == nil || inter.WH[0]-3*inter.WH[2] != 4680 || inter.WH[1]-inter.WH[2] != 4860 || strings.Contains(q.Get("dm_img_inter"), " ") {
					t.Error("invalid dm coordinates")
				}
				q.Del("w_rid")
				if r.URL.RawQuery != sign(q, "test") {
					t.Error("parameters not included in WBI signature")
				}
				status, body := 200, `{"code":0,"data":{"page":{"count":61},"list":{"vlist":[{"bvid":"BV1xx411c7mD","title":"Music"}]}}}`
				if failure == "412" {
					status = 412
					body = "blocked"
				} else if failure != "" {
					body = `{"code":` + failure + `,"message":"blocked"}`
				}
				return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
			})
			p, err := s.Submissions(context.Background(), "123", 2, " 夜鹿 ")
			if calls != 1 {
				t.Fatal("unexpected retry", calls)
			}
			if failure != "" {
				if err == nil || !strings.Contains(err.Error(), "风控") {
					t.Fatal("missing actionable error", err)
				}
				return
			}
			if err != nil || !p.HasMore || len(p.Videos) != 1 {
				t.Fatal(p, err)
			}
		})
	}
}

func TestLiveAkiSubmissions(t *testing.T) {
	if os.Getenv("SHIYIN_LIVE_AKI") != "1" {
		t.Skip("opt-in live network test")
	}
	s := NewService()
	ctx := context.Background()
	users, err := s.Search(ctx, "aki惊蛰", "bili_user", 1)
	if err != nil {
		t.Fatal(err)
	}
	for _, u := range users.Uploaders {
		if !strings.Contains(strings.ToLower(u.Name), "aki") || !strings.Contains(u.Name, "惊蛰") {
			continue
		}
		t.Logf("matched uploader: %s (%s)", u.Name, u.ID)
		first, err := s.Submissions(ctx, u.ID, 1, os.Getenv("SHIYIN_LIVE_KEYWORD"))
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("page 1: %d videos; hasMore=%v", len(first.Videos), first.HasMore)
		if len(first.Videos) > 0 {
			t.Logf("first result: %s", first.Videos[0].Title)
		}
		if first.HasMore {
			time.Sleep(time.Second)
			second, err := s.Submissions(ctx, u.ID, 2, os.Getenv("SHIYIN_LIVE_KEYWORD"))
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("page 2: %d videos; hasMore=%v", len(second.Videos), second.HasMore)
			if len(first.Videos) > 0 && len(second.Videos) > 0 && first.Videos[0].BV == second.Videos[0].BV {
				t.Fatal("page repeated")
			}
		}
		return
	}
	t.Fatal("matching uploader not found")
}

func TestSubmissionKeywordLimit(t *testing.T) {
	s := NewService()
	if _, err := s.Submissions(context.Background(), "123", 1, strings.Repeat("歌", 101)); err == nil {
		t.Fatal("oversized keyword accepted")
	}
}
