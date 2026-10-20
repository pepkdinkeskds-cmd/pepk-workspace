import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../website');
const files = [];
async function walk(dir) {for (const item of await fs.readdir(dir,{withFileTypes:true})) {const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else files.push(p);}}
await walk(root);
const failures = [];
const assert = (condition,message) => {if(!condition)failures.push(message);};
for (const file of files) {
  if (file.endsWith('.js')) {
    const check = spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert(check.status===0,`${file}: ${check.stderr}`);
    const code = await fs.readFile(file,'utf8');
    for (const m of code.matchAll(/(?:from\s*|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g)) {
      const [relative,query] = m[2].split('?');
      assert(files.includes(path.resolve(path.dirname(file),relative)),`Missing module ${file}: ${relative}`);
      assert(query==='v=0.9.7-rc2',`Mixed module identity ${file}: ${m[2]}`);
    }
    assert(!code.includes('0.9.6 RC1')&&!code.includes('v=0.9.6-rc1'),`Old release ID ${file}`);
  }
  if (file.endsWith('.html')) {
    const html = await fs.readFile(file,'utf8');
    const doc = new JSDOM(html).window.document;
    const ids = [...doc.querySelectorAll('[id]')].map((n)=>n.id);
    assert(new Set(ids).size===ids.length,`Duplicate IDs ${file}`);
    assert(doc.documentElement.lang==='id',`Missing language ${file}`);
    assert(doc.querySelector('main')&&doc.querySelector('.skip-link'),`Missing landmark ${file}`);
    assert(doc.querySelector('meta[http-equiv="Content-Security-Policy"]'),`Missing CSP ${file}`);
    for (const node of doc.querySelectorAll('[src],link[href],a[href]')) {
      const raw=node.getAttribute('src')||node.getAttribute('href');
      if(!raw||/^(https?:|mailto:|#|data:)/.test(raw))continue;
      const relative=raw.split(/[?#]/)[0];
      assert(files.includes(path.resolve(path.dirname(file),relative)),`Missing asset ${file}: ${raw}`);
    }
    for (const node of doc.querySelectorAll('[aria-controls]')) for (const id of node.getAttribute('aria-controls').split(/\s+/)) assert(doc.getElementById(id),`Broken aria-controls ${file}: ${id}`);
    for (const input of doc.querySelectorAll('input:not([type="hidden"]),select,textarea')) assert(input.id&&doc.querySelector(`label[for="${input.id}"]`),`Missing label ${file}`);
    assert(!/data-state="ready">Siap digunakan/.test(html),`Premature ready ${file}`);
  }
}
postcss.parse(await fs.readFile(path.join(root,'css/main.css'),'utf8'));
const server=await fs.readFile(path.resolve(root,'../submission-portal/SubmissionPortal.gs'),'utf8');new vm.Script(server);
assert(!files.some((f)=>/\.(gs|xlsx|zip)$/.test(f)), 'Non-public package content in website');
const metrics={html:files.filter(f=>f.endsWith('.html')).length,js:files.filter(f=>f.endsWith('.js')).length,cssBytes:(await fs.stat(path.join(root,'css/main.css'))).size,initialCatalogBytes:(await fs.stat(path.join(root,'js/data/local-data.js'))).size,deferredIndexBytes:(await fs.stat(path.join(root,'js/data/search-index.js'))).size,files:files.length};
console.log(JSON.stringify({ok:failures.length===0,metrics,failures},null,2));
if(failures.length)process.exitCode=1;
