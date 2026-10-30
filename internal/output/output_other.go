//go:build !darwin && !windows

package output

// Watch has nothing to watch outside macOS and Windows: only CoreAudio and the
// Windows audio endpoints report the output route this app needs.
func Watch(lost func()) (stop func(), err error) { return func() {}, nil }
