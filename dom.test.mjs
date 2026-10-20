import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

async function page(name, { desktop = true, reduced = true } = {}) {
  const html = await fs.readFile(new URL(`../website/${name}.html`, import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: `https://example.org/pepk/${name}.html?nosync=1`, runScripts:'outside-only', pretendToBeVisual:true });
  const win = dom.window;
  win.matchMedia = (q) => ({ matches:q.includes('reduced') ? reduced : desktop, addEventListener(){} });
  win.scrollTo = () => {};
  win.HTMLElement.prototype.scrollIntoView = () => {};
  for (const key of ['window','document','Node','Element','Event','Option','MutationObserver','history','localStorage']) {
    Object.defineProperty(globalThis, key, { configurable:true, value:key === 'window' ? win : win[key] });
  }
  return dom;
}
test('all seven page entry modules render their real DOM offline without fake metrics', async () => {
  const modules = {index:'home',resources:'resources',workspace:'workspace',information:'information',monev:'monev',contribute:'contribute',about:'about'};
  for (const [name, module] of Object.entries(modules)) {
    const dom = await page(name);
    await import(`../website/js/pages/${module}.js?dom-page=${name}`);
    assert.equal(document.documentElement.dataset.pageReady, 'true', name);
    assert(document.querySelector('[data-nav][aria-current]'), name);
    assert.doesNotMatch(document.body.textContent, /72,45%|68,2%|MISS_WARMED/);
    if (name === 'index') {
      assert.equal(document.querySelectorAll('[data-workspaces] .workspace-card').length,4);
      assert.equal(document.querySelectorAll('[data-quick-apps] a').length,4);
      assert.match(document.querySelector('[data-realization-preview]').textContent, /belum tersedia/);
    }
    if (name === 'resources') {
      assert.equal(document.querySelector('[data-resource-count]').textContent,'159');
      assert.equal(document.querySelectorAll('[data-resource-list] > a').length,24);
      const filter = document.querySelector('[data-type-filter]');
      filter.value = 'application';
      filter.dispatchEvent(new dom.window.Event('change'));
      assert.equal(document.querySelector('[data-resource-count]').textContent,'19');
      assert.equal(document.querySelector('[data-year-filter]').disabled,true);
    }
    if (name === 'monev') assert.match(document.querySelector('[data-monev-upload-link]').href,/module=monev/);
    if (name === 'information') assert.match(document.querySelector('[data-agenda-submit-link]').href,/module=agenda/);
    if (name === 'contribute') {
      for (const module of ['document','agenda','monev','reference']) assert(document.querySelector(`a[href$="module=${module}"]`));
    }
    dom.window.close();
  }
});

test('independent mobile menu works before any data module and closes with Escape', async () => {
  const dom = await page('index', { desktop:false });
  const code = await fs.readFile(new URL('../website/js/mobile-nav.js',import.meta.url),'utf8');
  dom.window.eval(code);
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const button = document.querySelector('[data-menu-button]');
  button.click();
  assert.equal(button.getAttribute('aria-expanded'),'true');
  assert.equal(document.querySelector('[data-mobile-nav]').hidden,false);
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(button.getAttribute('aria-expanded'),'false');
  assert.equal(document.activeElement,button);
  dom.window.close();
});

test('scene navigation honors desktop keys/wheel while preserving inputs, mobile, dialogs and long content', async () => {
  const dom = await page('index');
  const win = dom.window;
  Object.defineProperty(win, 'innerHeight', {value:800,configurable:true});
  let scroll = 0;
  const calls = [];
  Object.defineProperty(win, 'scrollY', {get:()=>scroll,configurable:true});
  win.scrollTo = (options) => { calls.push(options); scroll = options.top; };
  const scenes = [...document.querySelectorAll('[data-home-scene]')];
  const header = document.querySelector('.site-header');
  header.getBoundingClientRect = () => ({height:88});
  scenes.forEach((el,i) => { el.getBoundingClientRect = () => ({top:88+i*712-scroll,bottom:800+i*712-scroll,height:712}); });
  document.querySelector('.site-footer').getBoundingClientRect = () => ({top:88+5*712-scroll});
  const { initHomeScenes } = await import('../website/js/home-scenes.js?v=0.9.7-rc2');
  initHomeScenes();
  const key = (name,target=document.body,options={}) => {
    const e = new win.KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true,...options});
    target.dispatchEvent(e); return e;
  };
  assert.equal(key('PageDown').defaultPrevented,true);
  assert.equal(calls.at(-1).top,712);
  assert.equal(calls.at(-1).behavior,'instant');
  await new Promise((resolve)=>setTimeout(resolve,170));
  assert.equal(key('ArrowDown',document.querySelector('input')).defaultPrevented,false);
  assert.equal(key('PageDown',document.body,{ctrlKey:true}).defaultPrevented,false);
  const dialog = document.createElement('div');dialog.setAttribute('role','dialog');document.body.append(dialog);
  assert.equal(key('PageDown').defaultPrevented,false); dialog.remove();
  scenes[1].getBoundingClientRect = () => ({top:88,bottom:1200,height:1112});
  assert.equal(key('PageDown').defaultPrevented,false);
  scenes[1].getBoundingClientRect = () => ({top:88+712-scroll,bottom:1512-scroll,height:712});
  const wheel = new win.WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true});
  document.body.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented,true);
  assert.equal(calls.at(-1).top,1424);
  const before = calls.length;
  document.body.dispatchEvent(new win.WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));
  assert.equal(calls.length,before,'inertia must not skip another scene');
  const ctrlWheel = new win.WheelEvent('wheel',{deltaY:100,ctrlKey:true,bubbles:true,cancelable:true});
  document.body.dispatchEvent(ctrlWheel);
  assert.equal(ctrlWheel.defaultPrevented,false,'browser zoom must be preserved');
  win.matchMedia = () => ({matches:false});
  dom.window.close();
});

test('a real zero count does not fall back to bundled workspace statistics', async () => {
  const dom = await page('index');
  const {workspaceCard} = await import('../website/js/ui.js?v=0.9.7-rc2');
  const card = workspaceCard({id:'test',title:'Test',description:'',resourceCount:99,groupCount:12,applicationCount:7},{groups:0,documents:0,applications:0});
  assert.match(card.textContent,/0 kelompok • 0 folder/);
  assert.doesNotMatch(card.textContent,/99|12|7 aplikasi/);
  dom.window.close();
});

test('mobile preserves native wheel and keyboard scrolling', async () => {
  const dom = await page('index',{desktop:false});
  const { initHomeScenes } = await import('../website/js/home-scenes.js?v=0.9.7-rc2');
  initHomeScenes();
  for (const event of [new dom.window.KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}),new dom.window.WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true})]) {
    document.body.dispatchEvent(event); assert.equal(event.defaultPrevented,false);
  }
  dom.window.close();
});

test('Feedback opens/closes without sending a submission', async () => {
  const dom = await page('index');
  await import('../website/js/feedback.js?dom-feedback');
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  document.querySelector('.feedback-launcher').click();
  assert.equal(document.querySelector('.feedback-panel').hidden,false);
  document.querySelector('.feedback-panel__close').click();
  assert.equal(document.querySelector('.feedback-panel').hidden,true);
  dom.window.close();
});
