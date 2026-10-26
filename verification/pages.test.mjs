import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('all page entry modules resolve the repaired deployed paths and render offline',async()=>{
  const pages={index:'home',resources:'resources',workspace:'workspace',information:'information',monev:'monev',contribute:'contribute',about:'about','404':'about'};
  for(const [name,module] of Object.entries(pages)) {
    const html=await fs.readFile(new URL(`../${name}.html`,import.meta.url),'utf8');
    const dom=new JSDOM(html,{url:`https://example.org/pepk/${name}.html?nosync=1`,runScripts:'outside-only',pretendToBeVisual:true});
    dom.window.matchMedia=(query)=>({matches:!query.includes('max-height'),addEventListener(){}});
    dom.window.scrollTo=()=>{};
    dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
    for(const key of ['window','document','Node','Element','Event','Option','MutationObserver','history','localStorage']) Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?dom.window:dom.window[key]});
    await import(`../js/pages/${module}.js?verification=${name}`);
    assert.equal(document.documentElement.dataset.pageReady,'true',name);
    if(name==='index')assert.equal(document.querySelectorAll('[data-quick-apps] > a').length,4);
    if(name==='resources')assert.equal(document.querySelector('[data-resource-count]').textContent,'159');
    dom.window.close();
  }
});
