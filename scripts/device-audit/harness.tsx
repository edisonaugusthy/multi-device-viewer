import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../src/app/i18n';
import { devices } from '../../src/domain/device/device-catalog';
import { DeviceFrame } from '../../src/ui/components/DeviceFrame';
import { getFrameProfile } from '../../src/domain/device/frame-profiles';
import { supportsOrientation, toLandscapeAwareSize } from '../../src/domain/device/device-service';
import { nextBrowserCollapse } from '../../src/domain/device/browser-geometry';

const query = new URLSearchParams(location.search);
const frameHost = document.getElementById('frame')!;
const frameRoot = query.has('shadow') ? frameHost.attachShadow({mode:'open'}) : frameHost;
const mount = document.createElement('div');
if (query.has('shadow')) {
 const stylesheet = document.createElement('link');
 stylesheet.rel='stylesheet';stylesheet.href='/style.css';frameRoot.append(stylesheet);
}
frameRoot.append(mount);
const root=createRoot(mount);
const representativeCases=[
 ['apple-iphone-17-pro-2025','portrait'],['apple-iphone-17-pro-2025','landscape'],
 ['apple-iphone-air-2025','portrait'],['apple-iphone-17e-2026','portrait'],
 ['apple-iphone-duo-unfolded-2026','portrait'],['apple-iphone-duo-unfolded-2026','landscape'],
 ['apple-iphone-duo-folded-2026','portrait'],['apple-iphone-duo-folded-2026','landscape'],
 ['apple-iphone-16e-2025','landscape'],['apple-iphone-14-pro-2022','portrait'],
 ['apple-iphone-14-pro-max-2022','portrait'],['apple-iphone-13-mini','portrait'],
 ['apple-iphone-x','landscape'],['apple-ipad-mini-6','portrait'],
 ['apple-ipad-pro-13-m4-2024','portrait'],['apple-ipad-air-13-m4-2026','landscape'],
 ['samsung-galaxy-s26-ultra-2026','portrait'],['google-pixel-11-2026','portrait'],
 ['samsung-galaxy-z-fold7-unfolded-2025','landscape'],
] as const;
const glassFixture = query.has('glass');
const lightGlass = query.get('glass') === 'light';
const fixtureUrl = new URL(glassFixture ? '/glass.html' : '/probe.html', location.origin);
if (lightGlass) fixtureUrl.searchParams.set('light', '');
if (glassFixture && query.has('cross-origin')) fixtureUrl.hostname = location.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
const cases = query.has("device") ? [[query.get("device")!, query.get("orientation") ?? "portrait"]] as const : query.has("all") ? devices.flatMap(d => (supportsOrientation(d) ? ["portrait", "landscape"] : ["portrait"]).map(o => [d.id,o] as const)) : representativeCases;
document.getElementById("run")!.textContent = "Measure " + cases.length + " cases";
if (fixtureUrl.origin !== location.origin) {
 const button = document.getElementById('run') as HTMLButtonElement;
 button.disabled = true;
 button.textContent = 'Cross-origin visual check';
 button.title = 'Remove cross-origin from the URL to run same-origin DOM measurements.';
}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
let currentId=cases[0][0] as string, currentOrientation='portrait', currentScroll=0;
function render(id:string,orientation:string,scroll=0){
 const d=devices.find(x=>x.id===id)!;
 orientation=supportsOrientation(d)?orientation:'portrait';
 currentId=id;currentOrientation=orientation;currentScroll=scroll;
 const v=supportsOrientation(d)?toLandscapeAwareSize(d.cssViewport,orientation as any):d.cssViewport;
 document.getElementById('case')!.textContent=d.name+' · '+orientation+' · '+v.width+' × '+v.height;
 root.render(<I18nProvider><DeviceFrame device={d} showFrame showStatusBar showBattery showUrlBar darkMode={false} url="https://fixture.example" viewportSize={v} orientation={orientation as any} scrollProgress={scroll} pageSurfaces={glassFixture ? {top:lightGlass?'#f5f8fa':'#111318',bottom:lightGlass?'#f5f8fa':'#111318',topIsDark:!lightGlass,bottomIsDark:!lightGlass} : {top:'#133d55',bottom:'#b22238',topIsDark:true,bottomIsDark:true}}>
   <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden'}}><iframe key={id+orientation} title="Frame measurement page" src={fixtureUrl.href} style={{display:'block',width:'100%',height:'100%',border:0}}/></div>
 </DeviceFrame></I18nProvider>);
}
function rect(r:DOMRect){return{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left};}
async function measure(){
 for(let i=0;i<30;i++){
  const f=frameRoot.querySelector('iframe');
  const imgs=Array.from(frameRoot.querySelectorAll<HTMLImageElement>('img'));
  if(f?.contentDocument?.getElementById('fixed-footer')&&imgs.every(x=>x.complete&&x.naturalWidth>0))break;
  await sleep(50);
 }
 await sleep(80);
 const f=frameRoot.querySelector('iframe')!;
 if(Array.from(frameRoot.querySelectorAll<HTMLImageElement>('img')).some(x=>!x.complete||!x.naturalWidth))throw new Error('Missing frame artwork: '+currentId);
 const w=f.contentWindow!, doc=f.contentDocument!;
 const d=devices.find(x=>x.id===currentId)!;
 const screen=frameRoot.querySelector<HTMLElement>('[data-device-screen]')!;
 const fr=f.getBoundingClientRect();
 const screenRect=screen?.getBoundingClientRect();
 const footer=doc.getElementById('fixed-footer')!.getBoundingClientRect();
 const scaleX=fr.width/f.clientWidth,scaleY=fr.height/f.clientHeight;
 const globalFooter={left:fr.left+footer.left*scaleX,right:fr.left+footer.right*scaleX,top:fr.top+footer.top*scaleY,bottom:fr.top+footer.bottom*scaleY};
 const bars=Array.from(frameRoot.querySelectorAll<HTMLElement>('[data-browser-control]')).map(el=>el.getBoundingClientRect());
 const bar=bars.find(r=>r.top>fr.top);
 const overlap=Math.max(0,...bars.map(r=>{
  const width=Math.min(r.right,globalFooter.right)-Math.max(r.left,globalFooter.left);
  // Side controls can share the footer's Y range while remaining outside the
  // iframe. Ignore subpixel edge contact; count only actual 2D intersections.
  return width>0.5*scaleX?Math.max(0,Math.min(r.bottom,globalFooter.bottom)-Math.max(r.top,globalFooter.top))/scaleY:0;
 }));
 const edge=doc.getElementById('left-edge')!.getBoundingClientRect();
 const ex=fr.left+(edge.left+4)*scaleX,ey=fr.top+(edge.top+edge.height/2)*scaleY;
 const hit=frameRoot instanceof ShadowRoot?frameRoot.elementFromPoint(ex,ey):document.elementFromPoint(ex,ey);
 return {id:d.id,name:d.name,orientation:currentOrientation,profile:getFrameProfile(d).chromeVariant,
  screenCss:d.cssViewport,iframeCss:{width:w.innerWidth,height:w.innerHeight},iframeClient:{width:f.clientWidth,height:f.clientHeight},
  hostDpr:w.devicePixelRatio,presetDpr:d.pixelRatio,safeAreaBottom:doc.getElementById('safe')!.getBoundingClientRect().height,
  scaleX,scaleY,anisotropyPercent:Math.abs(scaleX/scaleY-1)*100,
  frame:rect(frameRoot.querySelector('[data-device-frame]')!.getBoundingClientRect()),
  screen:screenRect?rect(screenRect):null,iframe:rect(fr),liquidGlassBar:bar?rect(bar):null,
  fixedFooterOccludedCssPx:overlap,leftEdgePointHitsIframe:hit===f,
  headerPaintOverlapCss:frameRoot.querySelector<HTMLElement>('[data-ios-top-surface]')?Math.max(0,frameRoot.querySelector<HTMLElement>('[data-ios-top-surface]')!.getBoundingClientRect().bottom-fr.top)/scaleY:0};
}
document.getElementById('run')!.addEventListener('click',async()=>{
 const results=[];document.getElementById('status')!.textContent='Measuring current source frames';
 for(const [id,orientation] of cases){render(id,orientation);await sleep(80);results.push(await measure());}
 document.getElementById('results')!.textContent=JSON.stringify(results,null,2);
 render(cases[0][0],cases[0][1]);
 document.getElementById('status')!.textContent=results.length+' source-frame cases measured';
});
document.getElementById('landscape')!.addEventListener('click',()=>render(currentId,currentOrientation==='portrait'?'landscape':'portrait',currentScroll));
function scrollFixture(top:number){
 const frameWindow=frameRoot.querySelector('iframe')?.contentWindow;
 if(glassFixture)frameWindow?.postMessage({type:'device-audit-scroll',top},fixtureUrl.origin);
 else {frameWindow?.scrollTo(0,top);render(currentId,currentOrientation,top?1:0);}
}
document.getElementById('scroll')!.addEventListener('click',()=>scrollFixture(800));
const restoreButton=document.createElement('button');
restoreButton.textContent='Scroll up';
restoreButton.addEventListener('click',()=>scrollFixture(200));
document.getElementById('scroll')!.after(restoreButton);
window.addEventListener('message',event=>{
 if(event.source!==frameRoot.querySelector('iframe')?.contentWindow||event.origin!==fixtureUrl.origin||event.data?.type!=='device-audit-scroll-state')return;
 const {top,delta}=event.data;
 if(!Number.isFinite(top)||!Number.isFinite(delta))return;
 const next=nextBrowserCollapse(currentScroll,top,delta);
 if(next!==currentScroll)render(currentId,currentOrientation,next);
});
render(currentId,cases[0][1]);
