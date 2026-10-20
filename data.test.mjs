import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../website/js/config.js?v=0.9.7-rc2';
import { getInitialData, refreshFromSheets, ensureSearchIndex, sourceDescription } from '../website/js/data/data-service.js?v=0.9.7-rc2';
import { clearMemoryCache, saveCache } from '../website/js/data/cache.js?v=0.9.7-rc2';
import { decodeSheet } from '../website/js/data/sheets.js?v=0.9.7-rc2';

beforeEach(() => {
  clearMemoryCache();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });
});
function serve(text) {
  globalThis.fetch = async () => ({ ok: true, text: async () => text });
}
async function refresh(section, text) {
  serve(text);
  return refreshFromSheets({ sections: [section], force: true });
}
test('initial dashboard has no example metrics, agenda, or materials; index is deferred', () => {
  const d = getInitialData();
  assert.equal(d.realization.length, 0);
  assert.equal(d.agenda.length, 0);
  assert.equal(d.monevMaterials.length, 0);
  assert.equal(d.searchIndex.length, 0);
  assert.equal(d.resources.length, 159);
  assert.match(sourceDescription(d, 'realization'), /belum terkonfirmasi/);
});
test('valid empty catalog replaces the bundled catalog and remains empty on next page', async () => {
  const r = await refresh('resources', 'id,title,url,workspace_id,is_active\n');
  assert.equal(r.partialFailure, false);
  assert.equal(r.data.resources.length, 0);
  assert.equal(getInitialData().resources.length, 0);
  assert.equal(getInitialData().groups.length, 0);
});
test('all inactive rows stay inactive and migration does not restore applications', async () => {
  const r = await refresh('resources', 'id,title,url,workspace_id,is_active\napp-x,Test,https://example.org,keuangan,FALSE');
  assert.equal(r.data.resources.length, 0);
  assert.equal(r.partialFailure, false);
});
test('schema failure is distinguished from valid empty and keeps last readable snapshot', async () => {
  await refresh('resources', 'id,title,url,workspace_id,is_active\nx,Folder X,https://example.org,keuangan,TRUE');
  const r = await refresh('resources', '<html>Sign in</html>');
  assert.equal(r.partialFailure, true);
  assert.equal(r.data.resources[0].title, 'Folder X');
  assert.equal(r.data._meta.resources.failed, true);
  assert.match(sourceDescription(r.data, 'resources'), /pembaruan terakhir gagal/);
});
test('network failure identifies failed component without claiming latest content', async () => {
  globalThis.fetch = async () => { throw Error('offline'); };
  const r = await refreshFromSheets({ sections: ['agenda'], force: true });
  assert.deepEqual(r.failedSheets, ['Agenda']);
  assert.equal(r.data.agenda.length, 0);
  assert.equal(r.data._meta.agenda.source, 'bundled');
});
test('example rows from online Realization are excluded and reported', async () => {
  const r = await refresh('realization', 'id,year,month,financial_value,physical_value,description,is_active\nr1,2026,7,49.61,54.52,Data contoh kumulatif,TRUE');
  assert.equal(r.data.realization.length, 0);
  assert.equal(r.partialFailure, false);
  assert.match(r.warnings.join(' '), /contoh dikecualikan/);
});
test('valid percentages and optional targets remain attached to their reporting period', async () => {
  const r = await refresh('realization', 'id,year,month,financial_value,physical_value,financial_target,physical_target,updated_at,is_active\nr1,2026,7,49.61,54.52,50,55,2026-08-02,TRUE');
  assert.equal(r.partialFailure, false);
  assert.equal(r.data.realization[0].financialTarget, 50);
  assert.equal(r.data.realization[0].month, 7);
  assert.equal(r.data.realization[0].updatedAt, '2026-08-02');
});
for (const [name, lines] of [
  ['out of range', 'a,2026,7,101,54,TRUE'],
  ['invalid number', 'a,2026,7,error,54,TRUE'],
  ['invalid month', 'a,2026,13,50,54,TRUE'],
  ['duplicate month', 'a,2026,7,50,54,TRUE\nb,2026,7,51,55,TRUE']
]) test(`invalid realization rejected: ${name}`, async () => {
  const r = await refresh('realization', `id,year,month,financial_value,physical_value,is_active\n${lines}`);
  assert.equal(r.partialFailure, true);
  assert.equal(r.data.realization.length, 0);
});
test('invalid calendar dates reject agenda instead of normalizing to another month', async () => {
  const r = await refresh('agenda', 'id,title,date,is_active\na,Meeting,2026-02-30,TRUE');
  assert.equal(r.partialFailure, true);
});
test('CSV handles quoted commas/newlines and rejects malformed headers or incomplete quotes', () => {
  const rows = decodeSheet('id,title,date,is_active\na,"Meeting, planning\n2026",2026-10-21,TRUE', 'Agenda');
  assert.equal(rows[0].title, 'Meeting, planning\n2026');
  assert.throws(() => decodeSheet('id,title,title,date,is_active\n', 'Agenda'));
  assert.throws(() => decodeSheet('id,title,date,is_active\na,"Meeting', 'Agenda'));
  assert.throws(() => decodeSheet('', 'Agenda'));
});
test('fresh cache avoids duplicate fetches and forced refresh bypasses it', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return {ok:true, text:async () => 'id,title,date,is_active\n'}; };
  await refreshFromSheets({ sections: ['agenda'] });
  await refreshFromSheets({ sections: ['agenda'] });
  assert.equal(calls, 1);
  await refreshFromSheets({ sections: ['agenda'], force: true });
  assert.equal(calls, 2);
});
test('search index failure is visible with a separate bundled fallback', async () => {
  globalThis.fetch = async () => { throw Error('offline'); };
  const r = await ensureSearchIndex({ force: true });
  assert.equal(r.items.length, 631);
  assert.equal(r.meta.failed, true);
  assert.equal(r.meta.source, 'bundled');
});
test('valid empty search index is not replaced by bundled folders', async () => {
  serve('id,title,folder_url,is_active\n');
  const r = await ensureSearchIndex({ force: true });
  assert.equal(r.items.length, 0);
  assert.equal(r.meta.source, 'live');
});
test('expired cache is marked separately from reporting freshness', () => {
  saveCache('agenda', [], [], Date.now() - CONFIG.cacheTtlMs - 1);
  const d = getInitialData();
  assert.equal(d._meta.agenda.fresh, false);
  assert.match(sourceDescription(d, 'agenda'), /perlu diperbarui/);
});
test('incomplete legacy realization is rejected rather than erasing a readable snapshot', async () => {
  const r = await refresh('realization','id,title,period,value,is_active\na,Realisasi Keuangan,Juli 2026,50,TRUE');
  assert.equal(r.partialFailure,true);
});
test('a complete legacy pair still normalizes into one monthly record', async () => {
  const r = await refresh('realization','id,title,period,value,is_active\na,Realisasi Keuangan,Juli 2026,50,TRUE\nb,Realisasi Fisik,Juli 2026,55,TRUE');
  assert.equal(r.partialFailure,false);
  assert.equal(r.data.realization.length,1);
  assert.equal(r.data.realization[0].physicalValue,55);
});
