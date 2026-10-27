package music

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"

	_ "modernc.org/sqlite"
)

type Track struct {
	BV         string `json:"bv"`
	CID        string `json:"cid"`
	Title      string `json:"title"`
	VideoTitle string `json:"videoTitle"`
	Uploader   string `json:"uploader"`
	Cover      string `json:"cover"`
	Duration   int    `json:"duration"`
	Part       int    `json:"part"`
}
type Playlist struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Tracks []Track `json:"tracks"`
}

var bvPattern = regexp.MustCompile(`^BV[0-9A-Za-z]{10}$`)
var idPattern = regexp.MustCompile(`^[1-9][0-9]{0,19}$`)

func validateTrack(t Track) error {
	if !bvPattern.MatchString(t.BV) || !idPattern.MatchString(t.CID) || strings.TrimSpace(t.Title) == "" || len(t.Title) > 2000 || t.Duration < 0 {
		return errors.New("歌曲信息无效")
	}
	return nil
}
func OpenLibrary(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	fail := func(e error) (*sql.DB, error) { db.Close(); return nil, e }
	if _, err = db.Exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000"); err != nil {
		return fail(err)
	}
	var version int
	if err = db.QueryRow("PRAGMA user_version").Scan(&version); err != nil {
		return fail(err)
	}
	if version > 1 {
		return fail(errors.New("资料库版本高于当前应用；原文件已保留"))
	}
	if version == 0 {
		var tables int
		if err = db.QueryRow("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").Scan(&tables); err != nil {
			return fail(err)
		}
		if tables > 0 {
			return fail(errors.New("无法识别已有资料库；原文件已保留"))
		}
		_, err = db.Exec(`BEGIN;
 CREATE TABLE tracks(bv TEXT NOT NULL,cid TEXT NOT NULL,title TEXT NOT NULL,video_title TEXT NOT NULL,uploader TEXT NOT NULL,cover TEXT NOT NULL,duration INTEGER NOT NULL,part INTEGER NOT NULL,PRIMARY KEY(bv,cid));
 CREATE TABLE playlists(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL);
 CREATE TABLE entries(list_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,bv TEXT NOT NULL,cid TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(list_id,bv,cid),FOREIGN KEY(bv,cid) REFERENCES tracks(bv,cid));
 INSERT INTO playlists(id,name) VALUES(1,'我喜欢'); PRAGMA user_version=1; COMMIT;`)
		if err != nil {
			return fail(err)
		}
	}
	return db, nil
}
func (s *Service) Library(ctx context.Context) ([]Playlist, error) {
	s.libraryMu.Lock()
	defer s.libraryMu.Unlock()
	return s.library(ctx)
}
func (s *Service) library(ctx context.Context) ([]Playlist, error) {
	if s.db == nil {
		return nil, errors.New("资料库未就绪：" + s.initError)
	}
	rows, err := s.db.QueryContext(ctx, "SELECT CAST(id AS TEXT),name FROM playlists ORDER BY id")
	if err != nil {
		return nil, err
	}
	lists := []Playlist{}
	for rows.Next() {
		var p Playlist
		p.Tracks = []Track{}
		if err = rows.Scan(&p.ID, &p.Name); err != nil {
			rows.Close()
			return nil, err
		}
		lists = append(lists, p)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	for i := range lists {
		rows, err = s.db.QueryContext(ctx, `SELECT t.bv,t.cid,t.title,t.video_title,t.uploader,t.cover,t.duration,t.part FROM entries e JOIN tracks t USING(bv,cid) WHERE list_id=? ORDER BY position`, lists[i].ID)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var t Track
			if err = rows.Scan(&t.BV, &t.CID, &t.Title, &t.VideoTitle, &t.Uploader, &t.Cover, &t.Duration, &t.Part); err != nil {
				rows.Close()
				return nil, err
			}
			lists[i].Tracks = append(lists[i].Tracks, t)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	return lists, nil
}
func (s *Service) EditList(ctx context.Context, id, name, action string) ([]Playlist, error) {
	s.libraryMu.Lock()
	defer s.libraryMu.Unlock()
	if s.db == nil {
		return nil, errors.New(s.initError)
	}
	name = strings.TrimSpace(name)
	if action != "delete" && (name == "" || len([]rune(name)) > 80) {
		return nil, errors.New("歌单名称需为 1–80 个字符")
	}
	var err error
	switch action {
	case "create":
		_, err = s.db.ExecContext(ctx, "INSERT INTO playlists(name) VALUES(?)", name)
	case "rename":
		if id == "1" {
			return nil, errors.New("不能重命名我喜欢")
		}
		_, err = s.db.ExecContext(ctx, "UPDATE playlists SET name=? WHERE id=?", name, id)
	case "delete":
		if id == "1" {
			return nil, errors.New("不能删除我喜欢")
		}
		_, err = s.db.ExecContext(ctx, "DELETE FROM playlists WHERE id=?", id)
	default:
		return nil, errors.New("未知歌单操作")
	}
	if err != nil {
		return nil, err
	}
	return s.library(ctx)
}
func (s *Service) AddTracks(ctx context.Context, id string, tracks []Track) ([]Playlist, error) {
	s.libraryMu.Lock()
	defer s.libraryMu.Unlock()
	if s.db == nil {
		return nil, errors.New(s.initError)
	}
	if len(tracks) > 1000 {
		return nil, errors.New("每次最多添加 1000 首")
	}
	for _, t := range tracks {
		if err := validateTrack(t); err != nil {
			return nil, err
		}
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var pos int
	if err = tx.QueryRowContext(ctx, "SELECT COALESCE(MAX(position),-1)+1 FROM entries WHERE list_id=?", id).Scan(&pos); err != nil {
		return nil, err
	}
	for _, t := range tracks {
		_, err = tx.ExecContext(ctx, `INSERT INTO tracks VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(bv,cid) DO UPDATE SET title=excluded.title,video_title=excluded.video_title,uploader=excluded.uploader,cover=excluded.cover,duration=excluded.duration,part=excluded.part`, t.BV, t.CID, t.Title, t.VideoTitle, t.Uploader, t.Cover, t.Duration, t.Part)
		if err != nil {
			return nil, err
		}
		_, err = tx.ExecContext(ctx, "INSERT INTO entries VALUES(?,?,?,?) ON CONFLICT(list_id,bv,cid) DO NOTHING", id, t.BV, t.CID, pos)
		if err != nil {
			return nil, err
		}
		pos++
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.library(ctx)
}
func (s *Service) RemoveTrack(ctx context.Context, id, bv, cid string) ([]Playlist, error) {
	s.libraryMu.Lock()
	defer s.libraryMu.Unlock()
	if s.db == nil {
		return nil, errors.New(s.initError)
	}
	if _, err := s.db.ExecContext(ctx, "DELETE FROM entries WHERE list_id=? AND bv=? AND cid=?", id, bv, cid); err != nil {
		return nil, err
	}
	return s.library(ctx)
}
func (s *Service) MoveTrack(ctx context.Context, id, bv, cid string, offset int) ([]Playlist, error) {
	s.libraryMu.Lock()
	defer s.libraryMu.Unlock()
	if offset != -1 && offset != 1 {
		return nil, errors.New("排序方向无效")
	}
	lists, err := s.library(ctx)
	if err != nil {
		return nil, err
	}
	var items []Track
	for _, p := range lists {
		if p.ID == id {
			items = p.Tracks
		}
	}
	at := -1
	for i, t := range items {
		if t.BV == bv && t.CID == cid {
			at = i
		}
	}
	if at < 0 {
		return nil, fmt.Errorf("歌单中不存在此歌曲")
	}
	next := at + offset
	if next < 0 || next >= len(items) {
		return lists, nil
	}
	items[at], items[next] = items[next], items[at]
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	for i, t := range items {
		if _, err = tx.ExecContext(ctx, "UPDATE entries SET position=? WHERE list_id=? AND bv=? AND cid=?", i, id, t.BV, t.CID); err != nil {
			return nil, err
		}
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.library(ctx)
}
