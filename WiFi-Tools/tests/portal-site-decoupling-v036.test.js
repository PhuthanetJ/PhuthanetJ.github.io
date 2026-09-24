'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), P = require('../js/portal-bindings.js'), B = require('../js/banner-model.js'), R = require('../js/radius-catalog-model.js');
const baseData = {};
for (const f of fs.readdirSync(path.join(__dirname, '../data'))) if (f.endsWith('.json')) baseData[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));
function app(name = '', page = 'login', href = null) {
  const data = JSON.parse(JSON.stringify(baseData));
  const nodes = new Map(), node = () => ({ addEventListener() {}, setAttribute() {}, prepend() {}, textContent: '', hidden: false, value: '' });
  const root = { dataset: { page }, querySelector: s => { if (page === 'login') return null; if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); }, querySelectorAll: () => [], hidden: false };
  const c = { NT_DATA: data, WiFiDomain: D, WiFiPortalBindings: P, WiFiBanners: B, WiFiRadiusCatalog: R, URL, Date, JSON, console,
    location: { href: href || 'file:///demo/html/' + page + '.html', replace() {}, reload() {} }, document: { getElementById: () => root, createElement: node },
    localStorage: { getItem: () => null, setItem() {} }, setTimeout };
  c.window = c; c.name = name; c.addEventListener = () => {};
  vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), c); return c;
}

test('V036 creating a RADIUS Site does not create any Portal Path', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const before = first.NT.portalPathChoices().length;
  const created = R.upsertSite(first.NT.radiusCatalog(), { name: 'No Auto Portal Site', vlanId: '360', location: 'Lab', concurrent: '25', description: 'V036', allowPackages: [] });
  first.NT.setRadiusCatalog(created.snapshot);
  assert.ok(first.NT.allowedSites().some(site => site.id === created.record.id));
  assert.equal(first.NT.db.configs[created.record.id], undefined);
  assert.equal(first.NT.portalPathChoices().length, before);
  assert.equal(first.NT.portalPathChoices().some(row => row.siteIds.includes(created.record.id)), false);
});

test('V036 an unassigned Site can be current context without being persisted as a Portal Path', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const created = R.upsertSite(first.NT.radiusCatalog(), { name: 'Unassigned Site', vlanId: '361', location: 'Lab', concurrent: '25', description: 'V036', allowPackages: [] });
  first.NT.setRadiusCatalog(created.snapshot);
  first.NT.db.currentSite = created.record.id; first.NT.persist();
  const portal = app(first.name, 'builder');
  assert.equal(portal.NT.currentSite, created.record.id);
  assert.equal(portal.NT.portalConfigMode, 'list');
  assert.equal(portal.NT.db.configs[created.record.id], undefined);
  assert.equal(portal.NT.portalChoices(created.record.id).length, 0);
  assert.equal(portal.NT.db.portalSelections[created.record.id], undefined);
});

test('V036 Portal Path creation is explicit and can bind the previously unassigned Site', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const created = R.upsertSite(first.NT.radiusCatalog(), { name: 'Manual Portal Site', vlanId: '362', location: 'Lab', concurrent: '25', description: 'V036', allowPackages: [] });
  first.NT.setRadiusCatalog(created.snapshot);
  const portal = app(first.name, 'builder');
  const id = portal.NT.createPortalPath({ name: 'Manual Portal', path: '/portal/manual-v036', template: 'Custom', siteIds: [created.record.id] });
  assert.ok(portal.NT.db.configs[id]);
  assert.deepEqual(Array.from(portal.NT.db.configs[id].bindings.siteIds), [created.record.id]);
  assert.ok(portal.NT.portalPathChoices().some(row => row.id === id && row.siteIds.includes(created.record.id)));
});
