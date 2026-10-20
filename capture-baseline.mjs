// One-time import of a known source package; hashes let regression tests travel without copying old code.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const dir = process.argv[2];
if (!dir) throw Error('Provide baseline portal directory');
const result = {};
const exceptions = {
  'SubmissionPortal.gs':['onOpen','doGet','portalDiagnosticV021_'],
  'SubmissionPortalView.html':['init','onBootstrapReady','applyBootstrapV020','updateModeNoteV020','setActiveType','onSubmitSuccess']
};
for (const file of Object.keys(exceptions)) {
  const text = await fs.readFile(`${dir}/${file}`,'utf8');
  const regex = file.endsWith('.gs') ? /^function (\w+)\([^]*?^\}/gm : /^    function (\w+)\([^]*?^    \}/gm;
  const funcs = [...text.matchAll(regex)].filter((m)=>!exceptions[file].includes(m[1]));
  result[file] = Object.fromEntries(funcs.map((m)=>[m[1],crypto.createHash('sha256').update(m[0]).digest('hex')]));
}
await fs.writeFile(new URL('../tests/portal-baseline-sha256.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(result).map(([file,functions])=>[file,Object.keys(functions).length])));
