import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_DATA as data } from '../website/js/data/local-data.js?v=0.9.7-rc2';
import { BUNDLED_SEARCH_INDEX } from '../website/js/data/search-index.js?v=0.9.7-rc2';
import { searchResourcesDetailed as search } from '../website/js/search.js?v=0.9.7-rc2';
import { realizationEvaluation, realizationDeviation } from '../website/js/information-utils.js?v=0.9.7-rc2';
import { comparePeriods, resourceDisplayTitle } from '../website/js/catalog-utils.js?v=0.9.7-rc2';
const all = [...data.resources, ...BUNDLED_SEARCH_INDEX];
const query = (text) => search(all, text, data.synonyms);
test('category-year browsing still finds all seven DPA branches', () => assert.equal(query('DPA 2026').items.length, 7));
test('an unmatched extra word is never discarded silently', () => assert.equal(query('DPA tidakada 2026').items.length, 0));
test('Renja typo corrects to exact requested family and year', () => {
  const r = query('renja akhr 2026');
  assert.equal(r.intent.key, 'fuzzy-folder');
  assert.equal(r.items.length, 1);
  assert.match(r.items[0].resource.leafName, /AKHIR/);
  assert.equal(r.items[0].resource.year, 2026);
  assert.match(r.intent.guidance, /koreksi ejaan/);
});
test('Coretax typo returns an explicitly identified spelling suggestion', () => {
  const r = query('coretx');
  assert.equal(r.intent.key, 'fuzzy-application');
  assert.deepEqual(r.items.map((i) => i.resource.title), ['Coretax']);
  assert.match(r.intent.guidance, /ejaan yang mendekati/);
});
test('explicit branch constraints are preserved', () => {
  const r = query('DPA pergeseran sudah ttd 2026');
  assert.equal(r.items.length, 1);
  assert.match(r.items[0].resource.path, /PERGESERAN.*SUDAH TTD/);
});
test('folder titles discriminate branches without relying on small path text', () => {
  const items = query('DPA 2026').items.map((i) => resourceDisplayTitle(i.resource));
  assert.equal(new Set(items).size, items.length);
  assert(items.some((t) => t.includes('PERGESERAN') && t.includes('SUDAH TTD')));
});
test('period ordering prioritizes current annual work before older multiyear coverage', () => {
  const rows = [
    { title:'RPJPD', yearStart:2025, yearEnd:2045 }, { title:'DPA', yearStart:2026, yearEnd:2026 },
    { title:'Next', yearStart:2027, yearEnd:2027 }, { title:'Archive', yearStart:2024, yearEnd:2024 }
  ].sort((a,b) => comparePeriods(a,b,2026));
  assert.deepEqual(rows.map((r) => r.title), ['DPA','RPJPD','Archive','Next']);
});
test('low equal or near-equal metrics do not assert target achievement without targets', () => {
  for (const [financialValue, physicalValue] of [[1,2],[1,1],[1,.99]]) {
    const result = realizationEvaluation({ financialValue, physicalValue });
    assert.equal(result.state, 'balanced');
    assert.match(result.description, /Target periode belum tersedia/);
    assert.doesNotMatch(result.status, /Sesuai|tercapai/);
  }
});
test('large differences trigger review in either direction, rather than a judgment of invalid data', () => {
  for (const item of [{financialValue:60,physicalValue:50},{financialValue:50,physicalValue:60}]) {
    assert.equal(realizationEvaluation(item).state, 'attention');
    assert.equal(realizationDeviation(item).severity, 'large');
  }
});
test('evaluation uses explicit targets and respects configured tolerance', () => {
  assert.equal(realizationEvaluation({financialValue:50,physicalValue:55,financialTarget:50,physicalTarget:55}).status, 'Target tercapai');
  assert.equal(realizationEvaluation({financialValue:49,physicalValue:55,financialTarget:50,physicalTarget:55}).status, 'Di bawah target');
  assert.equal(realizationEvaluation({financialValue:1,physicalValue:1.1},0).state, 'attention');
});
test('missing percentages remain unknown rather than turning into zero', () => {
  assert.equal(realizationEvaluation({financialValue:null,physicalValue:2}).state,'unknown');
});
