(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc, currentPortalId, state, can } = NT, path = q('#wt-config-path');
    function controls() {
        const pending = path.value !== currentPortalId;
        q('#wt-config-selection-hint').textContent = pending ? 'กด “เลือก Config นี้” เพื่อเปิด Portal Path ที่เลือก' : 'กำลังใช้งาน Config ของ Portal Path นี้';
        q('#nt-import-config').disabled = pending || !can('editSite'); q('#nt-reset-config').disabled = pending || !can('editSite'); q('#nt-export-config').disabled = pending || !can('export'); q('#wt-select-config').disabled = !path.value;
    }
    function refresh() {
        const rows = NT.portalPathChoices(); path.innerHTML = rows.map(c => '<option value="' + esc(c.id) + '">' + esc(c.path) + '</option>').join(''); path.value = currentPortalId;
        q('#wt-config-active-name').textContent = state.name; q('#wt-config-active-path').textContent = state.path;
        const visible = NT.bindings().siteIds.filter(id => NT.allowedIds().includes(id));
        q('#wt-config-assigned-sites').textContent = 'Site ที่ผูกใน Path นี้: ' + visible.map(NT.siteName).join(', ') + (visible.length < NT.bindings().siteIds.length ? ' · มี Site อื่นนอกสิทธิ์' : '');
        controls();
    }
    path.addEventListener('change', controls);
    q('#wt-select-config').addEventListener('click', () => {
        try { if (path.value !== currentPortalId) NT.choosePortalPath(path.value); else NT.toast('เลือก Config: ' + state.path); } catch (e) { NT.toast(e.message); }
    });
    NT.onLoad(refresh); refresh();
})();
