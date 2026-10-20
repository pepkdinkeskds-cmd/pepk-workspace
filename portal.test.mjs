import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const server = await fs.readFile(new URL('../submission-portal/SubmissionPortal.gs',import.meta.url),'utf8');
const html = await fs.readFile(new URL('../submission-portal/SubmissionPortalView.html',import.meta.url),'utf8');
const baselines = JSON.parse(await fs.readFile(new URL('./portal-baseline-sha256.json',import.meta.url),'utf8'));
for (const file of Object.keys(baselines)) test(`unchanged production functions match their baseline byte-for-byte: ${file}`, () => {
  const text = file.endsWith('.gs') ? server : html;
  const regex = file.endsWith('.gs') ? /^function (\w+)\([^]*?^\}/gm : /^    function (\w+)\([^]*?^    \}/gm;
  const functions = new Map([...text.matchAll(regex)].map((m)=>[m[1],m[0]]));
  for (const [name,expected] of Object.entries(baselines[file])) {
    assert(functions.has(name),name);
    assert.equal(crypto.createHash('sha256').update(functions.get(name)).digest('hex'),expected,name);
  }
});
test('server and injected client scripts parse cleanly', () => {
  new vm.Script(server);
  const script = html.match(/<script>([^]*?)<\/script>/)[1].replace('<?!= bootstrapJson ?>','{}');
  new vm.Script(script);
});
test('initial module whitelist rejects arbitrary names and markup', () => {
  const code = server.match(/^function portalInitialModuleV0225_\([^]*?^\}/m)[0];
  const sandbox = {};vm.createContext(sandbox);vm.runInContext(code,sandbox);
  for (const name of ['document','reference','agenda','monev']) assert.equal(sandbox.portalInitialModuleV0225_({parameter:{module:name}}),name);
  for (const name of ['__proto__','constructor','<script>','MONEV','https://example.org','']) assert.equal(sandbox.portalInitialModuleV0225_({parameter:{module:name}}),'document');
  assert.equal(sandbox.portalInitialModuleV0225_(),'document');
});
test('portal client actually selects each requested form before any server call returns', async () => {
  for (const initialModule of ['document','reference','agenda','monev']) {
    const bootstrap = {appName:'PEPK Submission Portal',version:'0.2.2.5-beta',initialModule,maxFileMb:10,workspaceUrl:'https://example.org/pepk/index.html',writeEnabled:false};
    const dom = new JSDOM(html.replace('<?!= bootstrapJson ?>',JSON.stringify(bootstrap)),{url:'https://script.googleusercontent.com/test',runScripts:'outside-only',pretendToBeVisual:true});
    const calls = [];
    const runner = {withSuccessHandler(){return this;},withFailureHandler(){return this;},portalGetBootstrapV020(){calls.push('bootstrap');}};
    dom.window.google = {script:{run:runner}};
    dom.window.scrollTo = ()=>{};
    const script = dom.window.document.querySelector('script').textContent;
    dom.window.eval(script.replace("document.addEventListener('DOMContentLoaded', init);",''));
    dom.window.init();
    assert.equal(dom.window.document.querySelector('.type-card.active').dataset.type,initialModule);
    for (const name of ['document','reference','agenda','monev']) assert.equal(dom.window.document.getElementById(`${name}Form`).classList.contains('hidden'),name!==initialModule);
    assert.deepEqual(calls,['bootstrap']);
    dom.window.close();
  }
});
