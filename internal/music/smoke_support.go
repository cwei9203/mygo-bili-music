//go:build smoke

package music

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type smokeTransport func(*http.Request) (*http.Response, error)

func (f smokeTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func ConfigureSmoke(s *Service) {
	s.key = "smoke"
	s.keyTime = time.Now()
	var mu sync.Mutex
	firstTrackRequests := 0
	s.client.Transport = smokeTransport(func(r *http.Request) (*http.Response, error) {
		body := `{"code":0,"data":{}}`
		switch r.URL.Path {
		case "/x/web-interface/wbi/search/type":
			body = `{"code":0,"data":{"numPages":1,"result":[{"bvid":"BV1xx411c7mD","title":"Smoke video","author":"Test","duration":"00:08"},{"bvid":"BV1xx411c7mE","title":"Single video","author":"Test","duration":"00:08"}]}}`
		case "/x/web-interface/wbi/view":
			body = `{"code":0,"data":{"title":"Smoke video","owner":{"mid":1,"name":"Test"},"pages":[{"cid":9007199254740993,"part":"P1","page":1,"duration":8},{"cid":9007199254740994,"part":"P2","page":2,"duration":8}]}}`
			if r.URL.Query().Get("bvid") == "BV1xx411c7mE" {
				body = `{"code":0,"data":{"title":"Single video","owner":{"mid":1,"name":"Test"},"pages":[{"cid":123,"part":"Single video","page":1,"duration":8}],"ugc_season":{"id":1,"mid":1,"title":"Single collection"}}}`
			}
		case "/x/player/wbi/playurl":
			count := 0
			if r.URL.Query().Get("cid") == "9007199254740993" {
				mu.Lock()
				firstTrackRequests++
				count = firstTrackRequests
				mu.Unlock()
			}
			if count == 1 {
				time.Sleep(600 * time.Millisecond)
			}
			body = `{"code":0,"data":{"dash":{"audio":[{"baseUrl":"https://smoke.bilivideo.com/audio.m4a","bandwidth":96000,"codecs":"mp4a.40.2"}]}}}`
			if count >= 3 {
				body = `{"code":-404,"message":"test playback failure"}`
			}
		}
		return &http.Response{StatusCode: 200, Header: http.Header{"Content-Type": {"application/json"}}, Body: io.NopCloser(strings.NewReader(body))}, nil
	})
	files := http.FileServer(http.Dir(filepath.Join(os.TempDir(), "shiyin-media-fixtures")))
	s.media.Transport = smokeTransport(func(r *http.Request) (*http.Response, error) {
		copy := r.Clone(r.Context())
		copy.URL = &url.URL{Path: r.URL.Path}
		w := httptest.NewRecorder()
		files.ServeHTTP(w, copy)
		return w.Result(), nil
	})
}
