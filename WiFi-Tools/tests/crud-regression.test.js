'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), P = require('../js/portal-bindings.js'), B = require('../js/banner-model.js'), R = require('../js/radius-catalog-model.js'), A = require('../js/account-model.js'), N = require('../js/nas-model.js');
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

test('V034 regression: deleting the current Site does not corrupt Portal Configuration on reload', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const before = Object.keys(first.NT.db.configs);
  assert.ok(before.includes('a') && before.includes('b') && before.includes('c'));
  first.NT.setRadiusCatalog(R.removeSite(first.NT.radiusCatalog(), 'a'));
  assert.deepEqual(Array.from(first.NT.radiusCatalog().sites, s => s.id), ['b', 'c']);
  assert.equal(first.NT.db.currentSite, 'b');
  assert.equal(first.NT.db.configs.a, undefined, 'orphan single-site Portal config must be removed');
  assert.ok(first.NT.db.configs.b && first.NT.db.configs.c, 'unrelated Portal configs must remain');
  const portal = app(first.name, 'builder');
  assert.deepEqual(Array.from(portal.NT.allowedSites(), s => s.id), ['b', 'c']);
  assert.ok(portal.NT.portalPathChoices().length >= 2);
  assert.ok(portal.NT.portalPathChoices().every(row => !row.siteIds.includes('a')));
});

test('V034 startup recovers a V033 browser Draft that already contains a deleted Site reference', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const broken = JSON.parse(JSON.stringify(first.NT.db));
  const baselineCatalog = R.initial(baseData);
  if (!broken.radiusCatalog) broken.radiusCatalog = { sites: baselineCatalog.sites, packages: baselineCatalog.packages };
  broken.radiusCatalog.sites = broken.radiusCatalog.sites.filter(row => row.id !== 'a');
  broken.currentSite = 'a';
  // Intentionally leave configs.a.ownerSiteId/bindings.siteIds pointing at deleted Site A to reproduce V033 corruption.
  const brokenName = 'WIFI_TOOLS_DEMO:' + JSON.stringify(broken);
  const recovered = app(brokenName, 'builder');
  assert.equal(recovered.NT.db.currentSite, 'b');
  assert.equal(recovered.NT.db.configs.a, undefined);
  assert.deepEqual(Array.from(recovered.NT.allowedSites(), row => row.id), ['b', 'c']);
  assert.ok(recovered.NT.portalPathChoices().every(row => !row.siteIds.includes('a')));
});

test('V034 regression: shared Portal Path survives owner Site deletion by moving ownership to a remaining Site', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const portal = app(first.name, 'builder');
  const id = portal.NT.createPortalPath({ name: 'Shared Test', path: '/portal/shared-test', template: 'Custom', siteIds: ['a', 'b'] });
  portal.NT.setRadiusCatalog(R.removeSite(portal.NT.radiusCatalog(), 'a'));
  assert.ok(portal.NT.db.configs[id]);
  assert.equal(portal.NT.db.configs[id].ownerSiteId, 'b');
  assert.deepEqual(Array.from(portal.NT.db.configs[id].bindings.siteIds), ['b']);
  const reloaded = app(portal.name, 'builder');
  const row = reloaded.NT.portalPathChoices().find(item => item.id === id);
  assert.ok(row); assert.equal(row.ownerSiteId, 'b'); assert.deepEqual(Array.from(row.siteIds), ['b']);
});

test('V034 Site deletion cleans Site-scoped draft references without touching unrelated records', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  first.NT.db.channels.a = { email: { name: 'A' } }; first.NT.db.channels.b = { email: { name: 'B' } };
  first.NT.db.coupons.push({ siteId: 'a', code: 'A-1', hours: 1 }, { siteId: 'b', code: 'B-1', hours: 1 });
  first.NT.db.schedules.push({ id: 'job-a', siteIds: ['a'], requestedEnabled: true }, { id: 'job-ab', siteIds: ['a', 'b'], requestedEnabled: true });
  first.NT.setRadiusCatalog(R.removeSite(first.NT.radiusCatalog(), 'a'));
  assert.equal(first.NT.db.channels.a, undefined); assert.ok(first.NT.db.channels.b);
  assert.deepEqual(Array.from(first.NT.db.coupons, row => row.siteId), ['b']);
  const jobA = first.NT.db.schedules.find(row => row.id === 'job-a'), jobAB = first.NT.db.schedules.find(row => row.id === 'job-ab');
  assert.deepEqual(Array.from(jobA.siteIds), []); assert.equal(jobA.requestedEnabled, false);
  assert.deepEqual(Array.from(jobAB.siteIds), ['b']); assert.equal(jobAB.requestedEnabled, true);
});

