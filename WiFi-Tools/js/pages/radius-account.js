/* V024: Account Draft actions. CREATE / GENERATE / IMPORT / DISPATCH / EXPORT CSV + Account Status update. */
(function () {
    'use strict';
    if (!window.NT || !window.WiFiRadiusPage || !window.WiFiAccountModel) return;
    const { q, esc } = NT, page = WiFiRadiusPage, model = WiFiAccountModel;
    const admin = NT.can('system');
    const storageKey = 'wifi-tools:radius-accounts-demo:v1:' + new URL('../', location.href).href;
    const createDialog = q('#radius-account-create-dialog');
    const generateDialog = q('#radius-account-generate-dialog');
    const dispatchDialog = q('#radius-account-dispatch-dialog');
    const createForm = q('#radius-account-create-form');
    const generateForm = q('#radius-account-generate-form');
    const dispatchForm = q('#radius-account-dispatch-form');
    let accounts = page.accounts.map(row => ({ ...row }));
    let writable = admin;
    let opener = null;
    const status = message => { q('#radius-account-storage-status').textContent = message; };
    function error(kind, message = '') {
        const el = q('#radius-account-' + kind + '-error'); el.textContent = message; el.hidden = !message;
    }
    function lock(message) {
        writable = false;
        for (const id of ['#radius-account-create', '#radius-account-generate', '#radius-account-import', '#radius-account-dispatch']) q(id).disabled = true;
        status(message + ' · ปิด CREATE / GENERATE / IMPORT / DISPATCH เพื่อป้องกันข้อมูล Draft เดิม');
    }
    function packageOptions() {
        return page.catalog.map(row => '<option value="' + esc(row.id) + '">' + esc(row.policyName) + '</option>').join('');
    }
    function commit(next, message) {
        if (!admin || !writable) throw Error('ไม่มีสิทธิ์หรือ Browser ไม่สามารถบันทึก Account Draft');
        const validated = model.check(next, page.catalog, page.sites);
        try { localStorage.setItem(storageKey, model.serialize(validated, page.catalog, page.sites)); }
        catch (_) { lock('Browser บันทึก Account Draft ไม่ได้ กรุณาอนุญาต localStorage'); throw Error('บันทึก Account Draft ไม่สำเร็จ'); }
        accounts = validated;
        page.replaceAccounts(accounts);
        status(message + ' · Account Draft อยู่เฉพาะ Browser นี้ ยังไม่ Sync ไป RADIUS Manager');
    }
    window.WiFiRadiusAccountActions = {
        setStatus(accountId, nextStatus) {
            if (!admin || !writable) throw Error('ไม่มีสิทธิ์หรือ Browser ไม่สามารถบันทึก Account Draft');
            if (!model.statusValues.includes(nextStatus)) throw Error('Status ต้องเป็น Active หรือ Inactive');
            if (!accounts.some(row => row.id === accountId)) throw Error('ไม่พบ Account ที่เลือก');
            const next = accounts.map(row => row.id === accountId ? { ...row, status: nextStatus } : row);
            commit(next, 'เปลี่ยน Status Account เป็น ' + nextStatus);
            return true;
        }
    };
    function openCreate(clicked) {
        if (!writable) return;
        opener = clicked; createForm.reset(); error('create');
        q('#radius-account-create-package').innerHTML = '<option value="">เลือก Package</option>' + packageOptions();
        q('#radius-account-create-status').value = 'Active';
        createDialog.showModal(); q('#radius-account-create-username').focus();
    }
    function openGenerate(clicked) {
        if (!writable) return;
        opener = clicked; generateForm.reset(); error('generate');
        q('#radius-account-generate-package').innerHTML = '<option value="">เลือก Package</option>' + packageOptions();
        q('#radius-account-generate-count').value = '10'; q('#radius-account-generate-status').value = 'Active';
        generateDialog.showModal(); q('#radius-account-generate-package').focus();
    }
    function selectedRows() {
        const ids = new Set(page.getSelectedAccountIds());
        return accounts.filter(row => ids.has(row.id));
    }
    function openDispatch(clicked) {
        if (!writable) return;
        const selected = selectedRows();
        if (!selected.length) { NT.toast('เลือก Account ที่ต้องการ DISPATCH ก่อน'); return; }
        opener = clicked; dispatchForm.reset(); error('dispatch');
        const packageIds = new Set(selected.map(row => row.packageId));
        const candidates = page.sites.filter(site => [...packageIds].every(packageId => model.siteAllows(site, packageId)));
        const current = new Set(selected.map(row => row.dispatchSiteId || ''));
        const picker = q('#radius-account-dispatch-site');
        picker.innerHTML = '<option value="__choose__">เลือกการ DISPATCH</option><option value="">ไม่ DISPATCH · ใช้ได้ทุก Site ที่มี Package</option>' + candidates.map(site => '<option value="' + esc(site.id) + '">' + esc(site.name) + '</option>').join('');
        picker.value = current.size === 1 && [...current][0] && candidates.some(site => site.id === [...current][0]) ? [...current][0] : (current.size === 1 && [...current][0] === '' ? '' : '__choose__');
        q('#radius-account-dispatch-help').textContent = 'เลือก ' + selected.length.toLocaleString('en-US') + ' Account · Site ที่แสดงต้องมี Package ครบทุก Package ของ Account ที่เลือก' + (candidates.length ? '' : ' · ไม่พบ Site ที่รองรับ Package ครบทั้งหมด จึงทำได้เฉพาะ “ไม่ DISPATCH”');
        dispatchDialog.showModal(); picker.focus();
    }
    function parseCsv(text) {
        const rows = []; let row = [], field = '', quoted = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (quoted) {
                if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
                else if (ch === '"') quoted = false;
                else field += ch;
            } else if (ch === '"') quoted = true;
            else if (ch === ',') { row.push(field); field = ''; }
            else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
            else field += ch;
        }
        row.push(field.replace(/\r$/, '')); if (row.some(value => value !== '')) rows.push(row);
        if (quoted) throw Error('CSV มีเครื่องหมาย quote ไม่ครบ');
        if (rows.length < 2) throw Error('CSV ต้องมี Header และข้อมูลอย่างน้อย 1 แถว');
        const keys = rows[0].map(value => value.trim().toLowerCase().replace(/[\s_-]+/g, ''));
        const find = (...names) => keys.findIndex(key => names.includes(key));
        const indexes = { username: find('username'), package: find('package', 'packageid'), status: find('status'), dispatchSite: find('dispatchsite', 'dispatchsiteid', 'site') };
        if (indexes.username < 0 || indexes.package < 0) throw Error('CSV ต้องมีคอลัมน์ username และ package');
        return rows.slice(1).filter(values => values.some(value => value.trim())).map(values => ({
            username: values[indexes.username] || '', package: values[indexes.package] || '',
            status: indexes.status >= 0 ? values[indexes.status] : 'Active',
            dispatchSite: indexes.dispatchSite >= 0 ? values[indexes.dispatchSite] : ''
        }));
    }
    function csvCell(value) { return '"' + String(value ?? '').replace(/"/g, '""') + '"'; }
    function exportCsv() {
        const visible = page.getVisibleAccounts();
        if (!visible.length) { NT.toast('ไม่มี Account ในรายการปัจจุบันสำหรับ EXPORT'); return; }
        const lines = [['username', 'package', 'status', 'dispatch_site']];
        for (const row of visible) {
            const pkg = page.catalog.find(item => item.id === row.packageId);
            const site = row.dispatchSiteId ? page.sites.find(item => item.id === row.dispatchSiteId) : null;
            lines.push([row.username, pkg?.policyName || row.packageId, row.status, site?.name || '']);
        }
        const csv = '\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'wifi-tools-radius-accounts.csv'; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        status('EXPORT CSV ' + visible.length.toLocaleString('en-US') + ' Account จากรายการที่กำลังแสดง');
    }
    if (!admin) {
        status('Account อ่านข้อมูลตามสิทธิ์เท่านั้น · CREATE / GENERATE / IMPORT / DISPATCH / EXPORT CSV จำกัด System Admin ใน Prototype');
        return;
    }
    try {
        accounts = model.load(localStorage.getItem(storageKey), NT_DATA, page.catalog, page.sites);
        page.replaceAccounts(accounts);
        status('Account Draft อยู่เฉพาะ Browser นี้ · ไม่ DISPATCH = ใช้ได้ทุก Site ที่มี Package · DISPATCH = จำกัดเฉพาะ Site ที่กำหนด');
    } catch (e) { lock(e.message); }
    q('#radius-account-create').addEventListener('click', event => openCreate(event.currentTarget));
    q('#radius-account-generate').addEventListener('click', event => openGenerate(event.currentTarget));
    q('#radius-account-dispatch').addEventListener('click', event => openDispatch(event.currentTarget));
    q('#radius-account-export').addEventListener('click', exportCsv);
    q('#radius-account-import').addEventListener('click', () => { if (writable) q('#radius-account-import-file').click(); });
    q('#radius-account-import-file').addEventListener('change', event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
        if (!file || !writable) return;
        if (file.size > 2 * 1024 * 1024) { NT.toast('CSV ใหญ่เกิน 2 MB สำหรับ Prototype'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = parseCsv(String(reader.result || ''));
                const saved = model.importRows(accounts, imported, page.catalog, page.sites);
                commit(saved.rows, 'IMPORT สำเร็จ ' + saved.created.length.toLocaleString('en-US') + ' Account');
                NT.toast('IMPORT Account สำเร็จ');
            } catch (e) { status('IMPORT ไม่สำเร็จ: ' + e.message); NT.toast(e.message); }
        };
        reader.onerror = () => { status('IMPORT ไม่สำเร็จ: Browser อ่านไฟล์ไม่ได้'); NT.toast('อ่าน CSV ไม่สำเร็จ'); };
        reader.readAsText(file, 'utf-8');
    });
    createForm.addEventListener('submit', event => {
        event.preventDefault(); if (!writable) return;
        try {
            const saved = model.create(accounts, { username: q('#radius-account-create-username').value, packageId: q('#radius-account-create-package').value, status: q('#radius-account-create-status').value, dispatchSiteId: null }, page.catalog, page.sites);
            commit(saved.rows, 'CREATE Account "' + saved.record.username + '" สำเร็จ'); createDialog.close(); NT.toast('CREATE Account แล้ว');
        } catch (e) { error('create', e.message); }
    });
    generateForm.addEventListener('submit', event => {
        event.preventDefault(); if (!writable) return;
        try {
            const saved = model.generate(accounts, { packageId: q('#radius-account-generate-package').value, count: q('#radius-account-generate-count').value, status: q('#radius-account-generate-status').value }, page.catalog, page.sites);
            commit(saved.rows, 'GENERATE สำเร็จ ' + saved.created.length.toLocaleString('en-US') + ' Account'); generateDialog.close(); NT.toast('GENERATE Account แล้ว');
        } catch (e) { error('generate', e.message); }
    });
    dispatchForm.addEventListener('submit', event => {
        event.preventDefault(); if (!writable) return;
        const siteId = q('#radius-account-dispatch-site').value;
        if (siteId === '__choose__') { error('dispatch', 'เลือก Site หรือ “ไม่ DISPATCH”'); return; }
        try {
            const ids = page.getSelectedAccountIds();
            const next = model.dispatch(accounts, ids, siteId, page.catalog, page.sites);
            const site = siteId ? page.sites.find(row => row.id === siteId) : null;
            commit(next, site ? 'DISPATCH ' + ids.length.toLocaleString('en-US') + ' Account ไป ' + site.name : 'ยกเลิก DISPATCH ' + ids.length.toLocaleString('en-US') + ' Account');
            page.clearAccountSelection(); dispatchDialog.close(); NT.toast(site ? 'DISPATCH Account แล้ว' : 'ยกเลิก DISPATCH แล้ว');
        } catch (e) { error('dispatch', e.message); }
    });
    for (const [kind, dialog, form] of [['create', createDialog, createForm], ['generate', generateDialog, generateForm], ['dispatch', dispatchDialog, dispatchForm]]) {
        q('#radius-account-' + kind + '-close').addEventListener('click', () => dialog.close());
        q('#radius-account-' + kind + '-cancel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => { form.reset(); error(kind); opener?.focus(); opener = null; });
    }
})();
