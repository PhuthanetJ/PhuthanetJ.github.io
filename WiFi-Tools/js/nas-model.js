/* Local NAS draft helpers. Browser prototype only; never connect these drafts to a live RADIUS server. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WiFiNasModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const fields = ['nameHost', 'shortname', 'type', 'ports', 'secret', 'server', 'community', 'description'];
    const limits = { nameHost: 255, shortname: 100, type: 100, ports: 120, secret: 255, server: 255, community: 255, description: 2000 };
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function validate(value, existing = [], editingId = null) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('ข้อมูล NAS ไม่ถูกต้อง');
        const next = {};
        for (const key of fields) {
            if (typeof value[key] !== 'string' || value[key].length > limits[key]) throw Error('ข้อมูล ' + key + ' ไม่ถูกต้องหรือยาวเกินกำหนด');
            next[key] = key === 'secret' ? value[key] : text(value[key]);
        }
        if (!next.nameHost || /\s/.test(next.nameHost)) throw Error('กรอก Name/Host ให้ถูกต้อง โดยไม่มีช่องว่าง');
        if (!next.shortname) throw Error('กรอก Shortname');
        if (!next.secret.trim()) throw Error('กรอก Secret');
        if (next.ports && (!/^\d{1,5}(?:\s*,\s*\d{1,5})*$/.test(next.ports) || next.ports.split(',').some(v => Number(v) < 1 || Number(v) > 65535))) throw Error('Ports ต้องเป็นเลข 1–65535 คั่นด้วย comma เช่น 1812,1813');
        if (existing.some(row => row.id !== editingId && text(row.nameHost).toLowerCase() === next.nameHost.toLowerCase())) throw Error('Name/Host นี้มีอยู่แล้ว');
        if (existing.some(row => row.id !== editingId && text(row.shortname).toLowerCase() === next.shortname.toLowerCase())) throw Error('Shortname นี้มีอยู่แล้ว');
        return next;
    }
    function id() { return 'nas-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12); }
    function upsert(rows, value, editingId = null) {
        if (!Array.isArray(rows)) throw Error('รายการ NAS ไม่ถูกต้อง');
        if (editingId !== null && !rows.some(row => row.id === editingId)) throw Error('ไม่พบ NAS ที่ต้องการแก้ไข');
        const current = editingId === null ? null : rows.find(row => row.id === editingId);
        const merged = { ...value, secret: !value.secret && current ? current.secret : value.secret };
        const record = { id: current ? current.id : id(), ...validate(merged, rows, editingId) };
        return { rows: current ? rows.map(row => row.id === editingId ? record : row) : [...rows, record], record };
    }
    function remove(rows, recordId) {
        if (!rows.some(row => row.id === recordId)) throw Error('ไม่พบ NAS ที่ต้องการลบ');
        return rows.filter(row => row.id !== recordId);
    }
    function load(raw) {
        if (raw === null) return [];
        let stored;
        try { stored = JSON.parse(raw); } catch (_) { throw Error('อ่าน NAS Draft ไม่ได้: JSON ไม่ถูกต้อง'); }
        if (!stored || stored.schemaVersion !== 1 || !Array.isArray(stored.nas) || stored.nas.length > 500) throw Error('รูปแบบ NAS Draft ไม่ถูกต้อง');
        const ids = new Set(), rows = [];
        for (const row of stored.nas) {
            if (typeof row.id !== 'string' || !/^nas-[a-z0-9-]{8,70}$/i.test(row.id) || ids.has(row.id)) throw Error('NAS Draft มี ID ไม่ถูกต้องหรือซ้ำ');
            ids.add(row.id);
            rows.push({ id: row.id, ...validate(row, rows) });
        }
        return rows;
    }
    function serialize(rows) { return JSON.stringify({ schemaVersion: 1, nas: rows }); }
    return { fields, validate, upsert, remove, load, serialize };
});
