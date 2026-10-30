//go:build smoke

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"time"

	"github.com/egoist/mygo"
	"local/shiyin/internal/music"
)

func init() {
	smokeService = music.ConfigureSmoke
	var err error
	smokeDataDir, err = os.MkdirTemp("", "shiyin-smoke-db-")
	if err != nil {
		panic(err)
	}
	smokeWindow = func(win *mygo.Window) {
		fixtures := filepath.Join(os.TempDir(), "shiyin-media-fixtures")
		server := httptest.NewServer(http.FileServer(http.FS(os.DirFS(fixtures))))
		loaded := make(chan struct{}, 1)
		started := false
		win.Page().OnDidFinishLoad(func() {
			if started {
				loaded <- struct{}{}
				return
			}
			started = true
			go func() {
				defer server.Close()
				defer mygo.App.Quit()
				script := fmt.Sprintf(`
 let stage="mount"; try {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(ok,label)=>{if(!ok)throw new Error(label)};
 for(let i=0;i<100&&!document.querySelector('.search');i++)await wait(50);
 assert(document.querySelector('.search'),'React UI not mounted');
 const before=await mygo.call('Service.Library');assert(before.length===1,'initial favorites');
 const created=await mygo.call('Service.EditList','','Smoke','create');const id=created.at(-1).id;
 const tracks=[{bv:'BV1xx411c7mD',cid:'9007199254740993',title:'P1',videoTitle:'Smoke',uploader:'Test',cover:'',duration:8,part:1},{bv:'BV1xx411c7mD',cid:'9007199254740994',title:'P2',videoTitle:'Smoke',uploader:'Test',cover:'',duration:8,part:2}];
 const saved=await mygo.call('Service.AddTracks',id,tracks);assert(saved.at(-1).tracks.length===2,'two CIDs persisted');
 const result={ui:true,ipc:true,parts:true,media:[]};
 for(const filename of ['audio.m4a','mixed.mp4']){
 stage=filename+' initial play';
 const a=new Audio(%q+'/'+filename);a.volume=0;
 await Promise.race([a.play(),wait(12000).then(()=>{throw new Error(filename+' play timeout')})]);
 for(let i=0;i<100&&a.currentTime===0;i++)await wait(30);assert(!a.paused&&a.currentTime>0,filename+' plays');a.pause();assert(a.paused,filename+' pauses');
 stage=filename+' seek';a.currentTime=4;for(let i=0;i<100&&a.seeking;i++)await wait(30);assert(Math.abs(a.currentTime-4)<.2,filename+' seeks');
 stage=filename+' resume';await a.play();for(let i=0;i<100&&a.currentTime<=4;i++)await wait(30);assert(a.currentTime>4,filename+' resumes');a.pause();a.removeAttribute('src');a.load();result.media.push({filename,play:true,pause:true,seek:true,resume:true});
 }
 stage='choice menu';
 document.querySelector('button[aria-label="播放模式"]').click();await wait(30);
 assert(document.querySelector('.choice-menu:popover-open'),'mode menu should open');
 [...document.querySelectorAll('.choice-menu:popover-open button')].find(b=>b.textContent==='随机播放').click();await wait(30);
 assert(document.querySelector('button[aria-label="播放模式"]').textContent.includes('随机播放'),'mode choice should persist');
 document.querySelector('button[aria-label="播放模式"]').click();await wait(30);
 [...document.querySelectorAll('.choice-menu:popover-open button')].find(b=>b.textContent==='顺序播放').click();await wait(30);
 stage='app interaction';
 const OriginalAudio=window.Audio;const audios=[];
 window.Audio=class extends OriginalAudio{constructor(...args){super(...args);this.muted=true;audios.push(this)}};
 const input=document.querySelector('.search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Smoke');input.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);document.querySelector('.search').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<100&&!document.querySelector('.video-row button');i++)await wait(30);assert(!document.querySelector('.part-toggle'),'unknown count shows expansion');
 [...document.querySelectorAll('button')].find(b=>b.textContent==='批量选择').click();await wait(30);
 [...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('全选当前结果')).click();for(let i=0;i<100&&!document.querySelector('.basket');i++)await wait(30);assert(document.querySelector('.basket-save').textContent.includes('3'),'batch must include all parts');[...document.querySelectorAll('.basket button')].find(b=>b.textContent==='清空').click();await wait(30);
 const single=document.querySelectorAll('.video')[1];single.querySelector('.select-video').click();
 for(let i=0;i<100&&!document.querySelector('.basket');i++)await wait(30);
 assert(document.querySelector('.basket')&&!single.querySelector('.parts')&&!single.querySelector('.part-toggle'),'single should select directly');
 assert(single.querySelector('.collection-link'),'single lost collection');
 single.querySelector('.select-video').click();await wait(30);assert(!document.querySelector('.basket'),'empty basket remains');
 [...document.querySelectorAll('button')].find(b=>b.textContent==='结束多选').click();await wait(30);
 single.querySelector('button[aria-label="收藏 Single video"]').click();for(let i=0;i<100&&!single.textContent.includes('已加入');i++)await wait(30);
 const direct=await mygo.call('Service.Library');assert(direct[0].tracks.some(t=>t.cid==='123'),'direct collect failed');await mygo.call('Service.RemoveTrack','1','BV1xx411c7mE','123');
 single.querySelector('.collection-link').click();await wait(50);document.querySelector('button[aria-label="返回上一级"]').click();await wait(50);assert(document.querySelectorAll('.video').length===2,'back lost results');
 [...document.querySelectorAll('button')].find(b=>b.textContent==='批量选择').click();await wait(30);
 document.querySelector('.select-video input').click();
 for(let i=0;i<100&&!document.querySelector('.part-toggle');i++)await wait(30);
 assert(document.querySelector('.select-video input').checked,'parent checkbox should select every part');
 document.querySelector('.part-toggle').click();await wait(30);
 document.querySelector('input[aria-label="选择 P1"]').click();await wait(30);
 assert(document.querySelector('.select-video input').indeterminate,'partial group needs mixed state');
 document.querySelector('.select-video input').click();await wait(30);
 assert(document.querySelector('input[aria-label="选择 P1"]').checked&&document.querySelector('input[aria-label="选择 P2"]').checked,'parent should complete a partial group');
 document.querySelectorAll('.track-title')[1].click();await wait(50);
 assert(!document.querySelector('input[aria-label="选择 P2"]').checked&&!document.querySelector('button[aria-label="暂停"]'),'batch title should select without playback');
 document.querySelectorAll('.track-title')[1].click();await wait(30);
 document.querySelector('.video-play-title').click();await wait(30);
 assert(!document.querySelector('.basket'),'parent title should deselect the group');
 document.querySelector('.video-row').click();await wait(30);
 assert(document.querySelector('.basket-save').textContent.includes('2'),'row should select the group');
 document.querySelector('.video-row button[title="播放"]').click();for(let i=0;i<100&&!document.querySelector('button[aria-label="暂停"]');i++)await wait(30);
 document.querySelector('.basket-save').click();
 for(let i=0;i<100&&document.querySelector('.basket');i++)await wait(30);
 assert(!document.querySelector('.basket'),'saved basket not cleared');
 assert(document.querySelector('.now strong').textContent==='P1'&&document.querySelector('button[aria-label="暂停"]'),'saving interrupted preview');
 [...document.querySelectorAll('.nav')].find(b=>b.textContent.includes('我喜欢')).click();await wait(50);
 assert(document.querySelectorAll('.track-title').length===2,'selection basket persisted parts');
 [...document.querySelectorAll('button')].find(b=>b.textContent==='结束多选').click();await wait(30);
 [...document.querySelectorAll('.track-title')].find(b=>b.querySelector('strong').textContent==='P1').click();await wait(50);[...document.querySelectorAll('.track-title')].find(b=>b.querySelector('strong').textContent==='P2').click();await wait(1000);
 assert(document.querySelector('.now strong').textContent==='P2','late A replaced B');assert(audios.filter(a=>!a.paused).length===1,'multiple audio owners');
 document.querySelector('button[aria-label="移除 P2"]').click();await wait(1000);assert(document.querySelector('.now strong').textContent==='P1','current removal did not switch');
 document.querySelector('.track-title').click();await wait(100);assert(document.querySelector('.player-error').textContent.includes('test playback failure'),'missing error');assert(document.querySelectorAll('.track-title').length===1,'failure removed saved track');
 result.selection={singleDirect:true,directCollection:true,batchAllParts:true,backPreservesResults:true,multipleParts:true,singleCollection:true,emptyBasketHidden:true};
 result.player={staleResolutionIgnored:true,liveRemoval:true,errorRetainsTrack:true,savePreservesPreview:true};
 window.Audio=OriginalAudio;
 await mygo.call('Service.EditList',id,'','delete');
 return result; } catch (e) { throw new Error(stage+": "+e.message); }`, server.URL)
				value, err := mygo.EvalAs[json.RawMessage](win.Page(), script)
				if err == nil {
					_, err = mygo.EvalAs[bool](win.Page(), fmt.Sprintf(`
 sessionStorage.setItem('smoke.previousMode', JSON.stringify(localStorage.getItem('shiyin.playbackMode')));
 document.querySelector('button[aria-label="播放模式"]').click();
 await new Promise(r=>setTimeout(r,30));
 [...document.querySelectorAll('.choice-menu:popover-open button')].find(b=>b.textContent==='随机播放').click();
 // WebKit may suspend muted media in hidden windows; keep this test barely audible.
 window.backgroundAudio=new Audio(%q+'/audio.m4a');backgroundAudio.volume=0.001;backgroundAudio.loop=true;
 await backgroundAudio.play();return true;`, server.URL))
				}
				if err == nil {
					win.Close()
					if win.IsDestroyed() || win.IsVisible() {
						err = fmt.Errorf("close must hide the live window")
					} else {
						_, err = mygo.EvalAs[bool](win.Page(), `
 const before=backgroundAudio.currentTime;
 await new Promise(r=>setTimeout(r,1200));
 if(backgroundAudio.paused||backgroundAudio.currentTime<=before)throw new Error('hidden window stopped playback: '+JSON.stringify({before,after:backgroundAudio.currentTime,paused:backgroundAudio.paused}));
 backgroundAudio.pause();return true;`)
					}
					win.Show()
				}
				if err == nil {
					win.Page().Reload()
					select {
					case <-loaded:
						_, err = mygo.EvalAs[bool](win.Page(), `
 for(let i=0;i<100&&!document.querySelector('button[aria-label="播放模式"]');i++)await new Promise(r=>setTimeout(r,30));
 const restored=document.querySelector('button[aria-label="播放模式"]')?.textContent.includes('随机播放');
 const previous=JSON.parse(sessionStorage.getItem('smoke.previousMode'));
 if(previous===null)localStorage.removeItem('shiyin.playbackMode');else localStorage.setItem('shiyin.playbackMode',previous);
 sessionStorage.removeItem('smoke.previousMode');
 if(!restored)throw new Error('playback mode lost after reload');return true;`)
					case <-time.After(5 * time.Second):
						err = fmt.Errorf("mode reload timed out")
					}
				}
				report := struct {
					Passed            bool            `json:"passed"`
					BackgroundAndMode bool            `json:"backgroundAndMode"`
					Result            json.RawMessage `json:"result,omitempty"`
					Error             string          `json:"error,omitempty"`
				}{Passed: err == nil, BackgroundAndMode: err == nil, Result: value}
				if err != nil {
					report.Error = err.Error()
				}
				data, _ := json.MarshalIndent(report, "", "  ")
				os.WriteFile(filepath.Join(os.TempDir(), "shiyin-packaged-smoke.json"), data, 0600)
			}()
		})
		go func() { time.Sleep(45 * time.Second); mygo.App.Quit() }()
	}
}
