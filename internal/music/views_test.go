package music

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestVideoViews(t *testing.T) {
	for _, count := range []string{"null", "0", "123456"} {
		for _, source := range []string{"search", "submissions", "season", "series"} {
			t.Run(source+"/"+count, func(t *testing.T) {
				s := NewService()
				s.key, s.keyTime = "test", time.Now()
				s.client.Transport = transportFunc(func(r *http.Request) (*http.Response, error) {
					video := fmt.Sprintf(`{"bvid":"BV1xx411c7mD","title":"Music","play":%s,"stat":{"view":%s}}`, count, count)
					data := `{"numPages":1,"result":[` + video + `]}`
					if source == "submissions" {
						data = `{"page":{"count":1},"list":{"vlist":[` + video + `]}}`
					}
					if source == "season" || source == "series" {
						data = `{"page":{"total":1},"archives":[` + video + `]}`
					}
					return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"code":0,"data":` + data + `}`))}, nil
				})
				var page SearchPage
				var err error
				switch source {
				case "search":
					page, err = s.Search(context.Background(), "music", "video", 1)
				case "submissions":
					page, err = s.Submissions(context.Background(), "1", 1, "")
				default:
					page, err = s.CollectionItems(context.Background(), Collection{ID: "1", MID: "2", Kind: source}, 1)
				}
				if err != nil || len(page.Videos) != 1 {
					t.Fatalf("%+v %v", page, err)
				}
				views := page.Videos[0].Views
				if count == "null" {
					if views != nil {
						t.Fatal("missing count became zero")
					}
				} else if views == nil || fmt.Sprint(*views) != count {
					t.Fatalf("wrong views: %v", views)
				}
			})
		}
	}
}
