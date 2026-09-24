'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const model = require('../js/radius-catalog-model.js');
const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-catalog.js'), 'utf8');
const baseline = { 'radius-sites': require('../data/radius-sites.json'), 'radius-packages': require('../data/radius-packages.json') };
function original() { return model.initial(baseline); }
const newSite = { name: 'New Office', vlanId: '300', location: 'Demo', concurrent: '25', description: 'New site', allowPackages: [] };
const newPackage = { ...original().packages[0], policyName: 'New Policy', userPrefix: 'NEW', packageType: 'Prepaid', expiration: 'Specified Date', expirationDate: '2026-12-31' };
test('Site and Package CRUD controls exist in the V014 HTML, including responsive forms', () => {
    for (const id of ['radius-site-add', 'radius-site-dialog', 'radius-site-form', 'radius-site-package-choices', 'radius-site-error', 'radius-package-add', 'radius-package-edit', 'radius-package-delete', 'radius-package-dialog', 'radius-package-form', 'radius-package-error']) assert.match(html, new RegExp('id="' + id + '"'));
    for (const key of model.packageFields) assert.match(html, new RegExp('name="' + key + '"'));
    for (const attr of ['Name', 'VLAN ID', 'Location', 'Concurrent', 'Description', 'Allow Package']) assert.match(html, new RegExp(attr));
    assert.match(js, /NT\.can\('system'\)/); assert.match(js, /localStorage\.setItem/);
});
test('Site CRUD add, rename, change Allow Package, remove and preserve initial data', () => {
    const base = original(), copy = model.upsertSite(base, { ...newSite, allowPackages: [{ packageId: 'pkg-1', prefix: 'STF', limit: null }] });
    assert.equal(copy.snapshot.sites.length, 4); assert.equal(copy.record.vlanId, 300);
    const edited = model.upsertSite(copy.snapshot, { ...newSite, name: 'Rebranded', vlanId: '', allowPackages: [] }, copy.record.id);
    assert.equal(edited.snapshot.sites[3].name, 'Rebranded'); assert.equal(edited.record.vlanId, null);
    assert.equal(edited.record.allowPackages.length, 0); assert.equal(copy.snapshot.sites[3].name, 'New Office');
    const removed = model.removeSite(edited.snapshot, edited.record.id);
    assert.equal(removed.sites.length, 3); assert.equal(base.sites.length, 3);
});
test('Reject duplicate names and invalid Site numbers/Allow Package relationships', () => {
    const base = original();
    assert.throws(() => model.upsertSite(base, { ...newSite, name: 'demo site a' }), /ซ้ำ/);
    for (const vlanId of ['-1', '4095', 'a', '1.5']) assert.throws(() => model.upsertSite(base, { ...newSite, vlanId }), /VLAN/);
    assert.throws(() => model.upsertSite(base, { ...newSite, concurrent: '-1' }), /Concurrent/);
    assert.throws(() => model.upsertSite(base, { ...newSite, allowPackages: [{ packageId: 'missing', prefix: '', limit: null }] }), /Package/);
    assert.throws(() => model.upsertSite(base, { ...newSite, allowPackages: [{ packageId: 'pkg-0', prefix: 'FREE', limit: null }, { packageId: 'pkg-0', prefix: 'FREE', limit: null }] }), /Allow Package/);
});
test('Package CRUD add, edit, duplicate rejection and delete cascades only within offline snapshot', () => {
    const base = original(), created = model.upsertPackage(base, newPackage);
    assert.equal(created.snapshot.packages.length, 4);
    const edited = model.upsertPackage(created.snapshot, { ...newPackage, policyName: 'Updated Policy', download: '50 Mbps' }, created.record.id);
    assert.equal(edited.record.download, '50 Mbps'); assert.equal(created.snapshot.packages[3].policyName, 'New Policy');
    assert.throws(() => model.upsertPackage(base, { ...newPackage, policyName: 'Staff Monthly' }), /ซ้ำ/);
    assert.throws(() => model.upsertPackage(base, { ...newPackage, policyName: '' }), /ชื่อ/);
    const removed = model.removePackage(base, 'pkg-0');
    assert.equal(removed.packages.length, 2);
    assert.ok(removed.sites.every(s => !s.allowPackages.some(x => x.packageId === 'pkg-0')));
    assert.ok(base.sites.every(s => s.allowPackages.some(x => x.packageId === 'pkg-0')));
});
test('Validate saved Draft, reject tampering and preserve empty intentional deletions', () => {
    const base = original(); assert.deepEqual(model.load(model.serialize(base), baseline), base);
    assert.deepEqual(model.load(null, baseline), base);
    assert.throws(() => model.serialize({ sites: [], packages: [] }), /ไม่มี Site/);
    assert.throws(() => model.load('{broken', baseline), /JSON/);
    assert.throws(() => model.load('{"schemaVersion":9,"sites":[],"packages":[]}', baseline), /Version/);
    assert.throws(() => model.check({ sites: [base.sites[0], base.sites[0]], packages: base.packages }), /ID/);
    assert.throws(() => model.check({ sites: base.sites, packages: base.packages.slice(1) }), /Package/);
});

