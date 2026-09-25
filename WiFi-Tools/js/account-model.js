/* V035 Account Draft model: strict Package/Site relation validation + safe stale-DISPATCH recovery. Offline prototype only. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WiFiAccountModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const statusValues = ['Active', 'Inactive'];
    const maxAccounts = 50000;
    function clean(value) { return typeof value === 'string' ? value.trim() : ''; }
    function makeId() { return 'acct-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
    function optionalScalar(value, label, max = 100) {
        if (value === null || value === undefined || value === '') return '';
        if (!['string', 'number'].includes(typeof value)) throw Error(label + ' ไม่ถูกต้อง');
        const out = String(value).trim();
        if (out.length > max) throw Error(label + ' ยาวเกินกำหนด');
        return out;
    }
    function optionalDate(value, label) {
        const out = optionalScalar(value, label, 80);
        if (!out) return '';
        if (!Number.isFinite(Date.parse(out))) throw Error(label + ' ไม่ถูกต้อง');
        return new Date(out).toISOString();
    }
    function sessions(value) {
        if (value === null || value === undefined) return [];
        if (!Array.isArray(value) || value.length > 5000) throw Error('Sessions ไม่ถูกต้องหรือมากเกินกำหนด');
        return value.map((row, index) => {
            if (!row || typeof row !== 'object' || Array.isArray(row)) throw Error('Session ลำดับ ' + (index + 1) + ' ไม่ถูกต้อง');
            const mac = optionalScalar(row.mac, 'MAC', 64);
            if (!mac) throw Error('Session ลำดับ ' + (index + 1) + ' ไม่มี MAC');
            return { mac, lastSeen: optionalDate(row.lastSeen, 'Last seen') };
        });
    }
    function packageByValue(packages, value) {
        const needle = clean(value).toLowerCase();
        return packages.find(row => row.id.toLowerCase() === needle || clean(row.policyName).toLowerCase() === needle);
    }
    function siteByValue(sites, value) {
        const needle = clean(value).toLowerCase();
        return sites.find(row => row.id.toLowerCase() === needle || clean(row.name).toLowerCase() === needle);
    }
    function siteAllows(site, packageId) {
        return Array.isArray(site?.allowPackages) && site.allowPackages.some(row => row.packageId === packageId);
    }
    function normalizeRecord(value, existing, packages, sites, id = null, allowMissingRelations = false) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('ข้อมูล Account ไม่ถูกต้อง');
        const username = clean(value.username);
        const packageId = clean(value.packageId);
        const rawStatus = clean(value.status) || 'Active';
        const status = rawStatus === 'Disabled' ? 'Inactive' : rawStatus;
        const dispatchSiteId = clean(value.dispatchSiteId) || null;
        const createdAt = clean(value.createdAt);
        if (!username || username.length > 128 || /[\s,]/.test(username)) throw Error('Username ต้องมี 1–128 ตัวอักษร และไม่มีช่องว่างหรือ comma');
        if (!packages.some(row => row.id === packageId) && !allowMissingRelations) throw Error('ไม่พบ Package ของ Account');
        if (!statusValues.includes(status)) throw Error('Status ต้องเป็น Active หรือ Inactive');
        if (dispatchSiteId) {
            const site = sites.find(row => row.id === dispatchSiteId);
            if (!site && !allowMissingRelations) throw Error('ไม่พบ Site ที่ DISPATCH');
            if (site && !siteAllows(site, packageId) && !allowMissingRelations) throw Error('Site ที่ DISPATCH ไม่มี Package ของ Account นี้');
        }
        if (createdAt && (!Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt)) throw Error('Created Date ของ Account ไม่ถูกต้อง');
        const dup = existing.find(row => row.id !== id && clean(row.username).toLowerCase() === username.toLowerCase());
        if (dup) throw Error('Username "' + username + '" มีอยู่แล้ว');
        return { username, packageId, status, dispatchSiteId, createdAt: createdAt || new Date().toISOString(), firstLogin: optionalDate(value.firstLogin, 'First Login'), expiredDate: optionalDate(value.expiredDate, 'Expired Date'), timeUsed: optionalScalar(value.timeUsed, 'Time Used'), lastLogin: optionalDate(value.lastLogin, 'Last Login'), remain: optionalScalar(value.remain, 'Remain'), sessions: sessions(value.sessions) };
    }
    function initial(data, packages, sites) {
        const source = Array.isArray(data?.['radius-accounts']?.accounts) ? data['radius-accounts'].accounts : [];
        const rows = [];
        for (const raw of source) {
            const id = clean(raw.id) || makeId();
            rows.push({ id, ...normalizeRecord({ ...raw, dispatchSiteId: raw.dispatchSiteId || null, createdAt: raw.createdAt || '' }, rows, packages, sites, id) });
        }
        return rows;
    }
    function check(rows, packages, sites) {
        if (!Array.isArray(rows) || rows.length > maxAccounts) throw Error('รายการ Account ไม่ถูกต้องหรือมากเกินกำหนด');
        const out = [], ids = new Set();
        for (const raw of rows) {
            if (typeof raw.id !== 'string' || !/^[a-z0-9-]{3,100}$/i.test(raw.id) || ids.has(raw.id)) throw Error('Account ID ไม่ถูกต้องหรือซ้ำ');
            ids.add(raw.id);
            out.push({ id: raw.id, ...normalizeRecord(raw, out, packages, sites, raw.id) });
        }
        return out;
    }
    function recoverStaleDispatch(rows, packages, sites) {
        let recovered = 0;
        const next = rows.map(raw => {
            const packageId = clean(raw?.packageId);
            if (!packages.some(row => row.id === packageId)) return raw; // Missing Package is unsafe to guess; strict validation will stop the draft.
            const dispatchSiteId = clean(raw?.dispatchSiteId);
            if (!dispatchSiteId) return raw;
            const site = sites.find(row => row.id === dispatchSiteId);
            if (site && siteAllows(site, packageId)) return raw;
            recovered++;
            // Fail closed for legacy stale DISPATCH: disable the Account and clear only the invalid Site relation.
            return { ...raw, status: 'Inactive', dispatchSiteId: null };
        });
        return { rows: next, recovered };
    }
    function load(raw, data, packages, sites) {
        if (raw === null) return initial(data, packages, sites);
        let saved;
        try { saved = JSON.parse(raw); } catch (_) { throw Error('อ่าน Account Draft ไม่ได้: JSON ไม่ถูกต้อง'); }
        if (!saved || saved.schemaVersion !== 1 || !Array.isArray(saved.accounts)) throw Error('รูปแบบ Account Draft ไม่ถูกต้อง');
        return check(recoverStaleDispatch(saved.accounts, packages, sites).rows, packages, sites);
    }
    function serialize(rows, packages, sites) { return JSON.stringify({ schemaVersion: 1, accounts: check(rows, packages, sites) }); }
    function create(rows, value, packages, sites) {
        if (rows.length >= maxAccounts) throw Error('จำนวน Account ถึงขีดจำกัดของ Prototype');
        const record = { id: makeId(), ...normalizeRecord(value, rows, packages, sites) };
        return { rows: [...rows, record], record };
    }
    function generate(rows, value, packages, sites) {
        const pkg = packages.find(row => row.id === clean(value.packageId));
        if (!pkg) throw Error('เลือก Package สำหรับ GENERATE');
        const count = Number(value.count);
        if (!Number.isInteger(count) || count < 1 || count > 1000) throw Error('จำนวน GENERATE ต้องเป็น 1–1,000 Account ต่อครั้ง');
        if (rows.length + count > maxAccounts) throw Error('จำนวน Account หลัง GENERATE มากเกินกำหนดของ Prototype');
        const rawStatus = clean(value.status) || 'Active';
        const status = rawStatus === 'Disabled' ? 'Inactive' : rawStatus;
        if (!statusValues.includes(status)) throw Error('Status ต้องเป็น Active หรือ Inactive');
        const prefix = clean(pkg.userPrefix) || 'ACC';
        let maxSeq = 0;
        const pattern = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$', 'i');
        for (const row of rows) {
            const match = row.username.match(pattern);
            if (match) maxSeq = Math.max(maxSeq, Number(match[1]) || 0);
        }
        const next = [...rows], created = [];
        for (let i = 1; i <= count; i++) {
            const username = prefix + String(maxSeq + i).padStart(8, '0');
            const saved = create(next, { username, packageId: pkg.id, status, dispatchSiteId: null }, packages, sites).record;
            next.push(saved); created.push(saved);
        }
        return { rows: next, created };
    }
    function update(rows, accountId, value, packages, sites) {
        const current = rows.find(row => row.id === accountId);
        if (!current) throw Error('ไม่พบ Account ที่ต้องการแก้ไข');
        const merged = { ...current, ...value, createdAt: current.createdAt, firstLogin: current.firstLogin, expiredDate: current.expiredDate, timeUsed: current.timeUsed, lastLogin: current.lastLogin, remain: current.remain, sessions: current.sessions };
        const record = { id: current.id, ...normalizeRecord(merged, rows, packages, sites, current.id) };
        return { rows: rows.map(row => row.id === current.id ? record : row), record };
    }
    function remove(rows, accountIds) {
        const ids = new Set(Array.isArray(accountIds) ? accountIds : []);
        if (!ids.size) throw Error('เลือก Account ที่ต้องการลบอย่างน้อย 1 รายการ');
        if ([...ids].some(id => !rows.some(row => row.id === id))) throw Error('มี Account ที่เลือกไม่อยู่ในรายการปัจจุบัน');
        return rows.filter(row => !ids.has(row.id));
    }
    function dispatch(rows, accountIds, siteId, packages, sites) {
        const ids = new Set(Array.isArray(accountIds) ? accountIds : []);
        if (!ids.size) throw Error('เลือก Account ที่ต้องการ DISPATCH อย่างน้อย 1 รายการ');
        if ([...ids].some(id => !rows.some(row => row.id === id))) throw Error('มี Account ที่เลือกไม่อยู่ในรายการปัจจุบัน');
        const target = clean(siteId) || null;
        if (target) {
            const site = sites.find(row => row.id === target);
            if (!site) throw Error('ไม่พบ Site ที่ต้องการ DISPATCH');
            for (const row of rows.filter(item => ids.has(item.id))) if (!siteAllows(site, row.packageId)) throw Error('Site "' + site.name + '" ไม่มี Package ของ Account บางรายการที่เลือก');
        }
        return rows.map(row => ids.has(row.id) ? { ...row, dispatchSiteId: target } : row);
    }
    function importRows(rows, imported, packages, sites) {
        if (!Array.isArray(imported) || imported.length === 0) throw Error('CSV ไม่มีข้อมูล Account');
        if (imported.length > 5000) throw Error('IMPORT รองรับสูงสุด 5,000 Account ต่อครั้งใน Prototype');
        if (rows.length + imported.length > maxAccounts) throw Error('จำนวน Account หลัง IMPORT มากเกินกำหนดของ Prototype');
        let next = [...rows]; const created = [];
        for (let index = 0; index < imported.length; index++) {
            const raw = imported[index];
            const pkg = packageByValue(packages, raw.package || raw.packageId);
            if (!pkg) throw Error('CSV แถว ' + (index + 2) + ': ไม่พบ Package "' + clean(raw.package || raw.packageId) + '"');
            const siteValue = clean(raw.dispatchSite || raw.dispatchSiteId);
            const site = siteValue ? siteByValue(sites, siteValue) : null;
            if (siteValue && !site) throw Error('CSV แถว ' + (index + 2) + ': ไม่พบ Site "' + siteValue + '"');
            const saved = create(next, { username: raw.username, packageId: pkg.id, status: raw.status || 'Active', dispatchSiteId: site?.id || null }, packages, sites).record;
            next.push(saved); created.push(saved);
        }
        return { rows: next, created };
    }
    return { statusValues, maxAccounts, siteAllows, recoverStaleDispatch, initial, check, load, serialize, create, update, remove, generate, dispatch, importRows };
});
