'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const model = require('../js/nas-model.js');
const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-nas.js'), 'utf8');
const sample = overrides => ({ nameHost: '192.0.2.5', shortname: 'Demo-NAS', type: 'other', ports: '1812,1813', secret: 'demo-secret-ONLY', server: 'virtual-server', community: 'demo-community', description: 'Test only', ...overrides });
test('NAS tab and table have the requested four fields and management column', () => {
    assert.match(html, /id="radius-tab-nas"[\s\S]*?NAS<\/button>/);
    assert.match(html, /<section id="radius-panel-nas" role="tabpanel" aria-labelledby="radius-tab-nas">/);
    for (const label of ['Name/Host', 'Shortname', 'Secret', 'Server']) assert.match(html, new RegExp('<th>' + label.replace('/', '\\/') + '</th>'));
    for (const field of model.fields) assert.match(html, new RegExp('name="' + field + '"'));
    assert.match(html, /id="radius-nas-secret"[^>]*type="password"/);
});
test('NAS CRUD inserts, edits retaining secret, rotates secret and deletes without changing previous snapshots', () => {
    const first = model.upsert([], sample());
    assert.equal(first.rows.length, 1); assert.equal(first.record.secret, 'demo-secret-ONLY');
    const changed = model.upsert(first.rows, sample({ server: 'new-server', secret: '' }), first.record.id);
    assert.equal(changed.rows[0].secret, 'demo-secret-ONLY'); assert.equal(changed.rows[0].server, 'new-server');
    assert.equal(first.rows[0].server, 'virtual-server');
    const rotated = model.upsert(changed.rows, sample({ secret: 'NEW-secret-only' }), first.record.id);
    assert.equal(rotated.rows[0].secret, 'NEW-secret-only');
    assert.equal(model.remove(rotated.rows, first.record.id).length, 0);
});
test('Duplicate Name/Host or Shortname and malformed fields are rejected', () => {
    const rows = model.upsert([], sample()).rows;
    assert.throws(() => model.upsert(rows, sample({ shortname: 'other' })), /Name\/Host.*มีอยู่แล้ว/);
    assert.throws(() => model.upsert(rows, sample({ nameHost: '192.0.2.6' })), /Shortname.*มีอยู่แล้ว/);
    assert.throws(() => model.upsert([], sample({ nameHost: 'bad hostname' })), /Name\/Host/);
    assert.throws(() => model.upsert([], sample({ secret: '' })), /Secret/);
    assert.throws(() => model.upsert([], sample({ ports: '99999' })), /Ports/);
    assert.throws(() => model.upsert([], sample({ ports: '1812;1813' })), /Ports/);
    assert.throws(() => model.upsert([], sample({ description: 'a'.repeat(2001) })), /description/);
});
test('NAS draft serializes, loads safely, rejects malformed and duplicate records', () => {
    const rows = model.upsert([], sample()).rows;
    assert.deepEqual(model.load(model.serialize(rows)), rows);
    assert.deepEqual(model.load(null), []);
    assert.throws(() => model.load('{broken'), /JSON/);
    assert.throws(() => model.load('{"schemaVersion":9,"nas":[]}'), /รูปแบบ/);
    assert.throws(() => model.load(model.serialize([rows[0], rows[0]])), /ID/);
});
function ui(admin = true) {
    const nodes = new Map();
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
        const listeners = {};
        nodes.set('#' + id, {
            value: '', innerHTML: '', textContent: '', hidden: false, disabled: false, open: false, required: false, focused: false,
            addEventListener(event, fn) { (listeners[event] ||= []).push(fn); },
            emit(event, data = {}) { for (const fn of listeners[event] || []) fn({ preventDefault() {}, ...data }); },
            reset() { for (const [key, input] of nodes) if (key.startsWith('#radius-nas-') && 'value' in input) input.value = ''; },
            showModal() { this.open = true; }, close() { this.open = false; this.emit('close'); },
            focus() { this.focused = true; }
        });
    }
    let stored = null;
    const storage = { getItem() { return null; }, setItem() {} };
    const q = key => { assert.ok(nodes.has(key), key + ' exists in actual HTML'); return nodes.get(key); };
    const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const NT = {
        q, esc, can: permission => permission === 'system' && admin, toast() {},
        legacyStorageKeys: { radiusNasKey: 'legacy' },
        radiusNas: () => stored ? JSON.parse(stored).nas : null,
        setRadiusNas(rows) { stored = model.serialize(rows); return model.load(stored); }
    };
    const context = { NT, WiFiNasModel: model, localStorage: storage, location: { href: 'file:///wifi/html/radius-policy.html' }, URL, confirm: () => true };
    context.window = context;
    vm.runInNewContext(js, context);
    const fill = record => { for (const [key, id] of Object.entries({ nameHost: '#radius-nas-name-host', shortname: '#radius-nas-shortname', type: '#radius-nas-type', ports: '#radius-nas-ports', secret: '#radius-nas-secret', server: '#radius-nas-server', community: '#radius-nas-community', description: '#radius-nas-description' })) q(id).value = record[key]; };
    const target = (attr, id) => ({ closest: selector => selector === '[' + attr + ']' ? { dataset: { [attr === 'data-nas-edit' ? 'nasEdit' : 'nasDelete']: id }, focus() {} } : null });
    return { q, fill, target, storage: () => stored };
}
test('Offline NAS UI adds, edits and deletes, never renders the raw Secret in the table', () => {
    const p = ui();
    p.q('#radius-nas-add').emit('click', { currentTarget: { focus() {} } });
    assert.equal(p.q('#radius-nas-dialog').open, true);
    p.fill(sample()); p.q('#radius-nas-form').emit('submit');
    assert.equal(p.q('#radius-nas-dialog').open, false);
    assert.match(p.q('#radius-nas-rows').innerHTML, /Demo-NAS/);
    assert.match(p.q('#radius-nas-rows').innerHTML, /••••••••/);
    assert.doesNotMatch(p.q('#radius-nas-rows').innerHTML, /demo-secret-ONLY/);
    const id = JSON.parse(p.storage()).nas[0].id;
    p.q('#radius-nas-rows').emit('click', { target: p.target('data-nas-edit', id) });
    p.q('#radius-nas-server').value = 'edited-server';
    p.q('#radius-nas-form').emit('submit');
    assert.equal(JSON.parse(p.storage()).nas[0].secret, 'demo-secret-ONLY');
    assert.match(p.q('#radius-nas-rows').innerHTML, /edited-server/);
    p.q('#radius-nas-rows').emit('click', { target: p.target('data-nas-delete', id) });
    assert.equal(JSON.parse(p.storage()).nas.length, 0);
});
test('NAS UI for non-admin does not read local draft or expose add/edit/delete actions', () => {
    const p = ui(false);
    assert.equal(p.q('#radius-nas-add').hidden, true);
    assert.match(p.q('#radius-nas-rows').innerHTML, /ไม่มีสิทธิ์/);
    assert.equal(p.storage(), null);
});
