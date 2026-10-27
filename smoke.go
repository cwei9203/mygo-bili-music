//go:build smoke

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
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
		server := httptest.NewServer(http.FileServer(http.FS(os.DirFS("/tmp/shiyin-media-fixtures"))))
		win.Page().OnDidFinishLoad(func() {
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
 stage='app interaction';
 const OriginalAudio=window.Audio;const audios=[];
 window.Audio=class extends OriginalAudio{constructor(...args){super(...args);this.muted=true;audios.push(this)}};
 const input=document.querySelector('.search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Smoke');input.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);document.querySelector('.search').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<100&&!document.querySelector('.video-row button');i++)await wait(30);assert(!document.querySelector('.part-toggle'),'unknown count shows expansion');
 [...document.querySelectorAll('button')].find(b=>b.textContent==='批量选择').click();await wait(30);
 [...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('全选已加载')).click();for(let i=0;i<100&&!document.querySelector('.basket');i++)await wait(30);assert(document.querySelector('.basket-save').textContent.includes('3'),'batch must include all parts');[...document.querySelectorAll('.basket button')].find(b=>b.textContent==='清空').click();await wait(30);
 const single=document.querySelectorAll('.video')[1];single.querySelector('.select-video').click();
 for(let i=0;i<100&&!document.querySelector('.basket');i++)await wait(30);
 assert(document.querySelector('.basket')&&!single.querySelector('.parts')&&!single.querySelector('.part-toggle'),'single should select directly');
 assert(single.querySelector('.collection-link'),'single lost collection');
 single.querySelector('.select-video').click();await wait(30);assert(!document.querySelector('.basket'),'empty basket remains');
 single.querySelector('button[aria-label="收藏 Single video"]').click();for(let i=0;i<100&&!single.textContent.includes('已收藏');i++)await wait(30);
 const direct=await mygo.call('Service.Library');assert(direct[0].tracks.some(t=>t.cid==='123'),'direct collect failed');await mygo.call('Service.RemoveTrack','1','BV1xx411c7mE','123');
 single.querySelector('.collection-link').click();await wait(50);document.querySelector('button[aria-label="返回上一级"]').click();await wait(50);assert(document.querySelectorAll('.video').length===2,'back lost results');
 document.querySelector('.video-row button').click();
 for(let i=0;i<100&&!document.querySelector('.parts input');i++)await wait(30);
 document.querySelector('input[aria-label="选择 P1"]').click();await wait(30);document.querySelector('input[aria-label="选择 P2"]').click();await wait(30);
 document.querySelectorAll('.track-title')[1].click();for(let i=0;i<100&&!document.querySelector('button[aria-label="暂停"]');i++)await wait(30);
 document.querySelector('.basket-save').click();
 for(let i=0;i<100&&document.querySelector('.basket');i++)await wait(30);
 assert(!document.querySelector('.basket'),'saved basket not cleared');
 assert(document.querySelector('.now strong').textContent==='P2'&&document.querySelector('button[aria-label="暂停"]'),'saving interrupted preview');
 [...document.querySelectorAll('.nav')].find(b=>b.textContent.includes('我喜欢')).click();await wait(50);
 assert(document.querySelectorAll('.track-title').length===2,'selection basket persisted parts');
 document.querySelectorAll('.track-title')[0].click();await wait(50);document.querySelectorAll('.track-title')[1].click();await wait(1000);
 assert(document.querySelector('.now strong').textContent==='P2','late A replaced B');assert(audios.filter(a=>!a.paused).length===1,'multiple audio owners');
 document.querySelector('button[aria-label="移除 P2"]').click();await wait(1000);assert(document.querySelector('.now strong').textContent==='P1','current removal did not switch');
 document.querySelector('.track-title').click();await wait(100);assert(document.querySelector('.player-error').textContent.includes('test playback failure'),'missing error');assert(document.querySelectorAll('.track-title').length===1,'failure removed saved track');
 result.selection={singleDirect:true,directCollection:true,batchAllParts:true,backPreservesResults:true,multipleParts:true,singleCollection:true,emptyBasketHidden:true};
 result.player={staleResolutionIgnored:true,liveRemoval:true,errorRetainsTrack:true,savePreservesPreview:true};
 window.Audio=OriginalAudio;
 await mygo.call('Service.EditList',id,'','delete');
 return result; } catch (e) { throw new Error(stage+": "+e.message); }`, server.URL)
				value, err := mygo.EvalAs[json.RawMessage](win.Page(), script)
				report := struct {
					Passed bool            `json:"passed"`
					Result json.RawMessage `json:"result,omitempty"`
					Error  string          `json:"error,omitempty"`
				}{Passed: err == nil, Result: value}
				if err != nil {
					report.Error = err.Error()
				}
				data, _ := json.MarshalIndent(report, "", "  ")
				os.WriteFile("/tmp/shiyin-packaged-smoke.json", data, 0600)
			}()
		})
		go func() { time.Sleep(45 * time.Second); mygo.App.Quit() }()
	}
}
