/* Offline RADIUS Site/Package draft model. V031 shares validated Draft data with Portal Configuration; live systems are not modified. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WiFiRadiusCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const packageFields = ['policyName', 'userPrefix', 'usernameFormat', 'packageExpired', 'packageType', 'upload', 'download', 'sessionTime', 'sessionLimit', 'idleTimeout', 'time', 'dailyTime', 'weeklyTime', 'monthlyTime', 'expiration', 'expirationDate', 'expirationDays', 'price', 'description', 'status'];
    const packageTypes = ['Prepaid', 'Postpaid'];
    const expirationModes = ['1st Login', 'Specified Date', 'Unlimited'];
    const unlimitedFields = ['upload', 'download', 'sessionTime', 'sessionLimit', 'idleTimeout', 'time', 'dailyTime', 'weeklyTime', 'monthlyTime'];
    function isUnlimitedValue(value) {
        const raw = String(value ?? '').trim();
        if (!raw) return true;
        const compact = raw.toLowerCase().replace(/\s+/g, ' ');
        if (/^0+(?:\.0+)?(?:\s*(?:bps|kbps|mbps|gbps))?$/.test(compact)) return true;
        if (/^0+(?::0+){1,2}$/.test(compact)) return true;
        return false;
    }
    function validDay(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0);
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }
    function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
    function text(value, label, max = 2000) {
        if (typeof value !== 'string' || value.length > max) throw Error(label + ' ไม่ถูกต้อง หรือยาวเกินกำหนด');
        return value.trim();
    }
    function site(value, sites, packages, editingId = null) {
        const name = text(value?.name, 'ชื่อ Site', 150);
        if (!name) throw Error('กรอกชื่อ Site');
        if (sites.some(row => row.id !== editingId && row.name.toLowerCase() === name.toLowerCase())) throw Error('ชื่อ Site ซ้ำ');
        const vlanValue = value.vlanId === null || value.vlanId === '' ? null : Number(value.vlanId);
        if (vlanValue !== null && (!Number.isInteger(vlanValue) || vlanValue < 1 || vlanValue > 4094)) throw Error('VLAN ID ต้องเป็น 1–4094 หรือเว้นว่าง');
        const concurrent = Number(value.concurrent);
        if (!Number.isSafeInteger(concurrent) || concurrent < 0 || concurrent > 1000000) throw Error('Concurrent ต้องเป็นจำนวนเต็ม 0–1,000,000');
        if (!Array.isArray(value.allowPackages) || value.allowPackages.length > packages.length) throw Error('รายการ Allow Package ไม่ถูกต้อง');
        const seen = new Set();
        const allowPackages = value.allowPackages.map(entry => {
            if (!entry || typeof entry.packageId !== 'string' || seen.has(entry.packageId)) throw Error('Allow Package ซ้ำหรือรูปแบบไม่ถูกต้อง');
            const pkg = packages.find(row => row.id === entry.packageId);
            if (!pkg) throw Error('ไม่พบ Package ที่เลือก');
            seen.add(entry.packageId);
            const prefix = text(entry.prefix, 'Prefix', 100);
            if (entry.limit !== null && (typeof entry.limit !== 'number' || !Number.isSafeInteger(entry.limit) || entry.limit < 0)) throw Error('Limit ไม่ถูกต้อง');
            return { packageId: entry.packageId, prefix, limit: entry.limit };
        });
        return { name, vlanId: vlanValue, location: text(value.location, 'Location', 255), concurrent,
            description: text(value.description, 'Description'), allowPackages };
    }
    function pkg(value, packages, editingId = null, enforceNewOptions = false) {
        const record = {};
        // V015 snapshots do not have expirationDays. Keep their value empty until explicitly configured.
        for (const field of packageFields) record[field] = text(value?.[field] ?? (['expirationDate', 'expirationDays'].includes(field) ? '' : undefined), field, field === 'description' ? 2000 : 255);
        if (!record.policyName) throw Error('กรอกชื่อ Policy / Package');
        if (packages.some(row => row.id !== editingId && row.policyName.toLowerCase() === record.policyName.toLowerCase())) throw Error('ชื่อ Package ซ้ำ');
        if (enforceNewOptions) {
            if (!packageTypes.includes(record.packageType)) throw Error('เลือก Package Type เป็น Prepaid หรือ Postpaid');
            if (!expirationModes.includes(record.expiration)) throw Error('เลือก Expiration เป็น 1st Login, Specified Date หรือ Unlimited');
            if (record.expiration === 'Specified Date' && !validDay(record.expirationDate)) throw Error('ระบุ Expiration Date ให้ถูกต้อง');
            if (record.expiration !== 'Specified Date') record.expirationDate = '';
            if (record.expiration === '1st Login' && !record.expirationDays) throw Error('ระบุ Days สำหรับ 1st Login');
            if (record.expiration !== '1st Login') record.expirationDays = '';
        }
        // Older V014/V015 drafts may lack Days; accept them on load, but require Days before saving a 1st Login Package.
        if (record.expiration === '1st Login' && record.expirationDays) {
            if (!/^[0-9]+$/.test(record.expirationDays) || !Number.isSafeInteger(Number(record.expirationDays)) || Number(record.expirationDays) < 1 || Number(record.expirationDays) > 36500) throw Error('Days ต้องเป็นจำนวนเต็ม 1–36500');
            record.expirationDays = String(Number(record.expirationDays));
        }
        if (record.expiration !== '1st Login' && record.expirationDays) throw Error('Days ใช้ได้เฉพาะ Expiration = 1st Login');
        // V014 allowed free-text Type and Expiration. Preserve old drafts instead of rewriting them silently.
        if (packageTypes.includes(record.packageType) && expirationModes.includes(record.expiration) && record.expiration === 'Specified Date' && record.expirationDate && !validDay(record.expirationDate)) throw Error('Expiration Date ไม่ถูกต้อง');
        return record;
    }
    function upsertSite(snapshot, value, editingId = null) {
        const current = editingId === null ? null : snapshot.sites.find(row => row.id === editingId);
        if (editingId !== null && !current) throw Error('ไม่พบ Site ที่ต้องการแก้ไข');
        const record = { id: current?.id || id('site'), ...site(value, snapshot.sites, snapshot.packages, editingId) };
        const next = clone(snapshot);
        next.sites = current ? next.sites.map(row => row.id === editingId ? record : row) : [...next.sites, record];
        return { snapshot: next, record };
    }
    function upsertPackage(snapshot, value, editingId = null) {
        const current = editingId === null ? null : snapshot.packages.find(row => row.id === editingId);
        if (editingId !== null && !current) throw Error('ไม่พบ Package ที่ต้องการแก้ไข');
        const record = { id: current?.id || id('pkg'), ...pkg(value, snapshot.packages, editingId, true), createdAt: current ? (current.createdAt ?? '') : new Date().toISOString() };
        const next = clone(snapshot);
        next.packages = current ? next.packages.map(row => row.id === editingId ? record : row) : [...next.packages, record];
        return { snapshot: next, record };
    }
    function removeSite(snapshot, recordId) {
        if (!snapshot.sites.some(row => row.id === recordId)) throw Error('ไม่พบ Site ที่ต้องการลบ');
        if (snapshot.sites.length <= 1) throw Error('ต้องมี Site อย่างน้อย 1 รายการ');
        const next = clone(snapshot); next.sites = next.sites.filter(row => row.id !== recordId);
        return next;
    }
    function removePackage(snapshot, recordId) {
        if (!snapshot.packages.some(row => row.id === recordId)) throw Error('ไม่พบ Package ที่ต้องการลบ');
        const next = clone(snapshot); next.packages = next.packages.filter(row => row.id !== recordId);
        next.sites.forEach(row => { row.allowPackages = row.allowPackages.filter(entry => entry.packageId !== recordId); });
        return next;
    }
    function initial(data) { return check(clone({ sites: data['radius-sites'].sites, packages: data['radius-packages'].packages })); }
    function check(raw) {
        if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sites) || !Array.isArray(raw.packages) || raw.sites.length < 1 || raw.sites.length > 500 || raw.packages.length > 500) throw Error('รูปแบบ Site/Package Draft ไม่ถูกต้อง หรือไม่มี Site เหลืออยู่');
        const sites = [], packages = [], ids = new Set();
        for (const row of raw.packages) {
            if (typeof row.id !== 'string' || !/^[a-z0-9-]{1,80}$/i.test(row.id) || ids.has(row.id)) throw Error('Package ID ไม่ถูกต้องหรือซ้ำ');
            const createdAt = row.createdAt ?? '';
            if (typeof createdAt !== 'string' || (createdAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt))) throw Error('Created Date ไม่ถูกต้อง');
            ids.add(row.id); packages.push({ id: row.id, ...pkg(row, packages), createdAt });
        }
        for (const row of raw.sites) {
            if (typeof row.id !== 'string' || !/^[a-z0-9-]{1,80}$/i.test(row.id) || ids.has(row.id)) throw Error('Site ID ไม่ถูกต้องหรือซ้ำ');
            ids.add(row.id); sites.push({ id: row.id, ...site(row, sites, packages) });
        }
        return { sites, packages };
    }
    function load(raw, data) {
        if (raw === null) return initial(data);
        let saved;
        try { saved = JSON.parse(raw); } catch (_) { throw Error('อ่าน Site/Package Draft ไม่ได้: JSON ไม่ถูกต้อง'); }
        if (saved?.schemaVersion !== 1) throw Error('Version ของ Site/Package Draft ไม่ถูกต้อง');
        return check(saved);
    }
    function serialize(snapshot) { return JSON.stringify({ schemaVersion: 1, ...check(snapshot) }); }
    return { packageFields, packageTypes, expirationModes, unlimitedFields, isUnlimitedValue, validDay, initial, check, load, serialize, upsertSite, upsertPackage, removeSite, removePackage };
});
