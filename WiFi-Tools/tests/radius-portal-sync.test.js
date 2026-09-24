'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), P = require('../js/portal-bindings.js'), B = require('../js/banner-model.js'), R = require('../js/radius-catalog-model.js');
const baseData = {};
for (const f of fs.readdirSync(path.join(__dirname, '../data'))) if (f.endsWith('.json')) baseData[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));
function run(name = '', page = 'login') {
  const data = JSON.parse(JSON.stringify(baseData));
  const nodes = new Map(), node = () => ({ addEventListener() {}, setAttribute() {}, prepend() {}, textContent: '', hidden: false, value: '' });
  const root = { dataset: { page }, querySelector: s => { if (page === 'login') return null; if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); }, querySelectorAll: () => [], hidden: false };
  const c = { NT_DATA: data, WiFiDomain: D, WiFiPortalBindings: P, WiFiBanners: B, WiFiRadiusCatalog: R, URL, Date, JSON, console, location: { href: 'file:///demo/html/' + page + '.html', replace() {}, reload() {} }, document: { getElementById: () => root, createElement: node }, localStorage: { getItem: () => null, setItem() {} }, setTimeout };
  c.window = c; c.name = name; c.addEventListener = () => {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), c); return c;
}
test('V036 Site added in RADIUS catalog is available to Portal Management but does not auto-create a Portal Path', () => {
  const first = run(); first.WiFiAuth.login('admin', 'Demo1234!');
  const created = R.upsertSite(first.NT.radiusCatalog(), { name: 'Branch New', vlanId: '350', location: 'Bangkok', concurrent: '50', description: 'sync test', allowPackages: [] });
  first.NT.setRadiusCatalog(created.snapshot);
  assert.ok(first.NT.allowedSites().some(s => s.id === created.record.id));
  assert.equal(first.NT.db.configs[created.record.id], undefined, 'new Site must not auto-create a Portal config');
  const portal = run(first.name, 'builder');
  assert.ok(portal.NT.allowedSites().some(s => s.id === created.record.id), 'Portal page must see the Site added from RADIUS & Policy');
  assert.equal(portal.NT.portalPathChoices().some(row => row.siteIds.includes(created.record.id)), false, 'new Site must remain unassigned until Portal Path Management assigns it');
});
