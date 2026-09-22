(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc } = NT, allowed = NT.allowedIds(), sites = NT_DATA['radius-sites'].sites.filter(s => allowed.includes(s.id)).map(s => JSON.parse(JSON.stringify(s))), catalog = NT_DATA['radius-packages'].packages.map(p => ({ ...p }));
    const allowEntries = site => Array.isArray(site.allowPackages) ? site.allowPackages : [];
    const allowedPackageIds = new Set(sites.flatMap(s => allowEntries(s).map(entry => entry.packageId)));
    const rows = NT.can('system') ? catalog : catalog.filter(p => allowedPackageIds.has(p.id));
    const fields = [['policyName', 'ชื่อ Policy'], ['userPrefix', 'User Prefix'], ['usernameFormat', 'Username format'], ['packageExpired', 'Package Expired'], ['packageType', 'Package Type'], ['upload', 'Upload'], ['download', 'Download'], ['sessionTime', 'Session Time'], ['sessionLimit', 'Session Limit'], ['idleTimeout', 'Idle Timeout'], ['time', 'Time (hours:minutes)'], ['dailyTime', 'Daily time (hours:minutes)'], ['weeklyTime', 'Weekly time (hours:minutes)'], ['monthlyTime', 'Monthly time (hours:minutes)'], ['expiration', 'Expiration'], ['expirationDate', 'Expiration Date'], ['expirationDays', 'Days (from 1st Login)'], ['price', 'Price'], ['description', 'Description'], ['status', 'Status'], ['createdAt', 'Created Date']];
    const requested = new URLSearchParams(location.search); let selectedSite = sites.find(s => s.id === requested.get('site'))?.id || sites.find(s => s.id === NT.currentSite)?.id || sites[0]?.id;
    const display = value => esc(value === null || value === undefined || value === '' ? '—' : value);
    function tab(name) { for (const key of ['nas', 'packages', 'sites']) { q('#radius-tab-' + key).classList.toggle('active', key === name); q('#radius-tab-' + key).setAttribute('aria-selected', String(key === name)); q('#radius-panel-' + key).hidden = key !== name; } }
    q('#radius-tab-sites').addEventListener('click', () => tab('sites')); q('#radius-tab-packages').addEventListener('click', () => tab('packages')); q('#radius-tab-nas').addEventListener('click', () => tab('nas'));
    function renderSites() {
        const search = q('#radius-site-search').value.trim().toLowerCase();
        const filtered = sites.filter(s => [s.name, s.vlanId, s.location, s.description].some(value => String(value ?? '').toLowerCase().includes(search)));
        q('#radius-site-count').textContent = filtered.length + ' / ' + sites.length + ' Site';
        q('#radius-site-rows').innerHTML = filtered.length ? filtered.map(s => '<tr' + (s.id === selectedSite ? ' class="wt-radius-selected"' : '') + '><td>' + esc(s.name) + '</td><td>' + display(s.vlanId) + '</td><td>' + display(s.location) + '</td><td>' + display(s.concurrent) + '</td><td>' + display(s.description) + '</td><td><button type="button" class="nt-button nt-compact" data-radius-site="' + esc(s.id) + '" aria-haspopup="dialog" aria-controls="radius-allow-panel" aria-label="ดู Allow Package ของ ' + esc(s.name) + '">ดู Allow Package</button></td>' + (NT.can('system') ? '<td><div class="wt-nas-row-actions"><button type="button" class="nt-button nt-compact" data-site-edit="' + esc(s.id) + '">แก้ไข</button><button type="button" class="nt-button nt-compact wt-nas-delete" data-site-delete="' + esc(s.id) + '">ลบ</button></div></td>' : '<td>—</td>') + '</tr>').join('') : '<tr><td colspan="7">ไม่พบ Site ในขอบเขตสิทธิ์หรือคำค้นนี้</td></tr>';
    }
    function renderAllow() {
        const site = sites.find(s => s.id === selectedSite); q('#radius-allow-title').textContent = 'Allow Package' + (site ? ' · ' + site.name : '');
        if (!site || !Array.isArray(site.allowPackages)) { q('#radius-allow-rows').innerHTML = '<tr><td colspan="3">ยังไม่มีข้อมูล Allow Package</td></tr>'; return; }
        q('#radius-allow-rows').innerHTML = site.allowPackages.length ? site.allowPackages.map(entry => { const p = catalog.find(p => p.id === entry.packageId); return '<tr><td>' + (p ? '<button type="button" class="wt-radius-package-link" data-radius-package="' + esc(p.id) + '">' + esc(p.policyName) + '</button>' : 'ไม่พบชื่อ Package ในข้อมูลปัจจุบัน') + '</td><td>' + display(entry.prefix) + '</td><td>' + display(entry.limit) + '</td></tr>'; }).join('') : '<tr><td colspan="3">ยังไม่มี Allow Package ของ Site นี้</td></tr>';
    }
    function createdLabel(iso) {
        if (!iso) return '—';
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('th-TH-u-ca-gregory', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) + ' ICT';
    }
    function renderPackageRows() {
        const chosen = q('#radius-package').value;
        q('#radius-package-rows').innerHTML = rows.length ? rows.map(p =>
            '<tr' + (p.id === chosen ? ' class="wt-radius-selected"' : '') + '><td>' + display(p.status) + '</td><td><button type="button" class="wt-radius-package-link" data-package-select="' + esc(p.id) + '" aria-label="แสดงรายละเอียด Package ' + esc(p.policyName) + '">' + esc(p.policyName) + '</button></td><td>' + display(p.userPrefix) + '</td><td>' + esc(createdLabel(p.createdAt)) + '</td></tr>'
        ).join('') : '<tr><td colspan="4">ไม่มี Package ในขอบเขตสิทธิ์</td></tr>';
    }
    function renderPackage() {
        const p = rows.find(p => p.id === q('#radius-package').value);
        renderPackageRows();
        if (!p) { q('#radius-fields').textContent = 'ไม่มี Package ในขอบเขตสิทธิ์'; q('#radius-sites').textContent = '—'; return; }
        q('#radius-fields').innerHTML = fields.map(([key, label]) => '<dl><dt>' + esc(label) + '</dt><dd>' + (key === 'createdAt' ? esc(createdLabel(p.createdAt)) : display(p[key])) + (['time', 'dailyTime', 'weeklyTime', 'monthlyTime'].includes(key) && ['00:00', '0', '0:00'].includes(String(p[key])) ? ' · ไม่จำกัด' : '') + '</dd></dl>').join('');
        q('#radius-sites').textContent = sites.filter(s => allowEntries(s).some(entry => entry.packageId === p.id)).map(s => s.name).join(', ') || 'ไม่มี Site ในขอบเขตสิทธิ์ที่กำหนด Package นี้ใน Allow Package';
    }
    q('#radius-package').innerHTML = rows.map(p => '<option value="' + esc(p.id) + '">' + esc(p.policyName) + '</option>').join('');
    if (rows.some(p => p.id === requested.get('package'))) q('#radius-package').value = requested.get('package');
    q('#radius-package-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-package-select]');
        if (!button || !rows.some(p => p.id === button.dataset.packageSelect)) return;
        q('#radius-package').value = button.dataset.packageSelect; renderPackage();
    });
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
    window.WiFiRadiusPage = { sites, catalog, renderSites, renderAllow, renderPackage, selectSite(id) { selectedSite = id; }, selectPackage(id) { q('#radius-package').value = id; }, refresh() { q('#radius-package').innerHTML = rows.map(p => '<option value="' + esc(p.id) + '">' + esc(p.policyName) + '</option>').join(''); if (!sites.some(s => s.id === selectedSite)) selectedSite = sites[0]?.id; renderSites(); renderAllow(); renderPackage(); } };
    renderSites(); renderAllow(); renderPackage(); tab(rows.some(p => p.id === requested.get('package')) ? 'packages' : 'nas');
})();
