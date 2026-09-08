async(page)=>{
 const url='http://127.0.0.1:5174/scripts/header-seam-audit/fixture.html';
 const app='http://127.0.0.1:5174/entrypoints/preview/index.html?url='+encodeURIComponent(url);
 const dpr=await page.evaluate(()=>devicePixelRatio), results=[];
 await page.setViewportSize({width:1280,height:811});
 for(const orientation of ['portrait','landscape'])for(const darkMode of [false,true]){
  const ids=orientation==='portrait'?['apple-ipad-pro-13-m4-2024','apple-macbook-pro-14-m5-2025']:['apple-ipad-pro-13-m4-2024'];
  await page.evaluate(({ids,url,orientation,darkMode})=>localStorage.setItem('mdvSimulatorSession',JSON.stringify({slots:ids.map((deviceId,i)=>({id:'audit-'+i,deviceId,url,orientation,zoom:.58,zoomMode:'fit',reloadToken:0,showFrame:true})),activeSlotId:'audit-0',display:{scrollSync:false,navigationSync:false,darkMode,previewStyle:'device'}})),{ids,url,orientation,darkMode});
  await page.goto(app);
  await page.waitForFunction(n=>{const fs=[...document.querySelectorAll('[data-preview-slot-id] iframe')];return fs.length===n&&fs.every(f=>f.contentDocument?.querySelector('header')&&f.style.backgroundColor==='rgb(255, 255, 255)');},ids.length);
  const skip=page.getByRole('button',{name:'Skip feature tour'});if(await skip.isVisible())await skip.click();
  const tools=page.getByRole('button',{name:'Close workspace setup',exact:true});if(await tools.isVisible())await tools.click();
  await page.locator('iframe').evaluateAll(fs=>fs.forEach(f=>f.contentWindow.scrollTo(0,130)));
  for(const zoom of ['fit','smaller','larger']){
   if(zoom!=='fit')for(const card of await page.locator('[data-preview-slot-id]').all()){
    const b=card.getByRole('button',{name:zoom==='smaller'?'Zoom out':'Zoom in',exact:true});
    await b.click();if(zoom==='larger')await b.click();
   }
   await page.mouse.move(0, 0);
   await page.waitForTimeout(700);
   const measurements=await page.locator('[data-device-screen]').evaluateAll(es=>es.map(e=>{
    const logical=e.lastElementChild,iframe=e.querySelector('iframe'),bar=e.querySelector('[data-desktop-chrome], [data-browser-control="top-address"]');
    return {id:e.dataset.deviceScreen,screen:e.getBoundingClientRect().toJSON(),logical:logical.getBoundingClientRect().toJSON(),iframe:iframe.getBoundingClientRect().toJSON(),bar:bar.getBoundingClientRect().toJSON(),css:{width:iframe.clientWidth,height:iframe.clientHeight},clip:getComputedStyle(e).clipPath,transform:logical.style.transform};
   }));
   for(const m of measurements){
    if(Math.abs(m.screen.left-m.logical.left)>.02||Math.abs(m.screen.width-m.logical.width)>.02||Math.abs(m.screen.height-m.logical.height)>.02)throw Error('Letterbox: '+JSON.stringify(m));
    if(Math.abs(m.bar.left-m.iframe.left)>.02||Math.abs(m.bar.width-m.iframe.width)>.02)throw Error('Header width: '+JSON.stringify(m));
    if(m.clip==='none')throw Error('No composed screen clip');
   }
   const filename=`dpr${dpr}-${orientation}-${darkMode?'dark':'light'}-${zoom}`;
   await page.screenshot({path:`output/playwright/frame-fit/${filename}.png`});
   results.push({orientation,darkMode,zoom,filename,measurements});
  }
 }
 return {dpr,cases:results.reduce((s,r)=>s+r.measurements.length,0),results};
}
