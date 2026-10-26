import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const destination=path.join(root,'preview-dist');
await fs.mkdir(destination,{recursive:true});
for(const name of ['js','css','assets']) await fs.cp(path.join(root,name),path.join(destination,name),{recursive:true,force:true});
for(const item of await fs.readdir(root,{withFileTypes:true})) {
  if(item.isFile()&&(/\.html$/.test(item.name)||['manifest.webmanifest','robots.txt','catalog-version.json'].includes(item.name))) await fs.copyFile(path.join(root,item.name),path.join(destination,item.name));
}
