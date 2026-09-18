(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc } = NT, allowed = NT.allowedIds(), sites = NT_DATA['radius-sites'].sites.filter(s => allowed.includes(s.id)), catalog = NT_DATA['radius-packages'].packages;
    const allowEntries = site => Array.isArray(site.allowPackages) ? site.allowPackages : [];
    const allowedPackageIds = new Set(sites.flatMap(s => allowEntries(s).map(entry => entry.packageId)));
    const rows = NT.can('system') ? catalog : catalog.filter(p => allowedPackageIds.has(p.id));
    const fields = [['policyName', 'ชื่อ Policy'], ['userPrefix', 'User Prefix'], ['usernameFormat', 'Username format'], ['packageExpired', 'Package Expired'], ['packageType', 'Package Type'], ['upload', 'Upload'], ['download', 'Download'], ['sessionTime', 'Session Time'], ['sessionLimit', 'Session Limit'], ['idleTimeout', 'Idle Timeout'], ['time', 'Time (hours:minutes)'], ['dailyTime', 'Daily time (hours:minutes)'], ['weeklyTime', 'Weekly time (hours:minutes)'], ['monthlyTime', 'Monthly time (hours:minutes)'], ['expiration', 'Expiration'], ['price', 'Price'], ['description', 'Description'], ['status', 'Status']];
    const requested = new URLSearchParams(location.search); let selectedSite = sites.find(s => s.id === requested.get('site'))?.id || sites.find(s => s.id === NT.currentSite)?.id || sites[0]?.id;
    const display = value => esc(value === null || value === undefined || value === '' ? '—' : value);
    function tab(name) { for (const key of ['sites', 'packages']) { q('#radius-tab-' + key).classList.toggle('active', key === name); q('#radius-tab-' + key).setAttribute('aria-selected', String(key === name)); q('#radius-panel-' + key).hidden = key !== name; } }
    q('#radius-tab-sites').addEventListener('click', () => tab('sites')); q('#radius-tab-packages').addEventListener('click', () => tab('packages'));
    function renderSites() {
        const search = q('#radius-site-search').value.trim().toLowerCase();
        const filtered = sites.filter(s => [s.name, s.vlanId, s.location, s.description].some(value => String(value ?? '').toLowerCase().includes(search)));
        q('#radius-site-count').textContent = filtered.length + ' / ' + sites.length + ' Site';
        q('#radius-site-rows').innerHTML = filtered.length ? filtered.map(s => '<tr' + (s.id === selectedSite ? ' class="wt-radius-selected"' : '') + '><td>' + esc(s.name) + '</td><td>' + display(s.vlanId) + '</td><td>' + display(s.location) + '</td><td>' + display(s.concurrent) + '</td><td>' + display(s.description) + '</td><td><button type="button" class="nt-button nt-compact" data-radius-site="' + esc(s.id) + '" aria-haspopup="dialog" aria-controls="radius-allow-panel" aria-label="ดู Allow Package ของ ' + esc(s.name) + '">ดู Allow Package</button></td></tr>').join('') : '<tr><td colspan="6">ไม่พบ Site ในขอบเขตสิทธิ์หรือคำค้นนี้</td></tr>';
    }
    function renderAllow() {
        const site = sites.find(s => s.id === selectedSite); q('#radius-allow-title').textContent = 'Allow Package' + (site ? ' · ' + site.name : '');
        if (!site || !Array.isArray(site.allowPackages)) { q('#radius-allow-rows').innerHTML = '<tr><td colspan="3">ยังไม่มีข้อมูล Allow Package</td></tr>'; return; }
        q('#radius-allow-rows').innerHTML = site.allowPackages.length ? site.allowPackages.map(entry => { const p = catalog.find(p => p.id === entry.packageId); return '<tr><td>' + (p ? '<button type="button" class="wt-radius-package-link" data-radius-package="' + esc(p.id) + '">' + esc(p.policyName) + '</button>' : 'ไม่พบชื่อ Package ในข้อมูลปัจจุบัน') + '</td><td>' + display(entry.prefix) + '</td><td>' + display(entry.limit) + '</td></tr>'; }).join('') : '<tr><td colspan="3">ยังไม่มี Allow Package ของ Site นี้</td></tr>';
    }
    function renderPackage() {
        const p = rows.find(p => p.id === q('#radius-package').value);
        if (!p) { q('#radius-fields').textContent = 'ไม่มี Package ในขอบเขตสิทธิ์'; q('#radius-sites').textContent = '—'; return; }
        q('#radius-fields').innerHTML = fields.map(([key, label]) => '<dl><dt>' + esc(label) + '</dt><dd>' + display(p[key]) + (['time', 'dailyTime', 'weeklyTime', 'monthlyTime'].includes(key) && ['00:00', '0', '0:00'].includes(String(p[key])) ? ' · ไม่จำกัด' : '') + '</dd></dl>').join('');
        q('#radius-sites').textContent = sites.filter(s => allowEntries(s).some(entry => entry.packageId === p.id)).map(s => s.name).join(', ') || 'ไม่มี Site ในขอบเขตสิทธิ์ที่กำหนด Package นี้ใน Allow Package';
    }
    q('#radius-package').innerHTML = rows.map(p => '<option value="' + esc(p.id) + '">' + esc(p.policyName) + '</option>').join('');
    if (rows.some(p => p.id === requested.get('package'))) q('#radius-package').value = requested.get('package');
    q('#radius-package').addEventListener('change', renderPackage); q('#radius-site-search').addEventListener('input', renderSites);
    const dialog = q('#radius-allow-panel'); let opener = null;
    q('#radius-allow-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (!q('#radius-panel-sites').hidden) opener?.focus(); });
    q('#radius-site-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-radius-site]'); if (!button || !sites.some(s => s.id === button.dataset.radiusSite)) return;
        selectedSite = button.dataset.radiusSite; opener = button; renderAllow();
        if (!dialog.open) dialog.showModal();
    });
    q('#radius-allow-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-radius-package]');
        const site = sites.find(s => s.id === selectedSite);
        if (!button || !site || !allowEntries(site).some(entry => entry.packageId === button.dataset.radiusPackage) || !rows.some(p => p.id === button.dataset.radiusPackage)) return;
        q('#radius-package').value = button.dataset.radiusPackage; renderPackage(); tab('packages'); dialog.close();
        q('#radius-package').scrollIntoView({ block: 'center' }); q('#radius-package').focus();
    });
    renderSites(); renderAllow(); renderPackage(); if (rows.some(p => p.id === requested.get('package'))) tab('packages');
})();
