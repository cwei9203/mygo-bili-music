package music

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestLibraryPartsAndReopen(t *testing.T) {
	ctx := context.Background()
	p := filepath.Join(t.TempDir(), "library.sqlite")
	s := NewService()
	if err := Init(s, p); err != nil {
		t.Fatal(err)
	}
	tracks := []Track{{BV: "BV1xx411c7mD", CID: "9007199254740993", Title: "P1", Part: 1}, {BV: "BV1xx411c7mD", CID: "9007199254740994", Title: "P2", Part: 2}}
	lists, err := s.AddTracks(ctx, "1", tracks)
	if err != nil {
		t.Fatal(err)
	}
	if len(lists[0].Tracks) != 2 {
		t.Fatal(lists)
	}
	lists, err = s.AddTracks(ctx, "1", tracks)
	if err != nil || len(lists[0].Tracks) != 2 {
		t.Fatal("duplicate membership", err)
	}
	_, err = s.MoveTrack(ctx, "1", tracks[1].BV, tracks[1].CID, -1)
	if err != nil {
		t.Fatal(err)
	}
	_, err = s.AddTracks(ctx, "999", []Track{{BV: "BV1xx411c7mD", CID: "3", Title: "rollback"}})
	if err == nil {
		t.Fatal("missing parent should fail")
	}
	var count int
	if err = s.db.QueryRow("SELECT count(*) FROM tracks WHERE cid='3'").Scan(&count); err != nil || count != 0 {
		t.Fatal("transaction did not roll back", err)
	}
	Close(s)
	s = NewService()
	if err = Init(s, p); err != nil {
		t.Fatal(err)
	}
	defer Close(s)
	lists, err = s.Library(ctx)
	if err != nil || lists[0].Tracks[0].CID != tracks[1].CID {
		t.Fatal("restart identity/order lost", err)
	}
}
func TestPreserveInvalidDatabase(t *testing.T) {
	p := filepath.Join(t.TempDir(), "bad.sqlite")
	original := []byte("not a database")
	os.WriteFile(p, original, 0600)
	if db, err := OpenLibrary(p); err == nil {
		db.Close()
		t.Fatal("accepted corrupt database")
	}
	after, _ := os.ReadFile(p)
	if string(after) != string(original) {
		t.Fatal("overwrote invalid database")
	}
}
func TestRejectNewerSchema(t *testing.T) {
	p := filepath.Join(t.TempDir(), "new.sqlite")
	db, err := OpenLibrary(p)
	if err != nil {
		t.Fatal(err)
	}
	db.Exec("PRAGMA user_version=999")
	db.Close()
	if db, err = OpenLibrary(p); err == nil {
		db.Close()
		t.Fatal("accepted newer schema")
	}
}
func TestSigningAndMediaBoundary(t *testing.T) {
	q := sign(url.Values{"foo": {"a b!'()*"}, "wts": {"1"}}, "key")
	if !strings.HasPrefix(q, "foo=a%20b&wts=1&w_rid=") {
		t.Fatal(q)
	}
	for _, u := range []string{"https://127.0.0.1/a", "https://evilbilivideo.com/a", "http://a.bilivideo.com/a", "https://a.bilivideo.com:443/a", "https://name@a.bilivideo.com/a"} {
		if validMedia(u) {
			t.Fatal(u)
		}
	}
	if !validMedia("https://a.bilivideo.com/audio.m4s") {
		t.Fatal("valid CDN rejected")
	}
}
func TestGuestAPIs(t *testing.T) {
	if os.Getenv("SHIYIN_LIVE_TEST") != "1" {
		t.Skip("opt-in live network test")
	}
	s := NewService()
	ctx := context.Background()
	users, err := s.Search(ctx, "哔哩哔哩", "bili_user", 1)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("uploader search: %d", len(users.Uploaders))
	if len(users.Uploaders) == 0 {
		t.Fatal("no uploader")
	}
	videos, err := s.Search(ctx, "纯音乐", "video", 1)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("video search: %d, hasMore %v", len(videos.Videos), videos.HasMore)
	if len(videos.Videos) == 0 {
		t.Fatal("no video")
	}
	detail, err := s.Detail(ctx, videos.Videos[0].BV)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("parts: %d", len(detail.Tracks))
	t.Run("playurl", func(t *testing.T) {
		stop, err := StartStreams(s)
		if err != nil {
			t.Fatal(err)
		}
		defer stop()
		result, err := s.Resolve(ctx, detail.Tracks[0].BV, detail.Tracks[0].CID)
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("resolved local stream; mixed=%v", result.Mixed)
	})
	t.Run("submissions", func(t *testing.T) {
		p, err := s.Submissions(ctx, users.Uploaders[0].ID, 1, "")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("submissions: %d, hasMore %v", len(p.Videos), p.HasMore)
	})
	t.Run("collections", func(t *testing.T) {
		p, err := s.Collections(ctx, users.Uploaders[0].ID, 1)
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("collections: %d", len(p.Items))
		if len(p.Items) > 0 {
			v, err := s.CollectionItems(ctx, p.Items[0], 1)
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("collection videos: %d", len(v.Videos))
		}
	})
}

type transportFunc func(*http.Request) (*http.Response, error)

func (f transportFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestRangeProxy(t *testing.T) {
	s := NewService()
	s.baseURL = "http://127.0.0.1:1234"
	s.streams["token"] = stream{URL: "https://a.bilivideo.com/audio.m4s"}
	s.media = &http.Client{Transport: transportFunc(func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("Range") != "bytes=10-19" || r.Header.Get("Referer") != "https://www.bilibili.com/" {
			t.Error("missing playback headers")
		}
		return &http.Response{StatusCode: 206, Header: http.Header{"Content-Range": {"bytes 10-19/100"}, "Content-Length": {"10"}, "Accept-Ranges": {"bytes"}}, Body: io.NopCloser(strings.NewReader("0123456789"))}, nil
	})}
	r := httptest.NewRequest("GET", s.baseURL+"/stream/token", nil)
	r.Header.Set("Range", "bytes=10-19")
	w := httptest.NewRecorder()
	s.serveStream(w, r)
	if w.Code != 206 || w.Header().Get("Content-Range") != "bytes 10-19/100" || w.Body.String() != "0123456789" {
		t.Fatal("range semantics lost")
	}
	s.ReleaseStream(s.baseURL + "/stream/token")
	w = httptest.NewRecorder()
	s.serveStream(w, r)
	if w.Code != 404 {
		t.Fatal("released stream still reachable")
	}
}
func TestSearchPaginationUsesUpstreamCount(t *testing.T) {
	s := NewService()
	s.key = "test"
	s.keyTime = time.Now()
	s.client = &http.Client{Transport: transportFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Query().Get("tids") != "0" {
			t.Error("search restricted category")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"code":0,"data":{"numPages":3,"result":[{"bvid":"invalid","title":"invalid"},{"bvid":"BV1xx411c7mD","title":"<em>Title</em>"}]}}`))}, nil
	})}
	p, err := s.Search(context.Background(), "Title", "video", 1)
	if err != nil || !p.HasMore || len(p.Videos) != 1 || p.Videos[0].Title != "Title" {
		t.Fatal("filtered short page incorrectly exhausted", err, p)
	}
}
