(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.WiFiPortalBindings = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const packageSource = 'radius-manager-allow-package';
    function defaults(owner, sites, packages) { return normalize({ siteIds: [owner] }, { owner, sites, packages }); }
    function list(value, label, known) {
        if (!Array.isArray(value) || value.length > known.length || value.some(id => typeof id !== 'string' || !known.includes(id)) || new Set(value).size !== value.length) throw Error('รายการ ' + label + ' ไม่ถูกต้อง หรือมีรายการซ้ำ');
        return value.slice();
    }
    function normalize(value, { owner, sites, packages, allowed }) {
        if (!value || typeof value !== 'object') throw Error('ไม่พบการผูก Site / Package ของ Portal');
        const siteIds = list(value.siteIds, 'Site', sites.map(s => s.id));
        if (!siteIds.length || !siteIds.includes(owner)) throw Error('ต้องมี Site เจ้าของ Config อยู่ในรายการ');
        if (allowed && siteIds.some(id => !allowed.includes(id))) throw Error('ไม่มีสิทธิ์แก้ไข Portal ร่วมในทุก Site ที่เลือก');
        // Imported/manual package IDs never override the RADIUS Manager site relationship.
        const packageIds = [...new Set(coverage({ siteIds }, sites, packages).flatMap(row => row.packageIds))];
        return { siteIds, packageSource, packageIds };
    }
    function coverage(bindings, sites, packages) {
        const known = new Set(packages.map(p => p.id));
        return bindings.siteIds.map(siteId => {
            const site = sites.find(s => s.id === siteId), loaded = Array.isArray(site?.allowPackages);
            const ids = loaded ? [...new Set(site.allowPackages.map(entry => entry.packageId))] : [];
            return { siteId, loaded, packageIds: ids.filter(id => known.has(id)), missingPackageIds: ids.filter(id => !known.has(id)) };
        });
    }
    function canManage(bindings, allowed) { return bindings.siteIds.every(id => allowed.includes(id)); }
    function choices(configs, siteId, allowed) {
        if (!allowed.includes(siteId)) return [];
        return Object.entries(configs).filter(([, c]) => c.bindings.siteIds.includes(siteId)).map(([id, c]) => ({ id, name: c.state.name, path: c.state.path }));
    }
    function resolve(configs, siteId, selectedId, allowed) { const rows = choices(configs, siteId, allowed); return rows.some(c => c.id === selectedId) ? selectedId : rows.some(c => c.id === siteId) ? siteId : rows[0]?.id; }
    function pathChoices(configs, allowed) {
        return Object.entries(configs).filter(([, c]) => c.bindings.siteIds.some(id => allowed.includes(id)))
            .map(([id, c]) => ({
                id,
                name: c.state.name,
                path: c.state.path,
                template: c.state.template || 'Custom',
                ownerSiteId: c.ownerSiteId || c.bindings.siteIds[0],
                siteCount: c.bindings.siteIds.length,
                siteIds: c.bindings.siteIds.filter(id => allowed.includes(id)),
                manageable: canManage(c.bindings, allowed)
            }))
            .sort((a, b) => a.path.localeCompare(b.path));
    }
    return { packageSource, defaults, normalize, coverage, canManage, choices, resolve, pathChoices };
});
