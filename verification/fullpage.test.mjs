import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {JSDOM} from 'jsdom';
const root=path.resolve(process.env.PEPK_TEST_ROOT||path.resolve(import.meta.dirname,'..'));
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
const entry=new JSDOM(html).window.document.querySelector('script[src*="home-fullpage.js"]');
assert(entry,'index.html must load the controller directly');
const code=await fs.readFile(path.join(root,entry.getAttribute('src').split('?')[0]),'utf8');
async function setup({desktop=true,reduced=false,hash='',query=''}={}) {
  const dom=new JSDOM(html,{url:`https://example.org/pepk/index.html${query}${hash}`,runScripts:'outside-only',pretendToBeVisual:true});
  const win=dom.window,doc=win.document,viewport=doc.querySelector('[data-home-viewport]');
  const screens=[...doc.querySelectorAll('[data-home-scene]')];
  const height=680,calls=[],windowCalls=[];
  let now=0,timerId=0;const timers=new Map();
  win.setTimeout=(fn,delay=0)=>{const id=++timerId;timers.set(id,{at:now+delay,fn});return id;};
  win.clearTimeout=(id)=>timers.delete(id);
  win.requestAnimationFrame=(fn)=>win.setTimeout(fn,16);
  win.cancelAnimationFrame=win.clearTimeout;
  function tick(ms) {
    const end=now+ms;
    while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;
  }
  let large=desktop;
  const media={get matches(){return large;},addEventListener(){}};
  win.matchMedia=(q)=>q.includes('reduced')?{matches:reduced}:media;
  Object.defineProperty(viewport,'clientHeight',{value:height});
  viewport.getBoundingClientRect=()=>({top:88,bottom:768,height});
  screens.forEach((el,i)=>{el.getBoundingClientRect=()=>({top:88+i*height-viewport.scrollTop,bottom:88+(i+1)*height-viewport.scrollTop,height});});
  viewport.scrollTo=(options)=>{calls.push(options);viewport.scrollTop=options.top;};
  win.scrollTo=(options)=>windowCalls.push(options);
  win.HTMLElement.prototype.scrollIntoView=function(){};
  win.fetch=()=>{throw Error('Catalog unavailable; fullpage must remain independent');};
  win.eval(code);
  doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  function key(name,target=doc.body,extra={}) {const e=new win.KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true,...extra});target.dispatchEvent(e);return e;}
  function wheel(delta=100,target=doc.body,extra={}) {const e=new win.WheelEvent('wheel',{deltaY:delta,bubbles:true,cancelable:true,...extra});target.dispatchEvent(e);return e;}
  return {dom,win,doc,viewport,screens,height,calls,windowCalls,tick,key,wheel,resize(value){large=value;win.dispatchEvent(new win.Event('resize'));tick(20);},close(){dom.window.close();}};
}
test('actual HTML loads a standalone controller before the data module',()=>{
  assert(entry.hasAttribute('defer'));
  assert(!/\bimport\s/.test(code));
  assert(html.indexOf('src="js/home-fullpage.js')<html.indexOf('src="js/pages/home.js'));
  assert(!html.includes('src="home-scenes.js'));
});
test('all six screens initialize without catalog or network access',async()=>{
  const p=await setup();
  assert.equal(p.viewport.dataset.fullpageState,'active');
  assert.equal(p.screens.length,6);
  assert.equal(p.doc.querySelector('[data-scene-count]').textContent,'01 / 06');
  assert.equal(p.doc.body.dataset.fullpageReady,'true');
  assert.equal(p.screens.filter(s=>s.inert).length,5);
  p.close();
});
test('one ArrowDown moves exactly one full viewport and cancels browser pixel scrolling',async()=>{
  const p=await setup();const event=p.key('ArrowDown');
  assert.equal(event.defaultPrevented,true);
  assert.equal(p.viewport.scrollTop,p.height);
  assert.equal(p.viewport.dataset.activeScene,'akses');
  assert.equal(p.calls.length,1);
  assert.equal(p.windowCalls.length,1,'document scrolling is only reset during initialization');
  p.tick(700);assert.equal(p.viewport.scrollTop,p.height);p.close();
});
test('ArrowDown over an ordinary link or button still changes one screen',async()=>{
  const p=await setup();
  assert.equal(p.key('ArrowDown',p.doc.querySelector('.hero__next')).defaultPrevented,true);
  assert.equal(p.viewport.scrollTop,p.height);
  p.tick(700);
  assert.equal(p.key('ArrowDown',p.doc.querySelector('[data-scene-next]')).defaultPrevented,true);
  assert.equal(p.viewport.scrollTop,2*p.height);p.close();
});
test('holding a key is consumed and never becomes native incremental scrolling',async()=>{
  const p=await setup();p.key('ArrowDown');
  for(let i=0;i<8;i++)assert.equal(p.key('ArrowDown',p.doc.body,{repeat:true}).defaultPrevented,true);
  assert.equal(p.calls.length,1);p.tick(700);
  assert.equal(p.key('ArrowDown',p.doc.body,{repeat:true}).defaultPrevented,true);
  assert.equal(p.viewport.scrollTop,p.height);p.close();
});
test('separate key presses traverse all screens and reach the footer',async()=>{
  const p=await setup();
  for(let i=1;i<6;i++){p.key('ArrowDown');p.tick(700);assert.equal(p.viewport.scrollTop,i*p.height);}
  assert.equal(p.viewport.dataset.activeScene,'tentang-layanan');
  assert.equal(p.doc.querySelector('[data-scene-count]').textContent,'06 / 06');
  const last=p.key('ArrowDown');assert.equal(last.defaultPrevented,true);assert.equal(p.viewport.scrollTop,5*p.height);
  p.key('ArrowUp');p.tick(700);assert.equal(p.viewport.scrollTop,4*p.height);p.close();
});
test('one wheel notch over a card/link moves a whole screen, even with tall content',async()=>{
  const p=await setup();
  Object.defineProperty(p.screens[0],'scrollHeight',{value:1800});
  const e=p.wheel(100,p.doc.querySelector('.hero__next'));
  assert.equal(e.defaultPrevented,true);assert.equal(p.viewport.scrollTop,p.height);
  p.tick(700);assert.equal(p.viewport.scrollTop,p.height);p.close();
});
test('one trackpad gesture cannot skip several screens through inertia',async()=>{
  const p=await setup();p.wheel(60);
  for(let i=0;i<12;i++){p.tick(70);p.wheel(30);}
  assert.equal(p.calls.length,1);assert.equal(p.viewport.scrollTop,p.height);
  p.tick(300);p.wheel(100);
  assert.equal(p.viewport.scrollTop,2*p.height);p.close();
});
test('small trackpad deltas are consumed until they trigger one full move',async()=>{
  const p=await setup();
  assert.equal(p.wheel(4).defaultPrevented,true);assert.equal(p.viewport.scrollTop,0);
  p.wheel(4);p.wheel(4);assert.equal(p.viewport.scrollTop,p.height);assert.equal(p.calls.length,1);p.close();
});
test('PageDown, PageUp, Home and End navigate exact screen boundaries',async()=>{
  const p=await setup();
  p.key('End');p.tick(700);assert.equal(p.viewport.scrollTop,5*p.height);
  p.key('PageUp');p.tick(700);assert.equal(p.viewport.scrollTop,4*p.height);
  p.key('Home');p.tick(700);assert.equal(p.viewport.scrollTop,0);
  p.key('PageDown');p.tick(700);assert.equal(p.viewport.scrollTop,p.height);p.close();
});
test('text editing, zoom and horizontal gestures retain their native behavior',async()=>{
  const p=await setup();
  assert.equal(p.key('ArrowDown',p.doc.querySelector('input')).defaultPrevented,false);
  assert.equal(p.wheel(100,p.doc.body,{ctrlKey:true}).defaultPrevented,false);
  assert.equal(p.wheel(20,p.doc.body,{deltaX:150}).defaultPrevented,false);
  assert.equal(p.calls.length,0);p.close();
});
test('open Feedback dialogs and native scroll widgets are not hijacked',async()=>{
  const p=await setup();
  const dialog=p.doc.createElement('section');dialog.setAttribute('role','dialog');p.doc.body.append(dialog);
  assert.equal(p.key('ArrowDown').defaultPrevented,false);assert.equal(p.wheel().defaultPrevented,false);
  dialog.hidden=true;
  const area=p.doc.createElement('textarea');p.screens[0].append(area);
  assert.equal(p.wheel(100,area).defaultPrevented,false);
  assert.equal(p.wheel().defaultPrevented,true);assert.equal(p.viewport.scrollTop,p.height);p.close();
});
test('navigation buttons, dots and a section anchor select whole panels',async()=>{
  const p=await setup();p.doc.querySelector('[data-scene-jump="3"]').click();p.tick(700);
  assert.equal(p.viewport.scrollTop,3*p.height);
  p.doc.querySelector('[data-scene-previous]').click();p.tick(700);assert.equal(p.viewport.scrollTop,2*p.height);
  const link=p.doc.querySelector('.hero__next');link.click();p.tick(700);assert.equal(p.viewport.scrollTop,p.height);
  assert.equal(p.win.location.hash,'#akses');p.close();
});
test('deep links and hash changes align to their target screen',async()=>{
  const p=await setup({hash:'#realisasi'});assert.equal(p.viewport.scrollTop,4*p.height);
  p.win.history.replaceState(null,'','#agenda');p.win.dispatchEvent(new p.win.HashChangeEvent('hashchange'));
  assert.equal(p.viewport.scrollTop,3*p.height);p.close();
});
test('reduced motion still advances one full screen immediately',async()=>{
  const p=await setup({reduced:true});p.key('ArrowDown');
  assert.equal(p.viewport.scrollTop,p.height);assert.equal(p.calls.length,0);
  assert.equal(p.viewport.dataset.transitioning,'false');p.close();
});
test('mobile and embed modes preserve readable native scrolling',async()=>{
  for(const args of [{desktop:false},{query:'?embed=1'}]) {
    const p=await setup(args);assert.equal(p.viewport.dataset.fullpageState,'native');
    assert.equal(p.key('ArrowDown').defaultPrevented,false);assert.equal(p.wheel().defaultPrevented,false);
    assert(p.screens.every(s=>!s.inert));p.close();
  }
});
test('resizing keeps the selected panel and restores it when returning to desktop',async()=>{
  const p=await setup();p.key('ArrowDown');p.tick(700);
  p.resize(false);assert.equal(p.viewport.dataset.fullpageState,'native');
  p.resize(true);assert.equal(p.viewport.dataset.fullpageState,'active');assert.equal(p.viewport.scrollTop,p.height);p.close();
});
