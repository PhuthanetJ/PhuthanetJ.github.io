'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const model = require('../js/account-model.js');
const root = path.join(__dirname, '..');
const packages = JSON.parse(fs.readFileSync(path.join(root, 'data/radius-packages.json'), 'utf8')).packages;
const sites = JSON.parse(fs.readFileSync(path.join(root, 'data/radius-sites.json'), 'utf8')).sites;
const accountData = { 'radius-accounts': JSON.parse(fs.readFileSync(path.join(root, 'data/radius-accounts.json'), 'utf8')) };
function initial() { return model.initial(accountData, packages, sites); }

test('V022 Account model CREATE and GENERATE keep usernames unique and generated accounts undispatched by default', () => {
    const base = initial();
    const created = model.create(base, { username: 'TEST00000001', packageId: 'pkg-0', status: 'Active' }, packages, sites);
    assert.equal(created.record.dispatchSiteId, null);
    assert.equal(created.rows.length, 10);
    assert.throws(() => model.create(created.rows, { username: 'test00000001', packageId: 'pkg-0', status: 'Active' }, packages, sites), /มีอยู่แล้ว/);
    const generated = model.generate(created.rows, { packageId: 'pkg-1', count: 2, status: 'Active' }, packages, sites);
    assert.deepEqual(generated.created.map(row => row.username), ['STF00000004', 'STF00000005']);
    assert.ok(generated.created.every(row => row.dispatchSiteId === null));
});

test('V022 DISPATCH only accepts a Site that contains every selected Account Package and can be cleared', () => {
    const base = initial();
    const free = base.find(row => row.packageId === 'pkg-0');
    const staff = base.find(row => row.packageId === 'pkg-1');
    let rows = model.dispatch(base, [free.id], 'b', packages, sites);
    assert.equal(rows.find(row => row.id === free.id).dispatchSiteId, 'b');
    assert.throws(() => model.dispatch(rows, [staff.id], 'b', packages, sites), /ไม่มี Package/);
    rows = model.dispatch(rows, [free.id], '', packages, sites);
    assert.equal(rows.find(row => row.id === free.id).dispatchSiteId, null);
});

test('V022 IMPORT resolves Package and Site by name or ID and preserves DISPATCH semantics', () => {
    const base = initial();
    const saved = model.importRows(base, [
        { username: 'CSV00000001', package: 'Visitor Daily', status: 'Active', dispatchSite: 'Demo Site B' },
        { username: 'CSV00000002', package: 'pkg-0', status: 'Inactive', dispatchSite: '' }
    ], packages, sites);
    assert.equal(saved.created[0].packageId, 'pkg-2');
    assert.equal(saved.created[0].dispatchSiteId, 'b');
    assert.equal(saved.created[1].packageId, 'pkg-0');
    assert.equal(saved.created[1].dispatchSiteId, null);
    assert.throws(() => model.importRows(base, [{ username: 'BAD1', package: 'Staff Monthly', dispatchSite: 'Demo Site B' }], packages, sites), /ไม่มี Package/);
});

test('V022 Account Draft serialization round trip retains dispatchSiteId', () => {
    const base = initial();
    const free = base.find(row => row.packageId === 'pkg-0');
    const dispatched = model.dispatch(base, [free.id], 'a', packages, sites);
    const raw = model.serialize(dispatched, packages, sites);
    const loaded = model.load(raw, accountData, packages, sites);
    assert.equal(loaded.find(row => row.id === free.id).dispatchSiteId, 'a');
});


test('V023 Account detail telemetry and Sessions survive Draft serialization', () => {
    const base = initial();
    const account = base.find(row => row.id === 'acct-001');
    assert.equal(account.timeUsed, '00:35');
    assert.equal(account.remain, '00:25');
    assert.equal(account.sessions.length, 2);
    assert.equal(account.sessions[0].mac, 'AA:BB:CC:DD:EE:01');
    const loaded = model.load(model.serialize(base, packages, sites), accountData, packages, sites);
    const restored = loaded.find(row => row.id === 'acct-001');
    assert.equal(restored.firstLogin, '2026-09-20T01:15:00.000Z');
    assert.equal(restored.lastLogin, '2026-09-23T03:40:00.000Z');
    assert.equal(restored.sessions[1].lastSeen, '2026-09-21T07:18:00.000Z');
});

test('V023 newly created Account starts without fabricated Login or Session history', () => {
    const saved = model.create(initial(), { username: 'NEWDETAIL001', packageId: 'pkg-0', status: 'Active' }, packages, sites).record;
    assert.equal(saved.firstLogin, '');
    assert.equal(saved.expiredDate, '');
    assert.equal(saved.lastLogin, '');
    assert.equal(saved.timeUsed, '');
    assert.equal(saved.remain, '');
    assert.deepEqual(saved.sessions, []);
});


test('V024 Account Status uses Active/Inactive and migrates legacy Disabled to Inactive', () => {
    const base = initial();
    assert.deepEqual(model.statusValues, ['Active', 'Inactive']);
    const created = model.create(base, { username: 'INACTIVE001', packageId: 'pkg-0', status: 'Inactive' }, packages, sites).record;
    assert.equal(created.status, 'Inactive');
    const legacyData = JSON.parse(JSON.stringify(accountData));
    legacyData['radius-accounts'].accounts[0].status = 'Disabled';
    assert.equal(model.initial(legacyData, packages, sites)[0].status, 'Inactive');
});
