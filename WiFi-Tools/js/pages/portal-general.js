(function () {
    'use strict'; if (!window.NT) return;
    const { q, qa, esc, can, siteName, currentSite, currentPortalId } = NT, B = WiFiPortalBindings, catalog = NT_DATA['radius-packages'].packages, sites = NT_DATA['radius-sites'].sites;
    function selector() { const rows = NT.portalChoices(currentSite); q('#wt-portal-selector').innerHTML = rows.map(c => '<option value="' + esc(c.id) + '">' + esc(c.name) + ' · ' + esc(c.path) + '</option>').join(''); q('#wt-portal-selector').value = currentPortalId; q('#wt-portal-selector-field').hidden = true; }
    function render() {
        selector();
        const binding = NT.bindings(), allowed = NT.allowedIds(), editable = can('editSite');
        q('#wt-portal-sites').innerHTML = NT.allowedSites().map(s => '<label class="wt-portal-choice"><input type="checkbox" data-portal-site="' + esc(s.id) + '"' + (binding.siteIds.includes(s.id) ? ' checked' : '') + (!editable || s.id === NT.currentPortalOwnerSiteId || s.id === currentSite ? ' disabled' : '') + '><span><strong>' + esc(s.name) + '</strong>' + (s.id === NT.currentPortalOwnerSiteId ? '<small>Site เจ้าของ Config</small>' : s.id === currentSite ? '<small>Site ที่กำลังเปิด Config</small>' : '') + '</span></label>').join('');
        const rows = B.coverage(binding, sites, catalog).filter(row => allowed.includes(row.siteId));
        q('#wt-portal-allow-packages').innerHTML = rows.map(row => {
            const names = row.packageIds.map(id => catalog.find(p => p.id === id).policyName);
            let content = names.length ? '<ul class="wt-policy-names">' + names.map(name => '<li>' + esc(name) + '</li>').join('') + '</ul>' : '';
            if (!row.loaded) content += '<p class="nt-help">ยังไม่มีข้อมูล Allow Package ของ Site นี้</p>';
            else if (!names.length && !row.missingPackageIds.length) content += '<p class="nt-help">ยังไม่มี Allow Package</p>';
            if (row.missingPackageIds.length) content += '<p class="nt-help">ข้อมูลชื่อ Package ยังไม่ครบ</p>';
            return '<section class="wt-allow-site"><h4>' + esc(siteName(row.siteId)) + '</h4>' + content + '</section>';
        }).join('');
        q('#wt-portal-binding-count').textContent = 'เลือก ' + rows.length + ' Site';
        q('#wt-portal-binding-lock').hidden = B.canManage(binding, allowed);
    }
    q('#wt-portal-sites').addEventListener('change', () => {
        if (!can('editSite')) return render();
        const siteIds = qa('[data-portal-site]:checked').map(e => e.dataset.portalSite);
        try { NT.setBindings({ siteIds }); q('#wt-portal-binding-message').textContent = 'อัปเดต Site และชื่อ Policy / Package จาก Allow Package แล้ว'; } catch (e) { NT.toast(e.message); } render();
    });
    q('#wt-portal-selector').addEventListener('change', e => { try { NT.choosePortal(currentSite, e.target.value); } catch (error) { NT.toast(error.message); } });
    NT.onChange(selector); NT.onLoad(render); render();
})();
