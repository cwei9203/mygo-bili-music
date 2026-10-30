package music

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"net/url"
	"strings"
	"time"
)

// Discovery is the home page's shelf: a random draw from the B站 music zone
// ranking, so a listener with an empty library still has something to play.
const (
	discoverSize = 6
	discoverTTL  = 10 * time.Minute
	musicZone    = "3"
	minSeconds   = 60 // clips shorter than a minute are not music to listen to
)

type rankingVideo struct {
	BV       string `json:"bvid"`
	Title    string `json:"title"`
	Pic      string `json:"pic"`
	Duration int    `json:"duration"`
	Owner    struct {
		Name string `json:"name"`
	} `json:"owner"`
	Stat struct {
		View *int64 `json:"view"`
	} `json:"stat"`
}

type rankingPage struct {
	List []rankingVideo `json:"list"`
}

func (s *Service) fetchMusicRanking(ctx context.Context) ([]Video, error) {
	page, err := requestJSON[rankingPage](ctx, s, "/x/web-interface/ranking/v2",
		url.Values{"rid": {musicZone}, "type": {"all"}}, false)
	if err != nil {
		return nil, err
	}
	videos := rankingVideos(page.List)
	if len(videos) == 0 {
		return nil, errors.New("B站音乐区暂时没有可推荐的视频")
	}
	return videos, nil
}

// rankingVideos keeps only rows that are playable tracks: a valid BV, at least a
// minute long, with a title. Order is the upstream ranking; the caller shuffles.
func rankingVideos(list []rankingVideo) []Video {
	out := make([]Video, 0, len(list))
	for _, item := range list {
		if !bvPattern.MatchString(item.BV) || item.Duration < minSeconds {
			continue
		}
		title := strings.TrimSpace(plain(item.Title))
		if title == "" {
			continue
		}
		out = append(out, Video{
			BV:       item.BV,
			Title:    title,
			Uploader: item.Owner.Name,
			Cover:    imageURL(item.Pic),
			Duration: clock(item.Duration),
			Views:    item.Stat.View,
		})
	}
	return out
}

func clock(seconds int) string {
	if seconds >= 3600 {
		return fmt.Sprintf("%d:%02d:%02d", seconds/3600, seconds%3600/60, seconds%60)
	}
	return fmt.Sprintf("%d:%02d", seconds/60, seconds%60)
}

// Discover returns the next draw of the day's music ranking. The first call of
// each window fetches and shuffles the ranking once; later calls pop from that
// deck, so 换一批 keeps producing unheard rows without touching B站 again.
// A new window, or an exhausted deck, fetches a fresh ranking.
func (s *Service) Discover(ctx context.Context) ([]Video, error) {
	s.discoverMu.Lock()
	defer s.discoverMu.Unlock()
	if len(s.discoverDeck) == 0 || time.Since(s.discoverTime) > discoverTTL {
		fetch := s.discoverFetch
		if fetch == nil {
			fetch = s.fetchMusicRanking
		}
		videos, err := fetch(ctx)
		if err != nil {
			return nil, err
		}
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		rng.Shuffle(len(videos), func(i, j int) { videos[i], videos[j] = videos[j], videos[i] })
		s.discoverDeck = videos
		s.discoverTime = time.Now()
	}
	n := min(discoverSize, len(s.discoverDeck))
	out := make([]Video, n)
	copy(out, s.discoverDeck[:n])
	s.discoverDeck = s.discoverDeck[n:]
	return out, nil
}
