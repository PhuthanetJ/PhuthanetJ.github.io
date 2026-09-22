'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/pages/radius-policy.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
function page(allowed = ['a', 'b', 'c'], mutate = () => { }, search = '') {
    const data = {}; for (const name of ['radius-sites', 'radius-packages']) data[name] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', name + '.json'), 'utf8'));
    mutate(data);
    const nodes = new Map();
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
        const listeners = {};
        nodes.set('#' + id, {
            value: '', innerHTML: '', textContent: '', hidden: ['radius-panel-packages', 'radius-panel-sites'].includes(id), open: false, focused: false,
            classList: { toggle() { } }, setAttribute() { }, scrollIntoView() { }, focus() { this.focused = true; },
            addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
            emit(type, event = {}) { for (const fn of listeners[type] || []) fn(event); },
            showModal() { assert.equal(this.open, false); this.open = true; },
            close() { this.open = false; this.emit('close'); }
        });
    }
    const q = s => { assert.ok(nodes.has(s), 'Selector exists in real HTML: ' + s); return nodes.get(s); };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const c = { NT: { q, esc, allowedIds: () => allowed, can: () => allowed.length === 3, currentSite: allowed[0] }, NT_DATA: data, URLSearchParams, location: { search } };
    c.window = c; vm.runInNewContext(source, c);
    function click(container, attr, id) { const button = { dataset: { [attr]: id }, focused: false, focus() { this.focused = true; } }; q(container).emit('click', { target: { closest: () => button } }); return button; }
    return { q, click };
}
test('Allow Package opens visibly for the default Site and can reopen after closing', () => {
    const { q, click } = page(); q('#radius-tab-sites').emit('click'); const button = click('#radius-site-rows', 'radiusSite', 'a');
    assert.equal(q('#radius-allow-panel').open, true);
    assert.match(q('#radius-allow-title').textContent, /Demo Site A/);
    assert.match(q('#radius-allow-rows').innerHTML, /Free WiFi 1 Hour/);
    assert.match(q('#radius-allow-rows').innerHTML, /Staff Monthly/);
    assert.doesNotMatch(q('#radius-allow-rows').innerHTML, /Visitor Daily/);
    q('#radius-allow-close').emit('click'); assert.equal(q('#radius-allow-panel').open, false); assert.equal(button.focused, true);
    click('#radius-site-rows', 'radiusSite', 'a'); assert.equal(q('#radius-allow-panel').open, true);
});
test('Every Site button shows its own allow list, not the previous Site', () => {
    const { q, click } = page();
    for (const id of ['a', 'b', 'c']) {
        click('#radius-site-rows', 'radiusSite', id);
        assert.match(q('#radius-allow-title').textContent, new RegExp('Demo Site ' + id.toUpperCase()));
        assert.match(q('#radius-allow-rows').innerHTML, id === 'a' ? /Staff Monthly/ : /Visitor Daily/);
        assert.doesNotMatch(q('#radius-allow-rows').innerHTML, id === 'a' ? /Visitor Daily/ : /Staff Monthly/);
        q('#radius-allow-panel').close();
    }
});
test('Package link closes dialog, switches tab and focuses read-only detail selector', () => {
    const { q, click } = page(); click('#radius-site-rows', 'radiusSite', 'b'); click('#radius-allow-rows', 'radiusPackage', 'pkg-2');
    assert.equal(q('#radius-allow-panel').open, false); assert.equal(q('#radius-panel-packages').hidden, false);
    assert.equal(q('#radius-panel-sites').hidden, true); assert.equal(q('#radius-package').value, 'pkg-2');
    assert.equal(q('#radius-package').focused, true); assert.match(q('#radius-fields').innerHTML, /Visitor Daily/);
});
test('Restricted user cannot open other Sites or unrelated Package details', () => {
    const { q, click } = page(['a']); assert.doesNotMatch(q('#radius-site-rows').innerHTML, /Demo Site B/);
    click('#radius-site-rows', 'radiusSite', 'b'); assert.equal(q('#radius-allow-panel').open, false);
    click('#radius-site-rows', 'radiusSite', 'a'); click('#radius-allow-rows', 'radiusPackage', 'pkg-2');
    assert.equal(q('#radius-allow-panel').open, true); assert.equal(q('#radius-panel-packages').hidden, true);
});
test('Empty, missing and unresolved allow lists show an explicit message', () => {
    for (const [value, message] of [[[], /ยังไม่มี Allow Package/], [undefined, /ยังไม่มีข้อมูล Allow Package/], [[{ packageId: 'missing' }], /ไม่พบชื่อ Package/]]) {
        const { q, click } = page(['a'], data => data['radius-sites'].sites[0].allowPackages = value);
        click('#radius-site-rows', 'radiusSite', 'a'); assert.equal(q('#radius-allow-panel').open, true); assert.match(q('#radius-allow-rows').innerHTML, message);
    }
});


test('V017: tabs render NAS, Package, Site in that order and NAS is the default', () => {
    const tablist = html.match(/<div class="nt-tabs"[^>]*>([\s\S]*?)<\/div>/)[1];
    assert.deepEqual([...tablist.matchAll(/id="radius-tab-(nas|packages|sites)"/g)].map(match => match[1]), ['nas', 'packages', 'sites']);
    assert.match(tablist, /class="nt-tab active" role="tab" id="radius-tab-nas"[\s\S]*?aria-selected="true"/);
    const { q } = page();
    assert.equal(q('#radius-panel-nas').hidden, false);
    assert.equal(q('#radius-panel-packages').hidden, true);
    assert.equal(q('#radius-panel-sites').hidden, true);
    q('#radius-tab-packages').emit('click');
    assert.equal(q('#radius-panel-packages').hidden, false);
    assert.equal(q('#radius-panel-nas').hidden, true);
    q('#radius-tab-sites').emit('click');
    assert.equal(q('#radius-panel-sites').hidden, false);
    assert.equal(q('#radius-panel-packages').hidden, true);
    q('#radius-tab-nas').emit('click');
    assert.equal(q('#radius-panel-nas').hidden, false);
    assert.equal(q('#radius-panel-sites').hidden, true);
});

test('V017: package deep link still switches to Package rather than the default NAS', () => {
    const { q } = page(['a', 'b', 'c'], () => {}, '?package=pkg-2');
    assert.equal(q('#radius-panel-packages').hidden, false);
    assert.equal(q('#radius-panel-nas').hidden, true);
    assert.equal(q('#radius-panel-sites').hidden, true);
    assert.equal(q('#radius-package').value, 'pkg-2');
});
