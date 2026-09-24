/* V031: shared offline Site / Package CRUD draft. Syncs Portal Configuration in the same browser; does not update live RADIUS. */
(function () {
    'use strict';
    if (!window.NT || !window.WiFiRadiusCatalog || !window.WiFiRadiusPage) return;
    const { q, esc } = NT, model = WiFiRadiusCatalog, page = WiFiRadiusPage;
    const admin = NT.can('system');
    const key = 'wifi-tools:radius-catalog-demo:v1:' + new URL('../', location.href).href;
    const siteDialog = q('#radius-site-dialog'), siteForm = q('#radius-site-form');
    const packageDialog = q('#radius-package-dialog'), packageForm = q('#radius-package-form');
    let snapshot = model.initial(NT_DATA), writable = true, editingSite = null, editingPackage = null, opener = null;
    function status(value) { q('#radius-catalog-status').textContent = value; }
    function error(kind, message = '') {
        const el = q('#radius-' + kind + '-error'); el.textContent = message; el.hidden = !message;
    }
    function lock(message) {
        writable = false;
        for (const id of ['#radius-site-add', '#radius-package-add', '#radius-package-edit', '#radius-package-delete']) q(id).disabled = true;
        status(message + ' · ปิดการแก้ไขเพื่อป้องกันข้อมูลเดิมถูกเขียนทับ');
    }
    function refresh(selectedPackage = null) {
        page.sites.splice(0, page.sites.length, ...snapshot.sites);
        page.catalog.splice(0, page.catalog.length, ...snapshot.packages);
        page.refresh();
        if (selectedPackage && snapshot.packages.some(row => row.id === selectedPackage)) {
            page.selectPackage(selectedPackage); page.renderPackage();
        }
        q('#radius-package-count').textContent = snapshot.packages.length + ' Package';
        const hasPackage = snapshot.packages.length > 0;
        q('#radius-package-edit').disabled = !writable || !hasPackage;
        q('#radius-package-delete').disabled = !writable || !hasPackage;
    }
    function commit(next, selectedPackage = null) {
        if (!admin || !writable) throw Error('ไม่มีสิทธิ์หรือไม่สามารถบันทึก Draft');
        const validated = model.check(next);
        try { localStorage.setItem(key, model.serialize(validated)); }
        catch (_) { lock('Browser บันทึก Site / Package Draft ไม่ได้ กรุณาอนุญาต localStorage'); throw Error('บันทึกไม่สำเร็จ ข้อมูลเดิมยังอยู่'); }
        if (NT.setRadiusCatalog) NT.setRadiusCatalog(validated);
        snapshot = validated; refresh(selectedPackage);
        status('บันทึก Site / Package Draft แล้ว · Portal Configuration ใช้ข้อมูลชุดเดียวกัน · ยังไม่เชื่อม RADIUS Manager จริง');
    }
    function accountDraftRows() {
        if (!window.WiFiAccountModel) return [];
        const accountKey = 'wifi-tools:radius-accounts-demo:v1:' + new URL('../', location.href).href;
        try { return WiFiAccountModel.load(localStorage.getItem(accountKey), NT_DATA, snapshot.packages, snapshot.sites); }
        catch (_) { return null; }
    }
    function dispatchedAccountCount(siteId) {
        const rows = accountDraftRows(); return rows === null ? null : rows.filter(row => row.dispatchSiteId === siteId).length;
    }
    function packageAccountCount(packageId) {
        const rows = accountDraftRows(); return rows === null ? null : rows.filter(row => row.packageId === packageId).length;
    }
    function dispatchConflicts(siteId, packageIds) {
        const rows = accountDraftRows();
        if (rows === null) return null;
        const targets = new Set(packageIds || []);
        return rows.filter(row => row.dispatchSiteId === siteId && targets.has(row.packageId));
    }
    function choices(record) {
        const checked = new Set(record?.allowPackages?.map(row => row.packageId) || []);
        q('#radius-site-package-choices').innerHTML = snapshot.packages.length ? snapshot.packages.map(row =>
            '<label><input type="checkbox" data-allow-package="' + esc(row.id) + '"' + (checked.has(row.id) ? ' checked' : '') + '><span>' + esc(row.policyName) + ' · ' + esc(row.userPrefix || 'ไม่มี Prefix') + '</span></label>'
        ).join('') : '<p class="nt-help">ยังไม่มี Package สามารถเพิ่มได้จากแท็บ Package</p>';
    }
    function openSite(record = null, clicked = null) {
        if (!admin || !writable) return;
        editingSite = record?.id || null; opener = clicked; siteForm.reset(); error('site');
        q('#radius-site-name').value = record?.name || '';
        q('#radius-site-vlan').value = record?.vlanId ?? '';
        q('#radius-site-location').value = record?.location || '';
        q('#radius-site-concurrent').value = record?.concurrent ?? 0;
        q('#radius-site-description').value = record?.description || '';
        q('#radius-site-title').textContent = record ? 'แก้ไข Site · ' + record.name : 'เพิ่ม Site';
        choices(record); siteDialog.showModal(); q('#radius-site-name').focus();
    }
    function openPackage(record = null, clicked = null) {
        if (!admin || !writable) return;
        editingPackage = record?.id || null; opener = clicked; packageForm.reset(); error('package');
        for (const field of model.packageFields) {
            const input = packageForm.elements.namedItem(field);
            const value = record?.[field] ?? (field === 'status' ? 'Active' : '');
            // Legacy V014 free text has no matching select option. Require explicit user selection.
            input.value = input.tagName === 'SELECT' && !Array.from(input.options).some(option => option.value === value) ? '' : value;
        }
        q('#radius-package-legacy-help').hidden = !record || (model.packageTypes.includes(record.packageType) && model.expirationModes.includes(record.expiration));
        updateExpiration(true); // Loading an older Draft must not silently fabricate Days.
        q('#radius-package-title').textContent = record ? 'แก้ไข Package · ' + record.policyName : 'เพิ่ม Package';
        packageDialog.showModal(); packageForm.elements.namedItem('policyName').focus();
    }
    function updateExpiration(initial = false) {
        const mode = q('#radius-package-expiration').value;
        const specified = mode === 'Specified Date', firstLogin = mode === '1st Login';
        const field = q('#radius-package-expiration-date-field'), input = q('#radius-package-expiration-date');
        const daysField = q('#radius-package-expiration-days-field'), daysInput = q('#radius-package-expiration-days');
        field.hidden = !specified; input.disabled = !specified; input.required = specified;
        daysField.hidden = !firstLogin; daysInput.disabled = !firstLogin; daysInput.required = firstLogin;
        if (!specified) input.value = '';
        if (!firstLogin) daysInput.value = '';
        else if (!initial && !daysInput.value) daysInput.value = '30';
    }
    q('#radius-package-expiration').addEventListener('change', () => updateExpiration());
    if (!admin) {
        for (const id of ['#radius-site-add', '#radius-package-add', '#radius-package-edit', '#radius-package-delete']) q(id).hidden = true;
        status('Site / Package อ่านข้อมูลตามสิทธิ์เท่านั้น · เฉพาะ System Admin สามารถจัดการ Draft ในต้นแบบ');
        q('#radius-package-count').textContent = '';
        return; // Do not load another user's local catalog draft.
    }
    try { snapshot = NT.radiusCatalog ? model.check(NT.radiusCatalog()) : model.load(localStorage.getItem(key), NT_DATA); }
    catch (e) { lock(e.message); }
    if (writable) {
        if (NT.setRadiusCatalog) NT.setRadiusCatalog(snapshot);
        refresh(); status('Site / Package Draft ใช้ร่วมกับ Portal Configuration ใน Browser นี้ · ยังไม่เชื่อม RADIUS Manager จริง');
    }
    q('#radius-site-add').addEventListener('click', e => openSite(null, e.currentTarget));
    q('#radius-package-add').addEventListener('click', e => openPackage(null, e.currentTarget));
    q('#radius-site-rows').addEventListener('click', event => {
        const edit = event.target.closest('[data-site-edit]'), del = event.target.closest('[data-site-delete]');
        if (!admin || !writable || (!edit && !del)) return;
        const record = snapshot.sites.find(row => row.id === (edit || del).dataset[edit ? 'siteEdit' : 'siteDelete']);
        if (!record) return;
        if (edit) { openSite(record, edit); return; }
        const dispatched = dispatchedAccountCount(record.id);
        if (dispatched === null) { status('ตรวจ Account Draft ไม่ได้ จึงยังไม่ลบ Site เพื่อป้องกัน DISPATCH ค้าง'); NT.toast('ตรวจ Account Draft ไม่ได้'); return; }
        if (dispatched > 0) { status('Site "' + record.name + '" ยังมี ' + dispatched + ' Account ที่ DISPATCH อยู่ · ยกเลิก DISPATCH ก่อนลบ Site'); NT.toast('ยกเลิก DISPATCH Account ก่อนลบ Site'); return; }
        const portalCount = Object.values(NT.db?.configs || {}).filter(draft => draft?.bindings?.siteIds?.includes(record.id)).length;
        const impact = portalCount ? '\nPortal Path ที่ผูก Site นี้ ' + portalCount + ' รายการจะถูกปรับความสัมพันธ์ และ Path ที่ไม่มี Site เหลือจะถูกลบจาก Draft' : '';
        if (!confirm('ยืนยันลบ Site "' + record.name + '" จาก Draft ใน Browser?' + impact + '\nข้อมูล Site-scoped Draft ที่อ้าง Site นี้จะถูกทำความสะอาด แต่ยังไม่ลบ Site จริงใน RADIUS Manager')) return;
        try { commit(model.removeSite(snapshot, record.id)); NT.toast('ลบ Site Draft แล้ว'); }
        catch (e) { status(e.message); NT.toast(e.message); }
    });
    siteForm.addEventListener('submit', event => {
        event.preventDefault(); if (!admin || !writable) return;
        const existing = snapshot.sites.find(row => row.id === editingSite);
        const allowPackages = Array.from(q('#radius-site-package-choices').querySelectorAll('[data-allow-package]:checked')).map(input => {
            const previous = existing?.allowPackages.find(row => row.packageId === input.dataset.allowPackage);
            const pkg = snapshot.packages.find(row => row.id === input.dataset.allowPackage);
            return previous ? { ...previous } : { packageId: pkg.id, prefix: pkg.userPrefix, limit: null };
        });
        const value = { name: q('#radius-site-name').value, vlanId: q('#radius-site-vlan').value,
            location: q('#radius-site-location').value, concurrent: q('#radius-site-concurrent').value,
            description: q('#radius-site-description').value, allowPackages };
        if (existing) {
            const nextIds = new Set(allowPackages.map(row => row.packageId));
            const removedIds = existing.allowPackages.map(row => row.packageId).filter(id => !nextIds.has(id));
            if (removedIds.length) {
                const conflicts = dispatchConflicts(existing.id, removedIds);
                if (conflicts === null) {
                    error('site', 'ตรวจ Account Draft ไม่ได้ จึงยังไม่อนุญาตให้นำ Package ออกจาก Site เพื่อป้องกัน DISPATCH ค้าง');
                    return;
                }
                if (conflicts.length) {
                    const counts = new Map();
                    for (const row of conflicts) counts.set(row.packageId, (counts.get(row.packageId) || 0) + 1);
                    const detail = [...counts].map(([packageId, count]) => {
                        const pkg = snapshot.packages.find(row => row.id === packageId);
                        return (pkg?.policyName || packageId) + ' (' + count + ' Account)';
                    }).join(', ');
                    error('site', 'ยังนำ Package ออกจาก Site ไม่ได้ เพราะมี Account ที่ DISPATCH มายัง Site นี้: ' + detail + ' · ยกเลิก DISPATCH ก่อน');
                    return;
                }
            }
        }
        try {
            const saved = model.upsertSite(snapshot, value, editingSite); commit(saved.snapshot);
            siteDialog.close(); NT.toast(editingSite ? 'แก้ไข Site Draft แล้ว' : 'เพิ่ม Site Draft แล้ว');
        } catch (e) { error('site', e.message); }
    });
    q('#radius-package-edit').addEventListener('click', event => {
        const record = snapshot.packages.find(row => row.id === q('#radius-package').value);
        if (record) openPackage(record, event.currentTarget);
    });
    q('#radius-package-delete').addEventListener('click', () => {
        if (!admin || !writable) return;
        const record = snapshot.packages.find(row => row.id === q('#radius-package').value);
        if (!record) return;
        const accountCount = packageAccountCount(record.id);
        if (accountCount === null) { status('ตรวจ Account Draft ไม่ได้ จึงยังไม่ลบ Package เพื่อป้องกัน Account อ้าง Package ที่หายไป'); NT.toast('ตรวจ Account Draft ไม่ได้'); return; }
        if (accountCount > 0) { status('Package "' + record.policyName + '" ยังมี ' + accountCount + ' Account อ้างใช้งานอยู่ · ยังไม่อนุญาตให้ลบเพื่อป้องกัน Account orphan'); NT.toast('Package ยังมี Account ใช้งานอยู่'); return; }
        const linked = snapshot.sites.filter(row => row.allowPackages.some(item => item.packageId === record.id));
        const warning = linked.length ? '\nจะนำ Package นี้ออกจาก Allow Package ของ Site Draft ' + linked.length + ' รายการด้วย' : '';
        if (!confirm('ยืนยันลบ Package "' + record.policyName + '" จาก Draft ใน Browser?' + warning + '\nPortal Configuration จะอัปเดต Package ตาม Draft นี้ แต่ยังไม่ลบ Package จริงใน RADIUS Manager')) return;
        try { commit(model.removePackage(snapshot, record.id)); NT.toast('ลบ Package Draft แล้ว'); }
        catch (e) { status(e.message); NT.toast(e.message); }
    });
    packageForm.addEventListener('submit', event => {
        event.preventDefault(); if (!admin || !writable) return;
        const value = Object.fromEntries(model.packageFields.map(field => [field, packageForm.elements.namedItem(field).value]));
        if (value.expiration !== 'Specified Date') value.expirationDate = '';
        if (value.expiration !== '1st Login') value.expirationDays = '';
        try {
            const saved = model.upsertPackage(snapshot, value, editingPackage); commit(saved.snapshot, saved.record.id);
            packageDialog.close(); NT.toast(editingPackage ? 'แก้ไข Package Draft แล้ว' : 'เพิ่ม Package Draft แล้ว');
        } catch (e) { error('package', e.message); }
    });
    for (const [kind, dialog, form] of [['site', siteDialog, siteForm], ['package', packageDialog, packageForm]]) {
        q('#radius-' + kind + '-close').addEventListener('click', () => dialog.close());
        q('#radius-' + kind + '-cancel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => {
            form.reset(); error(kind); if (kind === 'site') editingSite = null; else editingPackage = null;
            opener?.focus(); opener = null;
        });
    }
})();
