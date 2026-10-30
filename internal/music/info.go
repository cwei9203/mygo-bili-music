package music

import (
	"os"
	"runtime"
	"strings"
)

// Info is what 关于 shows: where this Mac or PC keeps the library, written the
// way that platform writes paths.
type Info struct {
	Library string `json:"library"`
	OS      string `json:"os"`
}

// Info reports the library path, shortened to the platform's own placeholder
// for the folder that holds it.
func (s *Service) Info() Info {
	return Info{Library: displayPath(s.libraryPath), OS: runtime.GOOS}
}

func displayPath(path string) string {
	if path == "" {
		return ""
	}
	if runtime.GOOS == "windows" {
		if base, err := os.UserConfigDir(); err == nil {
			if rest, ok := strings.CutPrefix(path, base+`\`); ok {
				return `%AppData%\` + rest
			}
		}
		return path
	}
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		if rest, ok := strings.CutPrefix(path, home+"/"); ok {
			return "~/" + rest
		}
	}
	return path
}
