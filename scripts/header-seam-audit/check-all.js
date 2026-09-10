async(page)=>{
 const url='http://127.0.0.1:5174/scripts/header-seam-audit/fixture.html';
 const app='http://127.0.0.1:5174/entrypoints/preview/index.html?url='+encodeURIComponent(url);
 const devices=await page.evaluate(async()=>{const{devices}=await import('/src/domain/device/device-catalog.ts');const{supportsOrientation}=await import('/src/domain/device/device-service.ts');return devices.flatMap(d=>(supportsOrientation(d)?['portrait','landscape']:['portrait']).map(orientation=>({id:d.id,name:d.name,type:d.type,orientation})));});
 const results=[];
 await page.setViewportSize({width:1280,height:811});
 for(let batch=0;batch<devices.length;batch+=4){
  const selected=devices.slice(batch,batch+4);
  await page.evaluate(({selected,url})=>{
   localStorage.setItem('mdvSimulatorSession',JSON.stringify({slots:selected.map((d,i)=>({id:'audit-'+i,deviceId:d.id,url,orientation:d.orientation,zoom:.58,zoomMode:'fit',reloadToken:0,showFrame:true})),activeSlotId:'audit-0',display:{scrollSync:false,navigationSync:false,darkMode:false,previewStyle:'device'}}));
  },{selected,url});
  await page.goto(app);
  await page.waitForFunction(n=>{const frames=[...document.querySelectorAll('[data-preview-slot-id] iframe')];return frames.length===n&&frames.every(f=>f.style.backgroundColor==='rgb(255, 255, 255)'&&f.contentDocument?.querySelector('header')&&f.closest('[data-preview-slot-id]').querySelectorAll('[data-preview-edge]').length===2);},selected.length);
  const skip=page.getByRole('button',{name:'Skip feature tour'});if(await skip.isVisible())await skip.click();
  const tools=page.getByRole('button',{name:'Close workspace setup',exact:true});if(await tools.isVisible())await tools.click();
  for(const zoom of ['fit','smaller']){
   if(zoom==='smaller')for(const card of await page.locator('[data-preview-slot-id]').all())await card.getByRole('button',{name:'Zoom out',exact:true}).click();
   for(const scroll of [0,130]){
    await page.locator('[data-preview-slot-id] iframe').evaluateAll((frames,y)=>frames.forEach(f=>f.contentWindow.scrollTo(0,y)),scroll);
    await page.mouse.move(0,0);await page.waitForTimeout(350);
    const filename=`batch-${batch}-${zoom}-${scroll}.png`;
    const measurements=await page.locator('[data-preview-slot-id]').evaluateAll(cards=>cards.map(card=>{
     const frame=card.querySelector('iframe'),screen=card.querySelector('[data-device-screen]'),surface=card.querySelector('[data-ios-top-surface]');
     return {rect:frame.getBoundingClientRect().toJSON(),iframeCss:{width:frame.clientWidth,height:frame.clientHeight},iframeBackground:frame.style.backgroundColor,screenBackground:screen?.style.backgroundColor,topBackground:surface?.style.backgroundColor,topAddress:Boolean(card.querySelector('[data-browser-control="top-address"], [data-desktop-chrome]')),scrollTop:frame.contentDocument.scrollingElement.scrollTop};
    }));
    await page.screenshot({path:'output/playwright/all-device-seams/dpr'+await page.evaluate(()=>devicePixelRatio)+'/'+filename});
    measurements.forEach((m,i)=>results.push({...selected[i],zoom,scroll,filename,...m}));
   }
  }
 }
 return {devices:new Set(devices.map(d=>d.id)).size,orientations:devices.length,cases:results.length,results};
}
