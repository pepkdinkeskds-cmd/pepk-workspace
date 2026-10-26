import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {sourceHealthRows,emptySourceMessage} from '../js/source-health.js?v=0.9.7-rc4';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const footerCode=await fs.readFile(new URL('../js/home-footer.js',import.meta.url),'utf8');
async function setup() {
  const dom=new JSDOM(html,{url:'https://example.org/index.html?nosync=1',runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.eval(footerCode);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}
test('empty successful sources remain distinct from a read failure',()=>{
  const rows=sourceHealthRows({agenda:[],_meta:{agenda:{source:'live',fresh:true,checkedAt:Date.UTC(2026,9,26)}}});
  const agenda=rows.find(r=>r.key==='agenda');assert.equal(agenda.status,'Belum ada data aktif');assert.equal(agenda.tone,'ready');
  assert.match(emptySourceMessage({agenda:[],_meta:{agenda:{source:'live',fresh:true}}},'agenda'),/belum memuat catatan aktif/);
});
test('a failed refresh explains which cached data remains usable',()=>{
  const row=sourceHealthRows({resources:[{id:'x'}],_meta:{resources:{source:'cache',failed:true,checkedAt:Date.UTC(2026,9,25)}}}).find(r=>r.key==='resources');
  assert.equal(row.status,'Pembacaan gagal');assert.equal(row.count,1);assert.match(row.description,/Salinan terakhir digunakan/);
  assert.match(emptySourceMessage({_meta:{agenda:{failed:true}}},'agenda'),/Sumber belum dapat dibaca/);
});
test('excluded example metrics explain why realisation is not displayed',()=>{
  const data={realization:[],_meta:{realization:{source:'live',fresh:true,warnings:['Data contoh dikecualikan dari tampilan publik.']}}};
  const row=sourceHealthRows(data).find(r=>r.key==='realization');assert.equal(row.status,'Belum ditampilkan');assert.equal(row.tone,'warning');
  assert.match(row.description,/Data contoh/);assert.match(emptySourceMessage(data,'realization'),/Data contoh dikecualikan/);
});
test('reporting period and source-read timestamp are kept separate',()=>{
  const row=sourceHealthRows({realization:[{year:2026,month:7}],_meta:{realization:{source:'live',fresh:true,checkedAt:Date.UTC(2026,9,26)}}}).find(r=>r.key==='realization');
  assert.match(row.period,/Juli 2026/);assert.match(row.checked,/Okt 2026/);
});
test('status button updates its text while retaining the indicator and dialog control',async()=>{
  const dom=await setup(),doc=dom.window.document;
  doc.dispatchEvent(new dom.window.CustomEvent('pepk:data-status',{detail:{state:'warning',message:'Sumber terbaca; ada data perlu diperiksa',description:'Periksa realisasi.'}}));
  assert.equal(doc.querySelector('[data-footer-status-label]').textContent,'Perlu diperiksa');
  assert(doc.querySelector('.home-footer__status-dot'));
  doc.querySelector('[data-footer-status]').click();assert.equal(doc.querySelector('dialog').hasAttribute('open'),true);
  assert.match(doc.querySelector('[data-source-overview]').textContent,/Periksa realisasi/);dom.window.close();
});
test('source details render warning text safely without interpreting HTML',async()=>{
  const dom=await setup(),doc=dom.window.document;
  doc.dispatchEvent(new dom.window.CustomEvent('pepk:source-health',{detail:[{label:'Realisasi',status:'Belum ditampilkan',tone:'warning',description:'<img src=x onerror=alert(1)>',count:0,period:'',checked:'Belum dikonfirmasi'}]}));
  assert.equal(doc.querySelector('[data-source-rows] img'),null);assert.match(doc.querySelector('[data-source-rows]').textContent,/<img/);dom.window.close();
});
test('closing source details restores footer focus and leaves the selected screen intact',async()=>{
  const dom=await setup(),doc=dom.window.document,viewport=doc.querySelector('[data-home-viewport]');viewport.dataset.activeScene='agenda';
  const button=doc.querySelector('[data-footer-status]');button.click();
  doc.querySelector('dialog').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  assert.equal(doc.querySelector('dialog').hasAttribute('open'),false);assert.equal(doc.activeElement,button);assert.equal(viewport.dataset.activeScene,'agenda');dom.window.close();
});
test('Feedback reuses one footer launcher and can be opened/closed without submitting',async()=>{
  const dom=await setup();
  for(const key of ['window','document','Node','Element','Event','MutationObserver','localStorage'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?dom.window:dom.window[key]});
  await import('../js/feedback.js?footer-verification');document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const launcher=document.querySelector('[data-feedback-launcher]');launcher.click();
  assert.equal(document.querySelector('.feedback-panel').hidden,false);assert(launcher.closest('footer'));assert.equal(document.querySelectorAll('.feedback-launcher').length,0);
  document.querySelector('.feedback-panel__close').click();assert.equal(document.querySelector('.feedback-panel').hidden,true);assert.equal(launcher.getAttribute('aria-expanded'),'false');
  dom.window.close();
});
test('known warnings in a cached source are visible before online refresh finishes',async()=>{
  const dom=await setup();
  Object.defineProperty(globalThis,'window',{configurable:true,value:dom.window});
  Object.defineProperty(globalThis,'document',{configurable:true,value:dom.window.document});
  const {setContentReady}=await import('../js/status.js?v=0.9.7-rc4');
  setContentReady({realization:[],_meta:{realization:{source:'cache',checkedAt:Date.UTC(2026,9,26),fresh:true,warnings:['Data contoh dikecualikan.']}}});
  assert.equal(document.querySelector('[data-footer-status-label]').textContent,'Perlu diperiksa');dom.window.close();
});
