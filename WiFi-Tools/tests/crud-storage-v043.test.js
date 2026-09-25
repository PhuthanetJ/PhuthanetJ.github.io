'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), P = require('../js/portal-bindings.js'), B = require('../js/banner-model.js');
const R = require('../js/radius-catalog-model.js'), A = require('../js/account-model.js'), N = require('../js/nas-model.js');
const baseData = {};
for (const f of fs.readdirSync(path.join(__dirname, '../data'))) if (f.endsWith('.json')) baseData[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));
function app(storage = new Map(), name = '', page = 'login') {
  const data = JSON.parse(JSON.stringify(baseData));
  const nodes = new Map(), node = () => ({ addEventListener() {}, setAttribute() {}, prepend() {}, textContent: '', hidden: false, value: '' });
  const root = { dataset: { page }, querySelector: s => { if (page === 'login') return null; if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); }, querySelectorAll: () => [], hidden: false };
  const localStorage = { getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, value) };
  const c = { NT_DATA: data, WiFiDomain: D, WiFiPortalBindings: P, WiFiBanners: B, WiFiRadiusCatalog: R, WiFiAccountModel: A, WiFiNasModel: N, URL, Date, JSON, console,
    location: { href: 'file:///demo/html/' + page + '.html', replace() {}, reload() {} }, document: { getElementById: () => root, createElement: node }, localStorage, setTimeout };
  c.window = c; c.name = name; c.addEventListener = () => {};
  vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), c); return c;
}

test('V043 Account model supports full CRUD including Package change and preserves telemetry on update', () => {
  const catalog = R.initial(baseData), rows = A.initial(baseData, catalog.packages, catalog.sites);
  const created = A.create(rows, { username: 'V043CRUD1', packageId: catalog.packages[0].id, status: 'Active', dispatchSiteId: null }, catalog.packages, catalog.sites);
  const id = created.record.id;
  const second = catalog.packages[1];
  const updated = A.update(created.rows, id, { username: 'V043CRUD2', packageId: second.id, status: 'Inactive', dispatchSiteId: null }, catalog.packages, catalog.sites);
  assert.equal(updated.record.username, 'V043CRUD2');
  assert.equal(updated.record.packageId, second.id);
  assert.equal(updated.record.status, 'Inactive');
  assert.equal(updated.record.createdAt, created.record.createdAt);
  const removed = A.remove(updated.rows, [id]);
  assert.equal(removed.some(row => row.id === id), false);
});

test('V043 shared storage keeps Site/Package/Account/NAS in one main localStorage draft and excludes NAS Secret from window.name', () => {
  const storage = new Map(), first = app(storage); first.WiFiAuth.login('admin', 'Demo1234!');
  const catalog = R.initial(baseData); first.NT.setRadiusCatalog(catalog);
  const accounts = A.initial(baseData, catalog.packages, catalog.sites); first.NT.setRadiusAccounts(accounts);
  const nas = N.upsert([], { nameHost: '192.0.2.43', shortname: 'v043', type: 'other', ports: '1812', secret: 'SECRET-V043', server: '', community: '', description: '' }).rows;
  first.NT.setRadiusNas(nas);
  const saved = JSON.parse(storage.get('wifi-tools:prototype:v3'));
  assert.equal(saved.schema, 3); assert.equal(saved.radiusCatalog.sites.length, catalog.sites.length); assert.equal(saved.radiusAccounts.length, accounts.length); assert.equal(saved.radiusNas[0].secret, 'SECRET-V043');
  assert.doesNotMatch(first.name, /SECRET-V043/);
  const reloaded = app(storage, '', 'radius');
  assert.equal(reloaded.NT.radiusAccounts().length, accounts.length);
  assert.equal(reloaded.NT.radiusNas()[0].shortname, 'v043');
});

test('V043 Portal Path count may reach zero and ownership migrates when a Site is unassigned', () => {
  const c = app(); c.WiFiAuth.login('admin', 'Demo1234!'); const portal = app(new Map(), c.name, 'builder');
  const id = portal.NT.createPortalPath({ name: 'Shared', path: '/portal/v043-shared', template: 'Custom', siteIds: ['a', 'b'] });
  portal.NT.updatePortalPath(id, { name: 'Shared', path: '/portal/v043-shared', template: 'Custom', siteIds: ['b'] });
  assert.equal(portal.NT.db.configs[id].ownerSiteId, 'b');
  for (const row of [...portal.NT.portalPathChoices()]) portal.NT.deletePortalPath(row.id);
  assert.equal(portal.NT.portalPathChoices().length, 0);
});

test('V043 Site delete UX reports impact and blocks deletion while Portal Path still references the Site', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-catalog.js'), 'utf8');
  assert.match(js, /siteDeleteImpact/); assert.match(js, /Portal Path ที่ผูก Site นี้/); assert.match(js, /Unassign Site จาก Portal Path ก่อนลบ Site/);
  for (const label of ['Notifications', 'Coupons', 'Report Schedules', 'Administrator\/User Site Scope']) assert.match(js, new RegExp(label));
});

test('V043 Portal Preview has no built-in green/blue overlay so uploaded Background stays visible', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/portal-config.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../css/portal-config.css'), 'utf8');
  assert.match(js, /backgroundImage = assets\.background \? 'url\("'/);
  assert.doesNotMatch(js, /linear-gradient\(#dff4f0cc,#b8e7d9cc\)/);
  assert.match(css, /\.nt-phone\{[^}]*background:transparent/);
  assert.match(css, /\.nt-public-hero\{[^}]*background:transparent/);
});

test('V043 Account UI exposes EDIT and DELETE and storage pages use shared APIs instead of independent writes', () => {
  const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
  const account = fs.readFileSync(path.join(__dirname, '../js/pages/radius-account.js'), 'utf8');
  const nas = fs.readFileSync(path.join(__dirname, '../js/pages/radius-nas.js'), 'utf8');
  const catalog = fs.readFileSync(path.join(__dirname, '../js/pages/radius-catalog.js'), 'utf8');
  assert.match(html, /id="radius-account-edit"/); assert.match(html, /id="radius-account-delete"/); assert.match(html, /id="radius-account-edit-dialog"/);
  assert.match(account, /NT\.setRadiusAccounts/); assert.match(nas, /NT\.setRadiusNas/); assert.match(catalog, /NT\.setRadiusCatalog/);
  assert.doesNotMatch(account, /localStorage\.setItem/); assert.doesNotMatch(nas, /localStorage\.setItem/); assert.doesNotMatch(catalog, /localStorage\.setItem/);
});

test('V043 rejected catalog mutation is transactional and leaves the current shared catalog unchanged', () => {
  const storage = new Map(), c = app(storage); c.WiFiAuth.login('admin', 'Demo1234!');
  const catalog = R.initial(baseData); c.NT.setRadiusCatalog(catalog);
  const accounts = A.initial(baseData, catalog.packages, catalog.sites); c.NT.setRadiusAccounts(accounts);
  const before = c.NT.radiusCatalog();
  const referenced = accounts[0].packageId;
  const broken = JSON.parse(JSON.stringify(before));
  broken.packages = broken.packages.filter(row => row.id !== referenced);
  for (const site of broken.sites) site.allowPackages = site.allowPackages.filter(row => row.packageId !== referenced);
  assert.throws(() => c.NT.setRadiusCatalog(broken), /Package/);
  assert.deepEqual(c.NT.radiusCatalog(), before);
});

