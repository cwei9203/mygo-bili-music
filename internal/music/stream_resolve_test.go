package music

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestResolveUsesSupportedBackup(t *testing.T) {
	for _, tc := range []struct {
		name, data string
		mixed      bool
	}{
		{"dashCamel", `{"dash":{"audio":[{"baseUrl":"https://edge.mountaintoys.cn:4483/a","backupUrl":["https://evilbilivideo.com/a","https://backup.bilivideo.com/a"],"codecs":"mp4a.40.2","bandwidth":100}]}}`, false},
		{"dashSnake", `{"dash":{"audio":[{"base_url":"https://edge.bilivideo.cn:8082/a","backup_url":["https://backup.bilivideo.com/a"],"codecs":"mp4a.40.2","bandwidth":100}]}}`, false},
		{"mixed", `{"durl":[{"url":"https://edge.mountaintoys.cn:4483/a","backup_url":["https://backup.bilivideo.com/a"]}]}`, true},
		{"primary", `{"dash":{"audio":[{"baseUrl":"https://backup.bilivideo.com/a","backupUrl":["https://other.bilivideo.com/a"],"codecs":"mp4a.40.2"}]}}`, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := NewService()
			s.key, s.keyTime = "test", time.Now()
			calls := 0
			s.client.Transport = transportFunc(func(r *http.Request) (*http.Response, error) {
				calls++
				return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"code":0,"data":` + tc.data + `}`))}, nil
			})
			s.media.Transport = transportFunc(func(r *http.Request) (*http.Response, error) {
				if r.URL.Host != "backup.bilivideo.com" {
					t.Fatalf("unexpected media host %s", r.URL.Host)
				}
				return &http.Response{StatusCode: 206, Body: io.NopCloser(strings.NewReader("\x00\x00\x00\x18ftypisom0000"))}, nil
			})
			result, err := s.Resolve(context.Background(), "BV1xx411c7mD", "123")
			if err != nil || result.Mixed != tc.mixed || result.URL == "" {
				t.Fatalf("%+v %v", result, err)
			}
			if calls != 1 {
				t.Fatalf("unnecessary fallback requests: %d", calls)
			}
		})
	}
	if supportedMedia([]string{"https://127.0.0.1/a", "https://evilbilivideo.com/a"}) != "" {
		t.Fatal("accepted invalid backup")
	}
}
