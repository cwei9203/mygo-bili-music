//go:build darwin

// Package output watches the Mac's default audio output device so playback can
// stop when the device it was using disappears. WebKit keeps playing through
// the speakers after headphones are unplugged; the apps that stop (Music,
// Spotify) listen to CoreAudio themselves, and so does this.
package output

import (
	"errors"
	"sync"
	"time"
	"unsafe"

	"github.com/ebitengine/purego"
)

// propertyAddress mirrors CoreAudio's AudioObjectPropertyAddress.
type propertyAddress struct {
	selector uint32
	scope    uint32
	element  uint32
}

const (
	systemObject = 1
	scopeGlobal  = 0x676c6f62 // 'glob'
	elementMain  = 0
	// kAudioHardwarePropertyDefaultOutputDevice
	defaultOutput = 0x644f7574 // 'dOut'
	// kAudioDevicePropertyDeviceIsAlive
	isAlive = 0x6c69766e // 'livn'
	// how long a removed device may linger before CoreAudio drops it
	tornDown = 300 * time.Millisecond
)

type coreAudio struct {
	get    func(object uint32, addr *propertyAddress, size uint32, qualifier unsafe.Pointer, ioSize *uint32, data unsafe.Pointer) int32
	add    func(object uint32, addr *propertyAddress, listener uintptr, data unsafe.Pointer) int32
	remove func(object uint32, addr *propertyAddress, listener uintptr, data unsafe.Pointer) int32
}

func load() (*coreAudio, error) {
	handle, err := purego.Dlopen("/System/Library/Frameworks/CoreAudio.framework/CoreAudio", purego.RTLD_NOW)
	if err != nil {
		return nil, err
	}
	c := &coreAudio{}
	purego.RegisterLibFunc(&c.get, handle, "AudioObjectGetPropertyData")
	purego.RegisterLibFunc(&c.add, handle, "AudioObjectAddPropertyListener")
	purego.RegisterLibFunc(&c.remove, handle, "AudioObjectRemovePropertyListener")
	return c, nil
}

// scalar reads one UInt32 property; ok is false when the object no longer
// exists, which is what a removed device answers.
func (c *coreAudio) scalar(object, selector uint32) (value uint32, ok bool) {
	addr := propertyAddress{selector, scopeGlobal, elementMain}
	size := uint32(4)
	status := c.get(object, &addr, 0, nil, &size, unsafe.Pointer(&value))
	return value, status == 0
}

// Watch calls lost when the default output device goes away: unplugging
// headphones or losing a Bluetooth speaker destroys the device, while plugging
// headphones in only moves the default to a device that stays alive.
func Watch(lost func()) (stop func(), err error) {
	c, err := load()
	if err != nil {
		return nil, err
	}
	previous, ok := c.scalar(systemObject, defaultOutput)
	if !ok {
		return func() {}, nil
	}
	var mu sync.Mutex
	addr := propertyAddress{defaultOutput, scopeGlobal, elementMain}
	listener := purego.NewCallback(func(uint32, uint32, uintptr, uintptr) int32 {
		mu.Lock()
		gone, next := previous, uint32(0)
		next, _ = c.scalar(systemObject, defaultOutput)
		previous = next
		mu.Unlock()
		if gone == 0 || gone == next {
			return 0
		}
		// CoreAudio may post the change before the device is torn down.
		go func() {
			time.Sleep(tornDown)
			if alive, ok := c.scalar(gone, isAlive); !ok || alive == 0 {
				lost()
			}
		}()
		return 0
	})
	if status := c.add(systemObject, &addr, listener, nil); status != 0 {
		return nil, errors.New("CoreAudio refused the output device listener")
	}
	return func() { c.remove(systemObject, &addr, listener, nil) }, nil
}
