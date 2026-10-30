package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/egoist/mygo"
)

func TestLibraryDirectoryStableAcrossBuilds(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("XDG_CONFIG_HOME", filepath.Join(home, "config"))
	t.Setenv("AppData", filepath.Join(home, "AppData"))
	base, err := os.UserConfigDir()
	if err != nil {
		t.Fatal(err)
	}
	oldName := mygo.App.Name()
	t.Cleanup(func() { mygo.App.SetName(oldName) })
	for _, name := range []string{"拾音", "shiyin-dev-123", "renamed-build"} {
		mygo.App.SetName(name)
		dir, err := libraryDirectory("")
		if err != nil || dir != filepath.Join(base, "拾音") {
			t.Fatalf("name %q: %q, %v", name, dir, err)
		}
		if _, err := os.Stat(dir); err != nil {
			t.Fatal(err)
		}
	}
	isolated := filepath.Join(t.TempDir(), "smoke")
	dir, err := libraryDirectory(isolated)
	if err != nil || dir != isolated {
		t.Fatalf("smoke: %q, %v", dir, err)
	}
}
