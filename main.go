package main

import (
	_ "embed"
	"log"
	"os"
	"path/filepath"

	"github.com/egoist/mygo"
	"local/shiyin/internal/music"
	"local/shiyin/internal/output"
)

//go:embed assets/tray.png
var trayIcon []byte

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
		dir, err := libraryDirectory(smokeDataDir)
		if err != nil {
			log.Print("资料库目录不可用")
		} else if err = music.Init(service, filepath.Join(dir, "library.sqlite")); err != nil {
			log.Printf("资料库初始化失败：%v", err)
		}
		stop, err := music.StartStreams(service)
		if err != nil {
			log.Print("播放服务启动失败")
		}
		var watchOutput func()
		quitting := false
		mygo.App.OnBeforeQuit(func(e *mygo.QuitEvent) {
			quitting = true
			if stop != nil {
				stop()
			}
			if watchOutput != nil {
				watchOutput()
			}
			music.Close(service)
		})
		win := mygo.NewWindow(mygo.WindowOptions{Title: "拾音", Width: 1440, Height: 900, MinWidth: 760, MinHeight: 620, BackgroundColor: "#ffffff", StateKey: "main", URL: "/"})
		// WebKit keeps playing into the speakers when headphones are unplugged,
		// so the page is told and the player pauses by itself.
		watchOutput, err = output.Watch(func() {
			_, _ = win.Page().Eval(`window.dispatchEvent(new Event("shiyin:output-lost"))`)
		})
		if err != nil {
			log.Printf("输出设备监听失败：%v", err)
		}
		show := func() {
			win.Restore()
			win.Show()
			win.Focus()
		}
		tray, err := mygo.NewTray(mygo.TrayOptions{
			ID: "shiyin", Icon: trayIcon, IconIsTemplate: true, ToolTip: "拾音",
			Menu: mygo.NewMenu([]*mygo.MenuItem{
				{Label: "显示拾音", Click: func(*mygo.MenuItem, *mygo.Window) { show() }},
				mygo.Separator(),
				{Label: "退出拾音", Role: mygo.RoleQuit},
			}),
		})
		if err != nil {
			log.Printf("菜单栏图标创建失败：%v", err)
		} else {
			win.OnClose(func(e *mygo.CloseEvent) {
				if !quitting {
					e.PreventDefault()
					win.Hide()
				}
			})
			mygo.App.OnWillQuit(func(*mygo.QuitEvent) { tray.Destroy() })
		}
		mygo.App.OnActivate(func(visible bool) {
			if !visible {
				show()
			}
		})
		if smokeWindow != nil {
			smokeWindow(win)
		}
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}

// Keep real libraries independent of executable names and build locations.
func libraryDirectory(testDirectory string) (string, error) {
	if testDirectory != "" {
		return testDirectory, os.MkdirAll(testDirectory, 0o700)
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "拾音")
	return dir, os.MkdirAll(dir, 0o700)
}
