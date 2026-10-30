package music

import (
	"context"
	"errors"
	"testing"
	"time"
)

func rankingItem(bv, title string, seconds int, views int64) rankingVideo {
	item := rankingVideo{BV: bv, Title: title, Pic: "http://i0.hdslb.com/a.jpg", Duration: seconds}
	item.Owner.Name = "某 UP"
	item.Stat.View = &views
	return item
}

func TestRankingVideosKeepsPlayableTracks(t *testing.T) {
	videos := rankingVideos([]rankingVideo{
		rankingItem("BV17VZpY1ENA", "真的一首歌", 243, 17871142),
		rankingItem("BV17VZpY1ENB", "十五秒的广告", 15, 100),
		rankingItem("not-a-bv", "无效编号", 200, 100),
		rankingItem("BV17VZpY1ENC", "   ", 200, 100),
		rankingItem("BV17VZpY1END", "一小时现场", 3619, 0),
	})
	if len(videos) != 2 {
		t.Fatalf("want 2 playable rows, got %d: %+v", len(videos), videos)
	}
	if videos[0].Duration != "4:03" || videos[0].Uploader != "某 UP" || videos[0].Views == nil || *videos[0].Views != 17871142 {
		t.Fatalf("first row mapped wrong: %+v", videos[0])
	}
	if videos[0].Cover != "https://i0.hdslb.com/a.jpg" {
		t.Fatalf("cover should be upgraded to https: %q", videos[0].Cover)
	}
	if videos[1].Duration != "1:00:19" {
		t.Fatalf("long duration should keep hours: %q", videos[1].Duration)
	}
}

func TestClock(t *testing.T) {
	cases := map[int]string{0: "0:00", 59: "0:59", 60: "1:00", 243: "4:03", 3600: "1:00:00", 3661: "1:01:01"}
	for seconds, want := range cases {
		if got := clock(seconds); got != want {
			t.Fatalf("clock(%d) = %q, want %q", seconds, got, want)
		}
	}
}

func TestDiscoverServesTheDeckBeforeFetchingAgain(t *testing.T) {
	s := NewService()
	fetches := 0
	pool := []Video{
		{BV: "BV1aa411c7m1"}, {BV: "BV1aa411c7m2"}, {BV: "BV1aa411c7m3"}, {BV: "BV1aa411c7m4"},
		{BV: "BV1aa411c7m5"}, {BV: "BV1aa411c7m6"}, {BV: "BV1aa411c7m7"}, {BV: "BV1aa411c7m8"},
	}
	s.discoverFetch = func(context.Context) ([]Video, error) {
		fetches++
		return append([]Video(nil), pool...), nil
	}
	ctx := context.Background()

	seen := map[string]bool{}
	first, err := s.Discover(ctx)
	if err != nil || len(first) != discoverSize || fetches != 1 {
		t.Fatalf("first draw: %v %d %d", err, len(first), fetches)
	}
	for _, v := range first {
		seen[v.BV] = true
	}
	second, err := s.Discover(ctx)
	if err != nil || len(second) != 2 || fetches != 1 {
		t.Fatalf("the deck should serve the rest without refetching: %v %d %d", err, len(second), fetches)
	}
	for _, v := range second {
		if seen[v.BV] {
			t.Fatalf("a draw repeated %s before the deck ran out", v.BV)
		}
	}
	third, err := s.Discover(ctx)
	if err != nil || len(third) != discoverSize || fetches != 2 {
		t.Fatalf("an empty deck should refetch: %v %d %d", err, len(third), fetches)
	}
}

func TestDiscoverRefreshesAfterTheWindow(t *testing.T) {
	s := NewService()
	fetches := 0
	s.discoverFetch = func(context.Context) ([]Video, error) {
		fetches++
		return []Video{{BV: "BV1aa411c7m1"}, {BV: "BV1aa411c7m2"}}, nil
	}
	if _, err := s.Discover(context.Background()); err != nil || fetches != 1 {
		t.Fatalf("first fetch: %v %d", err, fetches)
	}
	s.discoverTime = time.Now().Add(-discoverTTL - time.Minute)
	if _, err := s.Discover(context.Background()); err != nil || fetches != 2 {
		t.Fatalf("an expired window should refetch: %v %d", err, fetches)
	}
}

func TestDiscoverReportsUpstreamFailure(t *testing.T) {
	s := NewService()
	s.discoverFetch = func(context.Context) ([]Video, error) {
		return nil, errors.New("B站风控暂时拦截了请求（HTTP 412），请稍后重试")
	}
	if _, err := s.Discover(context.Background()); err == nil {
		t.Fatal("a failed fetch must surface, not fabricate recommendations")
	}
	if len(s.discoverDeck) != 0 {
		t.Fatal("a failed fetch must not leave a partial deck")
	}
}
