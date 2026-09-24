const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const A = require('../js/account-model.js');
const R = require('../js/radius-catalog-model.js');
const D = require('../js/domain.js');
const P = require('../js/portal-bindings.js');
const B = require('../js/banner-model.js');
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

test('V035 strict Account validation rejects DISPATCH to a Site that no longer allows the Package', () => {
  const catalog = R.initial(baseData);
  const accounts = A.initial(baseData, catalog.packages, catalog.sites);
  const pkg = catalog.packages[0];
  const site = catalog.sites.find(s => A.siteAllows(s, pkg.id));
  assert.ok(site, 'baseline must contain a Site that allows the first Package');
  const created = A.create(accounts, { username: 'V035STRICT1', packageId: pkg.id, status: 'Active', dispatchSiteId: site.id }, catalog.packages, catalog.sites).rows;
  const editedSites = catalog.sites.map(s => s.id === site.id ? { ...s, allowPackages: s.allowPackages.filter(x => x.packageId !== pkg.id) } : s);
  assert.throws(() => A.check(created, catalog.packages, editedSites), /ไม่มี Package/);
  assert.throws(() => A.serialize(created, catalog.packages, editedSites), /ไม่มี Package/);
});

test('V035 legacy stale DISPATCH recovery fails closed: Account becomes Inactive and undispatched', () => {
  const catalog = R.initial(baseData);
  const pkg = catalog.packages[0];
  const site = catalog.sites.find(s => A.siteAllows(s, pkg.id));
  const raw = JSON.stringify({ schemaVersion: 1, accounts: [{ id: 'acct-v035-legacy', username: 'V035LEGACY1', packageId: pkg.id, status: 'Active', dispatchSiteId: site.id, createdAt: new Date(0).toISOString(), sessions: [] }] });
  const editedSites = catalog.sites.map(s => s.id === site.id ? { ...s, allowPackages: s.allowPackages.filter(x => x.packageId !== pkg.id) } : s);
  const loaded = A.load(raw, baseData, catalog.packages, editedSites);
  assert.equal(loaded[0].status, 'Inactive');
  assert.equal(loaded[0].dispatchSiteId, null);
});

test('V036 Portal Path edit may leave a Site unassigned without auto-creating a fallback Path', () => {
  const first = app(); first.WiFiAuth.login('admin', 'Demo1234!');
  const portal = app(first.name, 'builder');
  // Delete Site B default path, then create one shared path A+B so B has exactly one coverage path.
  portal.NT.deletePortalPath('b');
  const shared = portal.NT.createPortalPath({ name: 'Shared V035', path: '/portal/shared-v035', template: 'Custom', siteIds: ['a', 'b'] });
  assert.ok(portal.NT.portalPathChoices().some(row => row.id === shared && row.siteIds.includes('b')));
  portal.NT.updatePortalPath(shared, { name: 'Shared V035', path: '/portal/shared-v035', template: 'Custom', siteIds: ['a'] });
  const coversB = portal.NT.portalPathChoices().filter(row => row.siteIds.includes('b'));
  assert.equal(coversB.length, 0, 'Site B must stay unassigned until a Portal Path is explicitly created or assigned');
});

test('V035 RADIUS Site edit UI contains guard for removing Packages used by dispatched Accounts', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-catalog.js'), 'utf8');
  assert.match(js, /dispatchConflicts\(existing\.id, removedIds\)/);
  assert.match(js, /ยกเลิก DISPATCH ก่อน/);
});

test('V035 Account CSV export protects spreadsheet formula prefixes', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-account.js'), 'utf8');
  assert.match(js, /\^\\s\*\[=\+\\-@\]/);
  assert.match(js, /"'" \+ raw/);
});
