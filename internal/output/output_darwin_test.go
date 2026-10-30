//go:build darwin

package output

import "testing"

// The binding has to resolve the framework and read a property; the listener
// itself is only exercised by unplugging real hardware.
func TestDefaultOutputReadable(t *testing.T) {
	c, err := load()
	if err != nil {
		t.Fatalf("CoreAudio: %v", err)
	}
	device, ok := c.scalar(systemObject, defaultOutput)
	if !ok {
		t.Fatal("kAudioHardwarePropertyDefaultOutputDevice is unreadable")
	}
	if device == 0 {
		t.Fatal("the system reports no default output device")
	}
}
