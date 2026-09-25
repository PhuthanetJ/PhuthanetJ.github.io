'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), data = {};
for (const f of fs.readdirSync(path.join(__dirname, '../data'))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));
function app(name = '', page = 'login') {
    const nodes = new Map(), node = () => ({ addEventListener() { }, setAttribute() { }, prepend() { } });
    const root = { dataset: { page }, querySelector: s => { if (page === 'login') return null; if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); }, querySelectorAll: () => [] };
    const c = { NT_DATA: data, WiFiDomain: D, WiFiPortalBindings: require('../js/portal-bindings.js'), WiFiBanners: require('../js/banner-model.js'), URL, Date, JSON, console, location: { href: 'file:///demo/html/' + page + '.html', replace() { }, reload() { } }, document: { getElementById: () => root, createElement: node }, localStorage: { getItem: () => null, setItem() { } }, setTimeout };
    c.window = c; c.name = name; c.addEventListener = () => { };
    vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), c); return c;
}
test('V030 Portal Configuration starts from a Portal Path management table', () => {
    const html = fs.readFileSync(path.join(__dirname, '../html/portal-config.html'), 'utf8');
    assert.match(html, /id="wt-portal-path-management"/);
    assert.match(html, /<th>Name<\/th><th>Path<\/th><th>Template<\/th><th class="wt-center">Sites<\/th><th>Action<\/th>/);
    assert.match(html, /id="nt-view-builder" class="nt-view" hidden/);
    assert.match(html, /Add Portal Path/);
});
test('V030 can create and edit a Portal Path with multiple Sites', () => {
    const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const c = app(first.name, 'builder');
    const id = c.NT.createPortalPath({ name: 'Guest Portal', path: '/portal/guest', template: 'Custom', siteIds: ['a', 'b'] });
    assert.equal(id, 'portal-1'); assert.equal(c.NT.db.configs[id].ownerSiteId, 'a');
    let row = Array.from(c.NT.portalPathChoices()).find(x => x.id === id);
    assert.deepEqual({ name: row.name, path: row.path, template: row.template, siteCount: row.siteCount }, { name: 'Guest Portal', path: '/portal/guest', template: 'Custom', siteCount: 2 });
    c.NT.updatePortalPath(id, { name: 'Guest Portal 2', path: '/portal/guest-v2', template: 'Template03', siteIds: ['a', 'c'] });
    row = Array.from(c.NT.portalPathChoices()).find(x => x.id === id);
    assert.equal(row.name, 'Guest Portal 2'); assert.equal(row.path, '/portal/guest-v2'); assert.equal(row.template, 'Template03'); assert.equal(row.siteCount, 2);
});
test('V043 rejects duplicate Paths and migrates Portal Path ownership when the previous owner is unassigned', () => {
    const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const c = app(first.name, 'builder');
    const id = c.NT.createPortalPath({ name: 'Guest', path: '/portal/guest', template: 'Custom', siteIds: ['a', 'b'] });
    assert.throws(() => c.NT.createPortalPath({ name: 'Duplicate', path: '/portal/guest', template: 'Template01', siteIds: ['a'] }), /มีอยู่แล้ว/);
    c.NT.updatePortalPath(id, { name: 'Guest', path: '/portal/new', template: 'Custom', siteIds: ['b'] });
    assert.equal(c.NT.db.configs[id].ownerSiteId, 'b');
    assert.deepEqual(Array.from(c.NT.db.configs[id].bindings.siteIds), ['b']);
});
test('V030 deletes a Portal Path Draft and clears it from the management list', () => {
    const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const c = app(first.name, 'builder');
    const id = c.NT.createPortalPath({ name: 'Temporary', path: '/portal/temp', template: 'Template01', siteIds: ['a'] });
    c.NT.deletePortalPath(id);
    assert.equal(c.NT.db.configs[id], undefined); assert.equal(Array.from(c.NT.portalPathChoices()).some(x => x.id === id), false);
});

test('V032 list page shows Portal Path Management only; Configure mode owns Portal Configuration title', () => {
    const html = fs.readFileSync(path.join(__dirname, '../html/portal-config.html'), 'utf8');
    const script = fs.readFileSync(path.join(__dirname, '../js/pages/portal-paths.js'), 'utf8');
    assert.match(html, /id="wt-portal-page-title">Portal Path Management<\/h2>/);
    assert.doesNotMatch(html, /<h3>Portal Path Management<\/h3>/);
    assert.match(script, /pageTitle\.textContent = 'Portal Configuration'/);
    assert.match(script, /pageTitle\.textContent = 'Portal Path Management'/);
    assert.match(script, /draftStatus\.hidden = true/);
});
