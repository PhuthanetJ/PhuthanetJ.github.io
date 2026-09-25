/* NAS CRUD is deliberately a local-only prototype. System Admin UI gating is not a security boundary. */
(function () {
    'use strict';
    if (!window.NT || !window.WiFiNasModel) return;
    const { q, esc } = NT, model = WiFiNasModel;
    const admin = NT.can('system');
    const legacyStorageKey = NT.legacyStorageKeys?.radiusNasKey || ('wifi-tools:nas-demo:v1:' + new URL('../', location.href).href);
    const dialog = q('#radius-nas-dialog'), form = q('#radius-nas-form');
    const fieldIds = { nameHost: '#radius-nas-name-host', shortname: '#radius-nas-shortname', type: '#radius-nas-type', ports: '#radius-nas-ports', secret: '#radius-nas-secret', server: '#radius-nas-server', community: '#radius-nas-community', description: '#radius-nas-description' };
    let rows = [], editingId = null, opener = null, canSave = true;
    const status = message => { q('#radius-nas-storage-status').textContent = message; };
    const error = message => { q('#radius-nas-error').textContent = message; q('#radius-nas-error').hidden = !message; };
    const display = value => value ? esc(value) : '—';
    function render() {
        if (!admin) return;
        const search = q('#radius-nas-search').value.trim().toLowerCase();
        const filtered = rows.filter(row => [row.nameHost, row.shortname, row.server].some(value => value.toLowerCase().includes(search)));
        q('#radius-nas-count').textContent = filtered.length + ' / ' + rows.length + ' NAS';
        q('#radius-nas-rows').innerHTML = filtered.length ? filtered.map(row => '<tr><td>' + display(row.nameHost) + '</td><td>' + display(row.shortname) + '</td><td><span class="wt-nas-secret" aria-label="Secret ถูกปิดบัง">' + (row.secret ? '••••••••' : '—') + '</span></td><td>' + display(row.server) + '</td><td><div class="wt-nas-row-actions"><button type="button" class="nt-button nt-compact" data-nas-edit="' + esc(row.id) + '">แก้ไข</button><button type="button" class="nt-button nt-compact wt-nas-delete" data-nas-delete="' + esc(row.id) + '">ลบ</button></div></td></tr>').join('') : '<tr><td colspan="5">ยังไม่มี NAS หรือไม่พบรายการตามคำค้น</td></tr>';
    }
    function open(record = null, clicked = null) {
        if (!admin || !canSave) return;
        editingId = record?.id || null; opener = clicked;
        form.reset(); error('');
        for (const [name, selector] of Object.entries(fieldIds)) q(selector).value = record && name !== 'secret' ? record[name] : '';
        q('#radius-nas-title').textContent = record ? 'แก้ไข NAS · ' + record.shortname : 'เพิ่ม NAS';
        q('#radius-nas-form-help').textContent = record ? 'Secret เว้นว่างเพื่อใช้ค่าเดิม หรือกรอกค่าใหม่เพื่อเปลี่ยน (ค่าเดิมไม่แสดง) · ข้อมูลอยู่เฉพาะ Browser' : 'กรอก 8 พารามิเตอร์ · Secret จำลองเท่านั้น · ข้อมูลอยู่เฉพาะ Browser';
        q('#radius-nas-secret').required = !record;
        dialog.showModal(); q('#radius-nas-name-host').focus();
    }
    function storageMessage() {
        const state = NT.storageStatus?.() || {};
        if (state.local) return 'NAS ใช้ Shared Browser Draft (localStorage ไม่เข้ารหัส) · Secret ไม่ถูกส่งผ่าน window.name · ยังไม่เชื่อม RADIUS';
        if (state.nasSession) return 'localStorage เต็มหรือใช้งานไม่ได้ · NAS Draft ถูกเก็บชั่วคราวใน Session ของแท็บนี้ · ปิดแท็บแล้วข้อมูลอาจหาย · Secret ไม่ถูกส่งผ่าน window.name';
        return 'Browser Storage ใช้งานไม่ได้ · NAS Draft ใช้งานได้ชั่วคราวเฉพาะหน้านี้จนกว่าจะ Reload/ออกจากหน้า · Secret ไม่ถูกส่งผ่าน window.name';
    }
    function commit(next) {
        if (!admin || !canSave) throw Error('ไม่มีสิทธิ์จัดการ NAS Draft');
        // Shared storage prefers localStorage; V054 falls back to per-tab session/RAM without leaking Secret to window.name.
        if (!NT.setRadiusNas) throw Error('Shared Storage API ไม่พร้อมใช้งาน');
        rows = NT.setRadiusNas(next);
        render(); status(storageMessage());
    }
    if (!admin) {
        q('#radius-nas-add').hidden = true;
        q('#radius-nas-search').disabled = true;
        q('#radius-nas-count').textContent = '';
        q('#radius-nas-rows').innerHTML = '<tr><td colspan="5">บัญชีนี้ไม่มีสิทธิ์จัดการ NAS · เฉพาะ System Admin ในต้นแบบ</td></tr>';
        status('NAS Draft จำกัดการแสดงผลใน UI สำหรับ System Admin เท่านั้น · Production ต้องตรวจสิทธิ์ที่ Backend');
        return;
    }
    try {
        let stored = NT.radiusNas?.();
        if (!stored) {
            let legacyRaw = null; try { legacyRaw = localStorage.getItem(legacyStorageKey); } catch (_) { }
            stored = model.load(legacyRaw);
            NT.setRadiusNas(stored);
        } else stored = model.load(JSON.stringify({ schemaVersion: 1, nas: stored }));
        rows = stored;
    } catch (e) { canSave = false; q('#radius-nas-add').disabled = true; status(e.message + ' · ปิดการแก้ไขเพราะข้อมูล NAS Draft ไม่ถูกต้องหรือ API ไม่พร้อม'); }
    if (canSave) status(storageMessage());
    render();
    q('#radius-nas-search').addEventListener('input', render);
    q('#radius-nas-add').addEventListener('click', event => open(null, event.currentTarget));
    q('#radius-nas-rows').addEventListener('click', event => {
        const edit = event.target.closest('[data-nas-edit]'), del = event.target.closest('[data-nas-delete]');
        if (!admin || !canSave || (!edit && !del)) return;
        const record = rows.find(row => row.id === (edit || del).dataset[edit ? 'nasEdit' : 'nasDelete']);
        if (!record) return;
        if (edit) return open(record, edit);
        if (!confirm('ยืนยันการลบ NAS "' + record.shortname + '" จาก Draft ใน Browser?\nการลบนี้ไม่ส่งผลต่อ RADIUS จริง')) return;
        try { commit(model.remove(rows, record.id)); NT.toast('ลบ NAS Draft แล้ว'); }
        catch (e) { status(e.message); NT.toast(e.message); }
    });
    form.addEventListener('submit', event => {
        event.preventDefault(); if (!admin || !canSave) return;
        const value = Object.fromEntries(Object.entries(fieldIds).map(([name, selector]) => [name, q(selector).value]));
        try { const isEditing = editingId !== null; const next = model.upsert(rows, value, editingId); commit(next.rows); dialog.close(); NT.toast(isEditing ? 'แก้ไข NAS Draft แล้ว' : 'เพิ่ม NAS Draft แล้ว'); }
        catch (e) { error(e.message); }
    });
    q('#radius-nas-close').addEventListener('click', () => dialog.close());
    q('#radius-nas-cancel').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { form.reset(); error(''); editingId = null; if (!q('#radius-panel-nas').hidden) opener?.focus(); opener = null; });
})();
