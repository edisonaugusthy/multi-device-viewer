async(page)=>{
 const installed=page.context().serviceWorkers().length>0;
 const scope=installed?page.locator('#multi-device-viewer-overlay'):page.locator('body'),fs=scope.locator('iframe');
 const button=scope.locator('[data-main-toolbar]').getByRole('button',{name:'Scroll sync',exact:true});
 const toggle=async(on)=>{if((await button.getAttribute('aria-pressed')==='true')!==on)await button.click()};
 const poll=async(read,predicate,label)=>{let v;const start=Date.now();do{v=await read().catch(()=>null);if(predicate(v))return v;await page.waitForTimeout(50)}while(Date.now()-start<9000);throw Error(label+': '+JSON.stringify(v))};
 const pos=()=>fs.evaluateAll(fs=>fs.map(f=>{const el=f.contentDocument.querySelector('#panel-a');return {x:el.scrollLeft,y:el.scrollTop,maxX:el.scrollWidth-el.clientWidth,maxY:el.scrollHeight-el.clientHeight}}));
 await poll(()=>fs.evaluateAll(fs=>fs.map(f=>Boolean(f.contentDocument?.querySelector('#panel-a')))),v=>v?.length===3&&v.every(Boolean),'fixtures ready');
 await toggle(false);
 await fs.evaluateAll(fs=>fs.forEach(f=>{const el=f.contentDocument.querySelector('#panel-a');el.style.direction='rtl';el.scrollTo({left:0,top:0,behavior:'instant'})}));
 await page.waitForTimeout(150);await toggle(true);
 await fs.first().evaluate(f=>f.contentDocument.querySelector('#panel-a').scrollBy({left:-90,top:80,behavior:'instant'}));
 await poll(pos,v=>v?.every(p=>Math.abs(p.x+90)<1&&Math.abs(p.y-80)<1),'RTL deltas');
 await toggle(false);
 await fs.evaluateAll(fs=>fs.forEach(f=>f.contentDocument.querySelector('#panel-a').scrollTo({left:-10000,top:10000,behavior:'instant'})));
 await page.waitForTimeout(150);await toggle(true);const before=await pos();
 await fs.first().evaluate(f=>{const el=f.contentDocument.querySelector('#panel-a');el.style.width='260px';el.style.height='250px'});
 await poll(pos,v=>v&&Math.abs(v[0].y-v[0].maxY)<1&&Math.abs(v[0].x+v[0].maxX)<1,'container clamped');
 await page.waitForTimeout(250);const clamped=await pos();
 if(clamped.slice(1).some((p,i)=>p.x!==before[i+1].x||p.y!==before[i+1].y))throw Error('resize moved peers');
 await fs.first().evaluate(f=>f.contentDocument.querySelector('#panel-a').scrollBy({left:25,top:-50,behavior:'instant'}));
 await poll(pos,v=>v?.every((p,i)=>Math.abs(p.x-clamped[i].x-25)<1&&Math.abs(p.y-clamped[i].y+50)<1),'movement after clamp');
 await toggle(false);
 return {installed,rtlHorizontalSync:true,resizeClampingDoesNotMovePeers:true,movementAfterClamping:true};
}