test('V034 Site CRUD protects the last Site', () => {
  const base = R.initial(baseData); const one = { ...base, sites: [base.sites[0]] };
  assert.throws(() => R.removeSite(one, one.sites[0].id), /อย่างน้อย 1/);
  assert.throws(() => R.check({ sites: [], packages: base.packages }), /ไม่มี Site/);
});

test('V034 CRUD smoke matrix: NAS, Package, Site, Account and Portal Path preserve unrelated data', () => {
  // NAS full CRUD
  const nasValue = { nameHost: '192.0.2.99', shortname: 'audit-nas', type: 'other', ports: '1812,1813', secret: 'audit-secret', server: 'default', community: '', description: 'audit' };
  const nasCreate = N.upsert([], nasValue); const nasUpdate = N.upsert(nasCreate.rows, { ...nasValue, server: 'edited', secret: '' }, nasCreate.record.id);
  assert.equal(nasUpdate.record.server, 'edited'); assert.equal(N.remove(nasUpdate.rows, nasCreate.record.id).length, 0);

  // RADIUS Package + Site CRUD
  const catalog0 = R.initial(baseData);
  const packageValue = { policyName: 'Audit Package', userPrefix: 'AUD', usernameFormat: 'AUD########', packageExpired: '', packageType: 'Prepaid', upload: '0', download: '0', sessionTime: '0', sessionLimit: '0', idleTimeout: '0', time: '00:00', dailyTime: '00:00', weeklyTime: '00:00', monthlyTime: '00:00', expiration: 'Unlimited', expirationDate: '', expirationDays: '', price: '0', description: 'audit', status: 'Active' };
  const pkgCreate = R.upsertPackage(catalog0, packageValue); const pkgUpdate = R.upsertPackage(pkgCreate.snapshot, { ...pkgCreate.record, description: 'edited' }, pkgCreate.record.id);
  const siteCreate = R.upsertSite(pkgUpdate.snapshot, { name: 'Audit Site', vlanId: '333', location: 'Lab', concurrent: '10', description: 'audit', allowPackages: [{ packageId: pkgCreate.record.id, prefix: 'AUD', limit: null }] });
  const siteUpdate = R.upsertSite(siteCreate.snapshot, { ...siteCreate.record, name: 'Audit Site 2' }, siteCreate.record.id);
  assert.equal(siteUpdate.record.name, 'Audit Site 2');
  const siteDelete = R.removeSite(siteUpdate.snapshot, siteCreate.record.id); assert.ok(siteDelete.sites.some(row => row.id === 'a'));
  const pkgDelete = R.removePackage(siteDelete, pkgCreate.record.id); assert.ok(pkgDelete.packages.some(row => row.id === 'pkg-0'));

  // Account create/read/update-dispatch workflow; DELETE is intentionally not part of current Account requirements.
  const accounts0 = A.initial(baseData, catalog0.packages, catalog0.sites);
  const acctCreate = A.create(accounts0, { username: 'AUDIT0001', packageId: 'pkg-0', status: 'Active', dispatchSiteId: null }, catalog0.packages, catalog0.sites);
  const created = acctCreate.record; assert.equal(created.status, 'Active');
  const dispatched = A.dispatch(acctCreate.rows, [created.id], 'a', catalog0.packages, catalog0.sites);
  assert.equal(dispatched.find(row => row.id === created.id).dispatchSiteId, 'a');

  // Portal Path full CRUD
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const portal = app(first.name, 'builder');
  const portalId = portal.NT.createPortalPath({ name: 'Audit Portal', path: '/portal/audit', template: 'Custom', siteIds: ['a'] });
  portal.NT.updatePortalPath(portalId, { name: 'Audit Portal 2', path: '/portal/audit-v2', template: 'Template01', siteIds: ['a'] });
  assert.equal(portal.NT.db.configs[portalId].state.name, 'Audit Portal 2');
  portal.NT.deletePortalPath(portalId); assert.equal(portal.NT.db.configs[portalId], undefined);
});

test('V034 destructive catalog deletes have referential guards in the actual RADIUS CRUD UI', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-catalog.js'), 'utf8');
  assert.match(js, /dispatchedAccountCount\(record\.id\)/);
  assert.match(js, /ยกเลิก DISPATCH Account ก่อนลบ Site/);
  assert.match(js, /packageAccountCount\(record\.id\)/);
  assert.match(js, /ยังไม่อนุญาตให้ลบเพื่อป้องกัน Account orphan/);
  assert.match(js, /Portal Path ที่ผูก Site นี้/);
});
