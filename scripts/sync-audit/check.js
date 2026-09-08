async (page) => {
  const base = 'http://127.0.0.1:5174/scripts/sync-audit/fixture.html';
  const installed = Boolean(page.context().serviceWorkers().length);
  const initial = base + (installed ? '?native=1' : '');
  if (installed) {
    await page.goto(initial);
    const worker = page.context().serviceWorkers()[0];
    await worker.evaluate(async url => {
      await chrome.storage.local.remove(['mdvWorkspaceView', 'mdvSimulatorSession']);
      const tab = (await chrome.tabs.query({})).find(t => t.url === url);
      await chrome.tabs.sendMessage(tab.id, { type:'OPEN_SIMULATOR',url,sourceTabId:tab.id });
    }, initial);
  } else {
    await page.goto(initial);
    await page.evaluate(()=>{localStorage.removeItem('mdvSimulatorSession');localStorage.removeItem('mdvWorkspaceView')});
    await page.goto('http://127.0.0.1:5174/entrypoints/preview/index.html?url=' + encodeURIComponent(initial));
  }
  const scope = installed ? page.locator('#multi-device-viewer-overlay') : page.locator('body');
  const skip = scope.getByRole('button',{name:'Skip feature tour'});
  if (await skip.isVisible()) await skip.click();
  const toolbar = scope.locator('[data-main-toolbar]');
  const frames = scope.locator('iframe');
  const results = { installed, checks:[] };
  const poll = async (read, predicate, label) => {
    const start = Date.now();let actual;
    do { actual = await read().catch(()=>null); if (predicate(actual)) return actual; await page.waitForTimeout(40); } while(Date.now()-start<9000);
    throw Error(label + ': ' + JSON.stringify(actual));
  };
  const urls = () => frames.evaluateAll(fs=>fs.map(f=>f.contentWindow.location.href));
  const tokens = () => frames.evaluateAll(fs=>fs.map(f=>f.contentWindow.documentToken));
  const ready = () => poll(()=>frames.evaluateAll(fs=>fs.map(f=>Boolean(f.contentWindow.documentToken)&&f.contentWindow.receivedSync.includes('MDV_PREVIEW_REGISTER'))),v=>v?.length===3&&v.every(Boolean),'bridge ready');
  const allAt = url => poll(urls,v=>v?.length===3&&v.every(x=>x===url),'navigation convergence');
  const navigate = (index,url) => frames.nth(index).evaluate((f,url)=>f.contentWindow.history.pushState({},'',url),url);
  const toggle = async (name,enabled) => {const b=toolbar.getByRole('button',{name,exact:true});if((await b.getAttribute('aria-pressed')==='true')!==enabled)await b.click();};
  const positions = (id='') => frames.evaluateAll((fs,id)=>fs.map(f=>{const el=id?f.contentDocument.getElementById(id):f.contentDocument.scrollingElement;return {x:el.scrollLeft,y:el.scrollTop,max:el.scrollHeight-el.clientHeight}}),id);
  const scroll = (index,x,y,id='') => frames.nth(index).evaluate((f,{x,y,id})=>{const el=id?f.contentDocument.getElementById(id):f.contentDocument.scrollingElement;el.scrollBy({left:x,top:y,behavior:'instant'})},{x,y,id});
  const stable = async label => {const before=await tokens();await page.waitForTimeout(500);if(JSON.stringify(before)!==JSON.stringify(await tokens()))throw Error(label+' reload loop');};
  await ready();if(await skip.isVisible())await skip.click();await toggle('Navigation sync',true);await toggle('Scroll sync',false);
  for (let index=0;index<3;index++) {
    const url=initial+(installed?'&':'?')+'route=spa-'+index;
    await navigate(index,url);await allAt(url);await ready();
    await frames.nth(index).evaluate(f=>f.contentWindow.history.replaceState({},'',f.contentWindow.location.href+'-replace'));
    await allAt(url+'-replace');await ready();
    await navigate(index,initial);await allAt(initial);await ready();
  }
  results.checks.push('SPA pushState/replaceState and return to original URL from each device');
  const full=initial+(installed?'&':'?')+'route=full';
  await frames.first().evaluate((f,url)=>f.contentWindow.location.assign(url),full);await allAt(full);await ready();
  await frames.first().evaluate(f=>f.contentWindow.location.hash='section');await allAt(full+'#section');await ready();
  await frames.first().evaluate(f=>f.contentWindow.history.back());await allAt(full);await ready();
  await frames.first().evaluate(f=>f.contentWindow.history.forward());await allAt(full+'#section');await ready();
  await stable('back/forward');results.checks.push('full document, hash, back and forward without reload loops');
  await toggle('Navigation sync',false);
  await navigate(1,initial+(installed?'&':'?')+'route=independent');await page.waitForTimeout(250);
  if((await urls())[0]!==full+'#section')throw Error('disabled navigation moved peers');
  await toggle('Navigation sync',true);await navigate(1,initial);await allAt(initial);await ready();
  results.checks.push('navigation off/on keeps independent changes isolated and resumes');
  await toggle('Scroll sync',true);
  const loadsBefore=await frames.evaluateAll(fs=>fs.map(f=>f.contentWindow.documentLoads));
  const linkFrame=await (await frames.first().elementHandle()).contentFrame();
  await linkFrame.locator('#full').click();await allAt(full);await ready();await stable('combined sync link');
  const loadsAfter=await frames.evaluateAll(fs=>fs.map(f=>f.contentWindow.documentLoads));
  if(loadsAfter.some((n,i)=>n!==loadsBefore[i]+1))throw Error('duplicate navigation with both switches on: '+JSON.stringify({loadsBefore,loadsAfter}));
  await navigate(0,initial);await allAt(initial);await ready();await toggle('Scroll sync',false);
  results.checks.push('both sync switches follow a real link once per viewport');

  await frames.evaluateAll(fs=>fs.forEach(f=>f.contentDocument.scrollingElement.scrollTo({top:0,left:0,behavior:'instant'})));
  await page.waitForTimeout(150);await toggle('Scroll sync',true);
  await poll(()=>frames.evaluateAll(fs=>fs.map(f=>f.contentWindow.receivedSync.at(-1))),v=>v?.every(Boolean),'sync messages');
  await scroll(0,80,250);
  await poll(()=>positions(),v=>v?.every(p=>Math.abs(p.y-250)<2&&Math.abs(p.x-80)<2),'root deltas');
  await scroll(1,-30,70);
  await poll(()=>positions(),v=>v?.every(p=>Math.abs(p.y-320)<2&&Math.abs(p.x-50)<2),'immediate follower takeover');
  await frames.first().evaluate(f=>{f.contentDocument.querySelector('#panel-a').scrollTo({top:190,left:70,behavior:'instant'});f.contentDocument.querySelector('#panel-b').scrollTo({top:230,left:90,behavior:'instant'});});
  await poll(()=>positions('panel-a'),v=>v?.every(p=>Math.abs(p.y-190)<1&&Math.abs(p.x-70)<1),'nested A');
  await poll(()=>positions('panel-b'),v=>v?.every(p=>Math.abs(p.y-230)<1&&Math.abs(p.x-90)<1),'nested B same animation frame');
  results.checks.push('two-axis scrolling, immediate source switching, simultaneous nested containers');
  // Alternate leaders rapidly, then give queued events time to reveal echoes.
  for(let i=0;i<15;i++){const before=await positions();await scroll(i%3,0,11);await poll(()=>positions(),v=>v?.every((p,index)=>Math.abs(p.y-before[index].y-11)<1.5)&&Math.max(...v.map(p=>p.y))-Math.min(...v.map(p=>p.y))<1.5,'rapid alternation');}
  await page.waitForTimeout(350);
  const settled=await positions();if(Math.max(...settled.map(p=>p.y))-Math.min(...settled.map(p=>p.y))>=1.5||settled.some(p=>p.y<475||p.y>495))throw Error('scroll feedback drift');
  await scroll(2,0,10000);await poll(()=>positions(),v=>v?.every(p=>Math.abs(p.y-p.max)<2),'clamped end');
  const bottoms=await positions();await scroll(2,0,-100);
  await poll(()=>positions(),v=>v?.every((p,i)=>Math.abs(p.y-(bottoms[i].y-100))<2),'reverse from clamped end');
  results.checks.push('rapid alternating leaders and unequal page ends without feedback drift');
  await toggle('Scroll sync',false);const offBefore=await positions('panel-a');await scroll(0,0,90,'panel-a');await page.waitForTimeout(180);
  if((await positions('panel-a'))[1].y!==offBefore[1].y)throw Error('disabled scroll moved peers');
  await toggle('Scroll sync',true);const enabled=await positions('panel-a');await scroll(0,0,30,'panel-a');
  await poll(()=>positions('panel-a'),v=>v?.every((p,i)=>Math.abs(p.y-enabled[i].y-30)<1),'nested baseline after reenable');
  results.checks.push('scroll off/on preserves nested baselines');
  for(const index of [0,1]) {
    await frames.nth(index).evaluate(f=>f.contentWindow.location.reload());await ready();
    await poll(()=>frames.nth(index).evaluate(f=>f.contentWindow.receivedSync),v=>v?.includes('MDV_SCROLL_SYNC_ENABLE')&&v.includes('MDV_APPLY_SCROLL_SYNC'),'reload restores enabled sync and position');
    await page.waitForTimeout(120);const before=await positions();await scroll(index,0,-55);
    await poll(()=>positions(),v=>v?.every((p,i)=>Math.abs(p.y-Math.max(0,before[i].y-55))<2),'sync after reload');
  }
  results.checks.push('enabled scroll sync survives source and follower reloads');
  await toggle('Scroll sync',false);await toggle('Navigation sync',false);
  await page.screenshot({path:'output/playwright/sync-audit/'+(installed?'installed-chrome':'browser')+'.png',animations:'disabled'});
  results.historyUntouched=await frames.evaluateAll(fs=>fs.every(f=>f.contentWindow.originalPushState===f.contentWindow.history.pushState));
  if(!results.historyUntouched)throw Error('page history method modified');
  return results;
}
