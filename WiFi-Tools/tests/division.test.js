'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rootDir = path.join(__dirname, '..');
const data = Object.fromEntries(fs.readdirSync(path.join(rootDir, 'data')).filter(f => f.endsWith('.json')).map(f => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(rootDir, 'data', f), 'utf8'))]));
function run(previous = '', page = 'login') {
    const nodes = new Map();
    const createNode = () => ({ value: '', innerHTML: '', textContent: '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, setAttribute() {}, prepend() {} });
    const root = { dataset: { page }, querySelector(selector) { if (page === 'login') return null; if (!nodes.has(selector)) nodes.set(selector, createNode()); return nodes.get(selector); }, querySelectorAll: () => [] };
    const ctx = {
        NT_DATA: data, WiFiDomain: require('../js/domain.js'), WiFiPortalBindings: require('../js/portal-bindings.js'), WiFiBanners: require('../js/banner-model.js'),
        URL, Date, JSON, console, document: { getElementById: () => root, createElement: createNode },
        location: { href: 'file:///demo/html/' + page + '.html', replace() {}, reload() {} },
        localStorage: { getItem: () => null, setItem() {} }, setTimeout
    };
    ctx.window = ctx; ctx.name = previous; ctx.addEventListener = () => {};
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8'), ctx);
    return { ctx, nodes };
}
const labels = ['ALL', 'กรุงเทพและปริมณฑล', 'ภาคกลาง', 'ภาคตะวันออก', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคใต้'];

test('Every page header uses ส่วนงาน and a dedicated selector, including Settings', () => {
    const pages = fs.readdirSync(path.join(rootDir, 'html')).filter(f => f.endsWith('.html') && f !== 'login.html' && f !== 'report-print.html');
    assert.equal(pages.length, 14);
    for (const page of pages) {
        const html = fs.readFileSync(path.join(rootDir, 'html', page), 'utf8');
        assert.match(html, /<label>ส่วนงาน <select id="wt-current-division"/);
        assert.doesNotMatch(html, /id="wt-current-site"|Site ที่ตั้งค่า/);
    }
});

test('Default ALL and six divisions render in the requested order', () => {
    const a = run(); a.ctx.WiFiAuth.login('admin', 'Demo1234!');
    const b = run(a.ctx.name, 'dashboard');
    const select = b.nodes.get('#wt-current-division');
    assert.equal(select.value, 'all');
    assert.equal(b.ctx.NT.db.currentDivision, 'all');
    const options = [...select.innerHTML.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
    assert.deepEqual(options.map(m => m[2]), labels);
    assert.equal(new Set(options.map(m => m[1])).size, 7);
});

test('Choosing a division persists across menus without altering Site context or permissions', () => {
    const a = run(); a.ctx.WiFiAuth.login('siteadmin', 'Demo1234!');
    const b = run(a.ctx.name, 'dashboard');
    const selector = b.nodes.get('#wt-current-division');
    const originalSite = b.ctx.NT.currentSite;
    selector.value = 'northeast'; selector.listeners.change({ target: selector });
    assert.equal(b.ctx.NT.currentDivision(), 'northeast');
    assert.equal(b.ctx.NT.db.currentSite, originalSite);
    assert.deepEqual(Array.from(b.ctx.NT.allowedIds()), ['a']);
    const c = run(b.ctx.name, 'reports');
    assert.equal(c.nodes.get('#wt-current-division').value, 'northeast');
    c.ctx.NT.selectDivision('invalid');
    assert.equal(c.ctx.NT.currentDivision(), 'northeast');
});

test('Previous V010 draft without division migrates to ALL without losing existing Site and Config', () => {
    const a = run(); a.ctx.WiFiAuth.login('admin', 'Demo1234!');
    delete a.ctx.WiFiStore.get().currentDivision;
    a.ctx.WiFiStore.get().configs.a.state.name = 'Preserve original draft';
    a.ctx.WiFiStore.save();
    const b = run(a.ctx.name, 'dashboard');
    assert.equal(b.ctx.NT.currentDivision(), 'all');
    assert.equal(b.ctx.NT.currentSite, 'a');
    assert.equal(b.ctx.NT.state.name, 'Preserve original draft');
});
