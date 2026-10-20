import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
async function walk(dir) {
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    if(['node_modules','verification'].includes(entry.name))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){await walk(file);continue;}
    if(!/\.(js|html)$/.test(file))continue;
    let text=await fs.readFile(file,'utf8');
    if(file.endsWith('.js')) text=text.replace(/(["'])(\.{1,2}\/[^"'\s]+\.js)(?:\?v=[^"']+)?\1/g,'$1$2?v=0.9.7-rc3$1');
    else text=text.replace(/\?v=0\.9\.[^"'\s>]+/g,'?v=0.9.7-rc3');
    if(!file.endsWith('submission-portal-bridge.js')) text=text.replaceAll('0.9.7 RC2','0.9.7 RC3');
    await fs.writeFile(file,text);
  }
}
await walk(root);
const file=path.join(root,'catalog-version.json');
const catalog=JSON.parse(await fs.readFile(file,'utf8'));catalog.release='0.9.7-rc3';catalog.home_navigation='fullpage-viewport';
await fs.writeFile(file,JSON.stringify(catalog,null,2)+'\n');
