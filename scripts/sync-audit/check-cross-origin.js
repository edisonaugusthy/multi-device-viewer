async(page)=>{
 const installed=page.context().serviceWorkers().length>0;
 const scope=installed?page.locator('#multi-device-viewer-overlay'):page.locator('body');
 const toolbar=scope.locator('[data-main-toolbar]'),elements=scope.locator('iframe');
 const frames=async()=>Promise.all((await elements.elementHandles()).map(e=>e.contentFrame()));
 const toggle=async(name,on)=>{const b=toolbar.getByRole('button',{name,exact:true});if((await b.getAttribute('aria-pressed')==='true')!==on)await b.click()};
 const poll=async(read,predicate,label)=>{let v;const start=Date.now();do{v=await read().catch(()=>null);if(predicate(v))return v;await page.waitForTimeout(60)}while(Date.now()-start<9000);throw Error(label+': '+JSON.stringify(v))};
 await toggle('Navigation sync',true);await toggle('Scroll sync',true);
 const initial=(await frames())[0].url();const target=initial.replace('127.0.0.1','localhost');
 await (await frames())[0].evaluate(url=>location.assign(url),target);
 await poll(async()=>Promise.all((await frames()).map(f=>f.url())),v=>v?.length===3&&v.every(x=>x===target),'cross-origin navigation');
 await poll(async()=>Promise.all((await frames()).map(f=>f.evaluate(()=>window.receivedSync))),v=>v?.every(x=>x?.includes('MDV_SCROLL_SYNC_ENABLE')),'cross-origin bridge reconnect');
 await toggle('Scroll sync',false);
 for(const f of await frames())await f.evaluate(()=>document.scrollingElement.scrollTo({top:0,left:0,behavior:'instant'}));
 await page.waitForTimeout(150);await toggle('Scroll sync',true);
 await (await frames())[0].evaluate(()=>document.scrollingElement.scrollBy({top:140,behavior:'instant'}));
 await poll(async()=>Promise.all((await frames()).map(f=>f.evaluate(()=>scrollY))),v=>v?.every(x=>Math.abs(x-140)<1.5),'cross-origin scroll');
 await (await frames())[1].evaluate(url=>location.assign(url),initial);
 await poll(async()=>Promise.all((await frames()).map(f=>f.url())),v=>v?.length===3&&v.every(x=>x===initial),'return to original origin');
 await toggle('Scroll sync',false);await toggle('Navigation sync',false);
 return {installed,crossOriginNavigation:true,crossOriginBridgeReconnect:true,crossOriginScroll:true,returnToOriginalOrigin:true};
}
