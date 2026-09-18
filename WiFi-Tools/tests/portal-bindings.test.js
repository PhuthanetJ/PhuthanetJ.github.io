'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), B = require('../js/portal-bindings.js');
const sites = require('../data/radius-sites.json').sites, packages = require('../data/radius-packages.json').packages;
const context = { owner: 'a', sites, packages, allowed: ['a', 'b', 'c'] };
test('Portal Package names resolve from each Site Allow Package automatically', () => {
    const binding = B.normalize({ siteIds: ['a', 'b', 'c'], packageIds: ['untrusted-id'] }, context);
    assert.equal(binding.packageSource, 'radius-manager-allow-package'); assert.deepEqual(binding.packageIds, ['pkg-0', 'pkg-1', 'pkg-2']);
    const rows = B.coverage(binding, sites, packages); assert.deepEqual(rows.map(r => r.packageIds), [['pkg-0', 'pkg-1'], ['pkg-0', 'pkg-2'], ['pkg-0', 'pkg-2']]);
    assert.ok(rows.every(r => r.loaded && !r.missingPackageIds.length));
});
test('Manual and imported Package selections cannot override Allow Package', () => {
    const binding = B.normalize({ siteIds: ['a'], packageIds: ['pkg-2'], packageSource: 'manual' }, context);
    assert.deepEqual(binding.packageIds, ['pkg-0', 'pkg-1']);
    const withoutB = B.normalize({ siteIds: ['a'] }, context); assert.deepEqual(binding, withoutB);
});
test('Do not infer Allow Package from legacy package service-area fields', () => {
    const emptySites = sites.map(s => ({ ...s, allowPackages: [] }));
    const widePackages = packages.map(p => ({ ...p, siteIds: ['a', 'b', 'c'] }));
    assert.deepEqual(B.normalize({ siteIds: ['a'] }, { ...context, sites: emptySites, packages: widePackages }).packageIds, []);
});
test('Distinguish unavailable, empty and unresolved Allow Package data without inventing names', () => {
    const sample = sites.map(s => ({ ...s })); delete sample[0].allowPackages; sample[1].allowPackages = []; sample[2].allowPackages = [{ packageId: 'missing-package' }];
    const rows = B.coverage({ siteIds: ['a', 'b', 'c'] }, sample, packages);
    assert.equal(rows[0].loaded, false); assert.equal(rows[1].loaded, true); assert.deepEqual(rows[1].packageIds, []);
    assert.deepEqual(rows[2].missingPackageIds, ['missing-package']); assert.deepEqual(rows[2].packageIds, []);
});
test('Read-only names reflect Allow Package even when Package status is not Active', () => {
    const snapshot = packages.map(p => ({ ...p, status: 'Disabled' }));
    assert.deepEqual(B.normalize({ siteIds: ['a'] }, { ...context, packages: snapshot }).packageIds, ['pkg-0', 'pkg-1']);
});
test('Reject unknown or duplicate sites, missing owner and scope expansion', () => {
    for (const binding of [{ siteIds: ['a', 'a'] }, { siteIds: ['b'] }, { siteIds: ['a', 'unknown'] }]) assert.throws(() => B.normalize(binding, context));
    assert.throws(() => B.normalize({ siteIds: ['a', 'b'] }, { ...context, allowed: ['a'] }), /ไม่มีสิทธิ์/);
});
test('Shared portal selection remains limited to allowed sites', () => {
    const configs = { a: { state: { name: 'Shared', path: '/portal/shared' }, bindings: { siteIds: ['a', 'b'] } }, b: { state: { name: 'B', path: '/portal/b' }, bindings: { siteIds: ['b'] } } };
    assert.deepEqual(B.choices(configs, 'b', ['b']).map(p => p.id), ['a', 'b']); assert.deepEqual(B.choices(configs, 'a', ['b']), []);
    assert.equal(B.resolve(configs, 'b', 'a', ['b']), 'a'); assert.equal(B.resolve(configs, 'b', 'unknown', ['b']), 'b');
    assert.equal(B.canManage(configs.a.bindings, ['b']), false); assert.equal(B.canManage(configs.a.bindings, ['a', 'b']), true);
});