test('V019: Package table includes Account count plus requested package fields', () => {
    for (const label of ['Status', 'Name', 'Prefix Accounts', 'Accounts', 'Created Date']) assert.match(html, new RegExp('<th[^>]*>' + label + '</th>'));
    assert.match(html, /id="radius-package-rows"/);
    assert.match(html, /name="packageType"[^>]*>/);
    assert.match(html, /<option value="Prepaid">Prepaid<\/option>/);
    assert.match(html, /<option value="Postpaid">Postpaid<\/option>/);
    for (const value of ['1st Login', 'Specified Date', 'Unlimited']) assert.ok(html.includes('<option value="' + value + '">'));
    assert.match(html, /id="radius-package-expiration-date" type="date"/);
    assert.match(js, /function updateExpiration\(initial = false\)/);
    assert.match(js, /input\.disabled = !specified/);
});
test('V015: create timestamp is assigned on add, retained on edit and round-trip serialization', () => {
    const base = original(), created = model.upsertPackage(base, newPackage);
    assert.match(created.record.createdAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(created.record.packageType, 'Prepaid');
    assert.equal(created.record.expiration, 'Specified Date');
    assert.equal(created.record.expirationDate, '2026-12-31');
    const edited = model.upsertPackage(created.snapshot, { ...created.record, packageType: 'Postpaid', expiration: 'Unlimited' }, created.record.id);
    assert.equal(edited.record.createdAt, created.record.createdAt);
    assert.equal(edited.record.expirationDate, '');
    assert.deepEqual(model.load(model.serialize(edited.snapshot), baseline), edited.snapshot);
    assert.equal(base.packages[0].createdAt, '');
});
test('V015: validate selects, reject missing or impossible specified dates, clear dates for other modes', () => {
    const base = original();
    for (const packageType of ['', 'Time quota (ตัวอย่าง)', 'Other']) {
        assert.throws(() => model.upsertPackage(base, { ...newPackage, packageType }), /Package Type/);
    }
    for (const expiration of ['', 'Other', '2026-12-31 (ตัวอย่าง)']) {
        assert.throws(() => model.upsertPackage(base, { ...newPackage, expiration }), /Expiration/);
    }
    for (const expirationDate of ['', '2026-02-30', '31-12-2026', '2026-13-01', '2026-12-31<script>']) {
        assert.throws(() => model.upsertPackage(base, { ...newPackage, expirationDate }), /Expiration Date/);
    }
    assert.equal(model.upsertPackage(base, { ...newPackage, expiration: '1st Login', expirationDays: '30' }).record.expirationDate, '');
    assert.equal(model.upsertPackage(base, { ...newPackage, expiration: 'Unlimited' }).record.expirationDate, '');
});
test('V015: old V014 draft with free text fields loads without fabricating Created Date or changing old values', () => {
    const old = require('../data/radius-packages.json');
    const v014 = JSON.stringify({ schemaVersion: 1, sites: baseline['radius-sites'].sites, packages: old.packages });
    const recovered = model.load(v014, baseline);
    assert.equal(recovered.packages[0].packageType, 'Time quota (ตัวอย่าง)');
    assert.equal(recovered.packages[0].expiration, '2026-12-31 (ตัวอย่าง)');
    assert.equal(recovered.packages[0].createdAt, '');
    assert.equal(recovered.packages[0].expirationDate, '');
    assert.equal(model.load(model.serialize(recovered), baseline).packages[0].createdAt, '');
    const editOld = model.upsertPackage(recovered, { ...recovered.packages[0], packageType: 'Prepaid', expiration: 'Unlimited' }, recovered.packages[0].id);
    assert.equal(editOld.record.createdAt, '', 'editing legacy Package must not fabricate historical creation date');
});


test('V016: 1st Login shows a conditional Days field and renders Days in Package details', () => {
    assert.match(html, /id="radius-package-expiration-days-field" hidden/);
    assert.match(html, /name="expirationDays" id="radius-package-expiration-days" type="number" min="1" max="36500" step="1"/);
    assert.match(js, /daysField\.hidden = !firstLogin/);
    assert.match(js, /daysInput\.disabled = !firstLogin/);
    assert.match(js, /daysInput\.required = firstLogin/);
    assert.match(js, /daysInput\.value = '30'/);
    assert.match(js, /updateExpiration\(true\)/);
    assert.match(js, /if \(value\.expiration !== '1st Login'\) value\.expirationDays = ''/);
    const detailJs = fs.readFileSync(path.join(__dirname, '../js/pages/radius-policy.js'), 'utf8');
    assert.match(detailJs, /\['expirationDays', 'Days \(from 1st Login\)'\]/);
});
test('V016: first login Days must be positive integer; saved value survives edit and reload', () => {
    const base = original();
    for (const expirationDays of ['', '0', '-1', '1.5', 'abc', '36501', '9999999999999999999999999', '1<script>']) {
        assert.throws(() => model.upsertPackage(base, { ...newPackage, expiration: '1st Login', expirationDays }), /Days/);
    }
    const created = model.upsertPackage(base, { ...newPackage, expiration: '1st Login', expirationDays: '30', expirationDate: '' });
    assert.equal(created.record.expiration, '1st Login');
    assert.equal(created.record.expirationDays, '30');
    assert.equal(created.record.expirationDate, '');
    assert.equal(model.load(model.serialize(created.snapshot), baseline).packages.at(-1).expirationDays, '30');
    const edited = model.upsertPackage(created.snapshot, { ...created.record, expirationDays: '45' }, created.record.id);
    assert.equal(edited.record.expirationDays, '45');
    assert.equal(edited.record.createdAt, created.record.createdAt);
    const unlimited = model.upsertPackage(edited.snapshot, { ...edited.record, expiration: 'Unlimited' }, edited.record.id);
    assert.equal(unlimited.record.expirationDays, '');
    assert.equal(unlimited.record.expirationDate, '');
    const specified = model.upsertPackage(created.snapshot, { ...created.record, expiration: 'Specified Date', expirationDate: '2027-01-01' }, created.record.id);
    assert.equal(specified.record.expirationDays, '');
    assert.equal(specified.record.expirationDate, '2027-01-01');
});
test('V016: reads V015 first-login Draft with missing Days without inventing 30, requests explicit edit', () => {
    const v015 = original();
    v015.packages[0].packageType = 'Prepaid';
    v015.packages[0].expiration = '1st Login';
    delete v015.packages[0].expirationDays;
    const migrated = model.load(JSON.stringify({ schemaVersion: 1, ...v015 }), baseline);
    assert.equal(migrated.packages[0].expirationDays, '');
    assert.equal(model.load(model.serialize(migrated), baseline).packages[0].expirationDays, '');
    assert.throws(() => model.upsertPackage(migrated, migrated.packages[0], migrated.packages[0].id), /Days/);
    const updated = model.upsertPackage(migrated, { ...migrated.packages[0], expirationDays: '7' }, migrated.packages[0].id);
    assert.equal(updated.record.expirationDays, '7');
    assert.throws(() => model.check({ ...updated.snapshot, packages: [{ ...updated.record, expirationDays: 'abc' }, ...migrated.packages.slice(1)] }), /Days/);
});


test('V026: zero or blank Package limit values are treated as Unlimited', () => {
    for (const value of ['', '   ', '0', '00', '0.0', '00:00', '0:00', '00:00:00', '0 Mbps', '0 kbps']) {
        assert.equal(model.isUnlimitedValue(value), true, `expected ${JSON.stringify(value)} to be Unlimited`);
    }
    for (const value of ['1', '00:01', '1 Mbps', '0.1', '10 Mbps']) {
        assert.equal(model.isUnlimitedValue(value), false, `expected ${JSON.stringify(value)} to be limited`);
    }
    assert.deepEqual(model.unlimitedFields, ['upload', 'download', 'sessionTime', 'sessionLimit', 'idleTimeout', 'time', 'dailyTime', 'weeklyTime', 'monthlyTime']);
});

test('V026: Package form documents Unlimited semantics for all nine limit fields', () => {
    for (const field of model.unlimitedFields) {
        assert.match(html, new RegExp('name="' + field + '"[^>]*placeholder="[^"]*Unlimited'));
    }
    assert.match(html, /id="radius-package-unlimited-help"/);
    assert.match(html, /Upload, Download, Session Time, Session Limit, Idle Timeout, Time, Daily time, Weekly time และ Monthly time/);
    const detailJs = fs.readFileSync(path.join(__dirname, '../js/pages/radius-policy.js'), 'utf8');
    assert.match(detailJs, /displayPackageValue/);
    assert.match(detailJs, /'session-time': pkg \? displayPackageValue\('sessionTime', pkg\.sessionTime\)/);
});
