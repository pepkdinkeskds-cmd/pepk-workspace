import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import postcss from 'postcss';
const root=path.resolve(process.argv[2]||path.join(import.meta.dirname,'..'));
const files=[];
async function scan(dir) {
  for(const item of await fs.readdir(dir,{withFileTypes:true})) {
    if(['node_modules','.git','verification','preview-dist','.openai'].includes(item.name))continue;
    const file=path.join(dir,item.name);if(item.isDirectory())await scan(file);else files.push(file);
  }
}
await scan(root);const failures=[];
const check=(ok,message)=>{if(!ok)failures.push(message);};
for(const file of files) {
  if(file.endsWith('.js')) {
    const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});check(parsed.status===0,`${file}: ${parsed.stderr}`);
    const text=await fs.readFile(file,'utf8');
    for(const match of text.matchAll(/(?:from\s*|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g)) {
      const [name,version]=match[2].split('?');
      check(files.includes(path.resolve(path.dirname(file),name)),`Missing import ${path.relative(root,file)} -> ${name}`);
      check(version==='v=0.9.7-rc4',`Wrong module release ${path.relative(root,file)} -> ${match[2]}`);
    }
  }
  if(file.endsWith('.html')) {
    const doc=new JSDOM(await fs.readFile(file,'utf8')).window.document;
    const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);check(ids.length===new Set(ids).size,`Duplicate ID ${file}`);
    for(const node of doc.querySelectorAll('[src],link[href],a[href]')) {
      const value=node.getAttribute('src')||node.getAttribute('href');
      if(!value||/^(https?:|mailto:|data:|#)/.test(value))continue;
      const target=path.resolve(path.dirname(file),value.split(/[?#]/)[0]);
      check(files.includes(target),`Missing deployed file ${path.relative(root,file)} -> ${value}`);
    }
    for(const node of doc.querySelectorAll('[aria-controls]')) for(const id of node.getAttribute('aria-controls').split(/\s+/)) check(doc.getElementById(id)||id==='pepk-feedback-panel',`Missing ARIA target ${id}`);
  }
  if(file.endsWith('.css'))postcss.parse(await fs.readFile(file,'utf8'));
}
const home=new JSDOM(await fs.readFile(path.join(root,'index.html'),'utf8')).window.document;
check(home.querySelector('script[defer][src="js/home-fullpage.js?v=0.9.7-rc4"]'),'Controller not loaded directly by index.html');
check(home.querySelector('script[defer][src="js/home-footer.js?v=0.9.7-rc4"]'),'Footer controller missing from index.html');
check(home.querySelector('link[href="css/home-fullpage.css?v=0.9.7-rc4"]'),'Viewport stylesheet missing from index.html');
check(home.querySelectorAll('[data-home-scene]').length===5,'Expected five screens');
check(!home.querySelector('[data-home-viewport]').contains(home.querySelector('footer')),'Footer inside screen viewport');
check(home.querySelector('footer [data-scene-select]'),'Section chooser missing from footer');
const page=await fs.readFile(path.join(root,'js/pages/home.js'),'utf8');check(!page.includes('initHomeScenes'),'Old controller still initializes');
check(!files.some(f=>path.dirname(f)===root&&f.endsWith('.js')),'Flattened JavaScript files found at root');
check(!files.some(f=>path.dirname(f)===root&&f.endsWith('.css')),'Flattened stylesheets found at root');
check(!files.some(f=>f.endsWith('.gs')),'Server source in website package');
const css=await fs.readFile(path.join(root,'css/home-fullpage.css'),'utf8');
check(css.includes('height: 100cqh')&&css.includes('overflow: hidden'),'Full viewport CSS contract missing');
const result={ok:failures.length===0,html:files.filter(f=>f.endsWith('.html')).length,js:files.filter(f=>f.endsWith('.js')).length,css:files.filter(f=>f.endsWith('.css')).length,static_files:files.length,failures};
console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
