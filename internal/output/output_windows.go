//go:build windows

package output

import (
	"errors"
	"runtime"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

// Windows has no property listener as cheap as CoreAudio's, so the default
// render endpoint is polled: a headset that is unplugged makes Windows pick
// another endpoint, and the old one no longer resolves.
const (
	pollEvery = 1500 * time.Millisecond
	tornDown  = 300 * time.Millisecond
)

type guid struct {
	data1 uint32
	data2 uint16
	data3 uint16
	data4 [8]byte
}

var (
	ole32                = syscall.NewLazyDLL("ole32.dll")
	procCoInitializeEx   = ole32.NewProc("CoInitializeEx")
	procCoUninitialize   = ole32.NewProc("CoUninitialize")
	procCoCreateInstance = ole32.NewProc("CoCreateInstance")
	procCoTaskMemFree    = ole32.NewProc("CoTaskMemFree")
)

var (
	clsidMMDeviceEnumerator = guid{0xBCDE0395, 0xE52F, 0x467C, [8]byte{0x8E, 0x3D, 0xC4, 0x57, 0x92, 0x91, 0x69, 0x2E}}
	iidIMMDeviceEnumerator  = guid{0xA95664D2, 0x9614, 0x4F35, [8]byte{0xA7, 0x46, 0xDE, 0x8D, 0xB6, 0x36, 0x17, 0xE6}}
)

const (
	clsctxAll = 0x17
	eRender   = 0 // the endpoint sound leaves by
	eConsole  = 0 // the endpoint the system plays through

	// IMMDeviceEnumerator: QueryInterface, AddRef, Release, EnumAudioEndpoints,
	// GetDefaultAudioEndpoint, GetDevice, Register..., Unregister...
	vtGetDefaultAudioEndpoint = 4
	vtGetDevice               = 5
	// IMMDevice: QueryInterface, AddRef, Release, Activate, OpenPropertyStore,
	// GetId, GetState
	vtGetID   = 5
	vtRelease = 2

	coinitMultithreaded = 0
	rpcChangedMode      = 0x80010106
)

// call invokes one COM vtable method. The object stays an unsafe.Pointer so no
// uintptr is turned back into a pointer on the way to the vtable.
func call(object unsafe.Pointer, method int, args ...uintptr) uintptr {
	vtable := *(*unsafe.Pointer)(object)
	fn := *(*uintptr)(unsafe.Add(vtable, uintptr(method)*unsafe.Sizeof(uintptr(0))))
	all := append([]uintptr{uintptr(object)}, args...)
	result, _, _ := syscall.SyscallN(fn, all...)
	return result
}

func release(object unsafe.Pointer) {
	if object != nil {
		call(object, vtRelease)
	}
}

func enumerator() (unsafe.Pointer, error) {
	var object unsafe.Pointer
	status, _, _ := procCoCreateInstance.Call(
		uintptr(unsafe.Pointer(&clsidMMDeviceEnumerator)), 0, clsctxAll,
		uintptr(unsafe.Pointer(&iidIMMDeviceEnumerator)), uintptr(unsafe.Pointer(&object)),
	)
	if int32(status) < 0 || object == nil {
		return nil, errors.New("CoCreateInstance(MMDeviceEnumerator) failed")
	}
	return object, nil
}

// defaultID is the endpoint the system is playing through right now.
func defaultID(enum unsafe.Pointer) (string, bool) {
	var device unsafe.Pointer
	if int32(call(enum, vtGetDefaultAudioEndpoint, eRender, eConsole, uintptr(unsafe.Pointer(&device)))) < 0 || device == nil {
		return "", false
	}
	defer release(device)
	var raw *uint16
	if int32(call(device, vtGetID, uintptr(unsafe.Pointer(&raw)))) < 0 || raw == nil {
		return "", false
	}
	id := utf16String(raw)
	procCoTaskMemFree.Call(uintptr(unsafe.Pointer(raw)))
	return id, true
}

func utf16String(raw *uint16) string {
	if raw == nil {
		return ""
	}
	length := 0
	for at := unsafe.Pointer(raw); *(*uint16)(at) != 0; at = unsafe.Add(at, 2) {
		length++
	}
	return syscall.UTF16ToString(unsafe.Slice(raw, length))
}

// exists reports whether the endpoint is still plugged in.
func exists(enum unsafe.Pointer, id string) bool {
	raw, err := syscall.UTF16PtrFromString(id)
	if err != nil {
		return false
	}
	var device unsafe.Pointer
	if int32(call(enum, vtGetDevice, uintptr(unsafe.Pointer(raw)), uintptr(unsafe.Pointer(&device)))) < 0 || device == nil {
		return false
	}
	release(device)
	return true
}

// Watch calls lost when the endpoint the app was playing through goes away:
// unplugging headphones makes Windows move to another endpoint and the old one
// stops resolving, while plugging headphones in keeps the old one alive.
func Watch(lost func()) (stop func(), err error) {
	ready := make(chan error, 1)
	done := make(chan struct{})
	stopped := make(chan struct{})
	go func() {
		defer close(stopped)
		runtime.LockOSThread()
		defer runtime.UnlockOSThread()
		status, _, _ := procCoInitializeEx.Call(0, coinitMultithreaded)
		if int32(status) < 0 && uint32(status) != rpcChangedMode {
			ready <- errors.New("COM could not be initialized")
			return
		}
		if int32(status) >= 0 {
			defer procCoUninitialize.Call()
		}
		enum, err := enumerator()
		if err != nil {
			ready <- err
			return
		}
		defer release(enum)
		previous, ok := defaultID(enum)
		if !ok {
			ready <- errors.New("no default output device")
			return
		}
		ready <- nil
		ticker := time.NewTicker(pollEvery)
		defer ticker.Stop()
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				current, ok := defaultID(enum)
				if !ok || current == previous {
					continue
				}
				gone := previous
				previous = current
				// the endpoint may take a moment to leave the system
				time.Sleep(tornDown)
				if !exists(enum, gone) {
					lost()
				}
			}
		}
	}()
	if err := <-ready; err != nil {
		return func() {}, err
	}
	var once sync.Once
	return func() { once.Do(func() { close(done); <-stopped }) }, nil
}
