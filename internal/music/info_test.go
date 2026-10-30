package music

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

// 关于 writes the library path the way the platform does: a home-relative path
// on macOS and Linux, %AppData% on Windows.
func TestDisplayPath(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("the Windows form needs a Windows home")
	}
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		t.Skip("no home directory")
	}
	path := filepath.Join(home, "Library", "Application Support", "拾音", "library.sqlite")
	if got, want := displayPath(path), "~/Library/Application Support/拾音/library.sqlite"; got != want {
		t.Errorf("displayPath = %q, want %q", got, want)
	}
	if got := displayPath("relative/library.sqlite"); got != "relative/library.sqlite" {
		t.Errorf("a path outside the home is unchanged, got %q", got)
	}
	if got := displayPath(""); got != "" {
		t.Errorf("displayPath(\"\") = %q", got)
	}
}
