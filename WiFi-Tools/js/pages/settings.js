(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc, currentSite, currentPortalId, state, can, allowedSites, siteName } = NT, site = q('#wt-config-site'), path = q('#wt-config-path');
    function controls() {
        const pending = site.value !== currentSite || path.value !== currentPortalId;
        q('#wt-config-selection-hint').textContent = pending ? 'กด “เลือก Config นี้” เพื่อเปิด Portal ของ Site / Path ที่เลือก' : 'เลือก Config แล้ว · Portal ที่ใช้หลาย Site จะเปิด Config ชุดเดียวกัน';
        q('#nt-import-config').disabled = pending || !can('editSite'); q('#nt-reset-config').disabled = pending || !can('editSite'); q('#nt-export-config').disabled = pending || !can('export'); q('#wt-select-config').disabled = !path.value;
    }
    function fillPaths(preferred) {
        const rows = NT.portalChoices(site.value); path.innerHTML = rows.map(c => '<option value="' + esc(c.id) + '">' + esc(c.path) + ' · ' + esc(c.name) + '</option>').join('');
        if (rows.some(c => c.id === preferred)) path.value = preferred; controls();
    }
    function refresh() {
        site.innerHTML = allowedSites().map(s => '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>').join(''); site.value = currentSite;
        q('#wt-config-active-site').textContent = siteName(currentSite) + ' · ' + state.name; q('#wt-config-active-path').textContent = state.path; fillPaths(currentPortalId);
    }
    site.addEventListener('change', () => fillPaths(NT.db.portalSelections[site.value] || site.value)); path.addEventListener('change', controls);
    q('#wt-select-config').addEventListener('click', () => {
        try { if (site.value !== currentSite || path.value !== currentPortalId) NT.choosePortal(site.value, path.value); else NT.toast('เลือก Config: ' + state.name + ' · ' + state.path); } catch (e) { NT.toast(e.message); }
    });
    NT.onLoad(refresh); refresh();
})();
