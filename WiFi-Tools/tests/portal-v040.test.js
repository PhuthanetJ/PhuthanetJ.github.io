const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(base, 'data/thailand-provinces.json'), 'utf8'));

test('V040 Province grouping is independent from organization division and includes West', () => {
  const ids = data.regions.map(r => r.id);
  assert.deepEqual(ids, ['bangkok-metro','central','east','west','north','northeast','south']);
  const west = data.regions.find(r => r.id === 'west');
  assert.ok(west);
  assert.deepEqual(west.provinces, ['กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์','ตาก']);
  const all = data.regions.flatMap(r => r.provinces);
  assert.equal(all.length, 77);
  assert.equal(new Set(all).size, 77);
});

test('V040 division options remain a separate organization taxonomy', () => {
  const app = fs.readFileSync(path.join(base, 'js/app.js'), 'utf8');
  assert.match(app, /กรุงเทพและปริมณฑล/);
  assert.match(app, /ภาคกลาง/);
  assert.doesNotMatch(app, /\['west',\s*'ภาคตะวันตก'\]/);
});
