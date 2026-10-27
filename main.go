package main

import (
	"log"
	"path/filepath"

	"github.com/egoist/mygo"
	"local/shiyin/internal/music"
)

var smokeWindow func(*mygo.Window)
var smokeService func(*music.Service)
var smokeDataDir string

func main() {
	service := music.NewService()
	if smokeService != nil {
		smokeService(service)
	}
	mygo.Bind(service)
	mygo.App.WhenReady(func() {
		dir, err := mygo.App.Path(mygo.PathUserData)
		if smokeDataDir != "" {
			dir = smokeDataDir
		}
		if err != nil {
			log.Print("资料库目录不可用")
		} else if err = music.Init(service, filepath.Join(dir, "library.sqlite")); err != nil {
			log.Printf("资料库初始化失败：%v", err)
		}
		stop, err := music.StartStreams(service)
		if err != nil {
			log.Print("播放服务启动失败")
		}
		mygo.App.OnBeforeQuit(func(e *mygo.QuitEvent) {
			if stop != nil {
				stop()
			}
			music.Close(service)
		})
		win := mygo.NewWindow(mygo.WindowOptions{Title: "拾音", Width: 1440, Height: 900, MinWidth: 760, MinHeight: 620, BackgroundColor: "#ffffff", StateKey: "main", URL: "/"})
		if smokeWindow != nil {
			smokeWindow(win)
		}
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
