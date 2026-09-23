(function () {
    'use strict';
    if (!window.NT) return;
    const { q, esc } = NT;
    const allowed = NT.allowedIds();
    const admin = NT.can('system');
    const sites = NT_DATA['radius-sites'].sites.filter(s => allowed.includes(s.id)).map(s => JSON.parse(JSON.stringify(s)));
    const catalog = NT_DATA['radius-packages'].packages.map(p => ({ ...p }));
    const allSourceAccounts = (NT_DATA['radius-accounts']?.accounts || []).map(a => ({ dispatchSiteId: null, ...a }));
    const allowEntries = site => Array.isArray(site.allowPackages) ? site.allowPackages : [];
    const allowedPackageIds = new Set(sites.flatMap(s => allowEntries(s).map(entry => entry.packageId)));
    const rows = admin ? catalog : catalog.filter(p => allowedPackageIds.has(p.id));
    const sourceForUser = admin ? allSourceAccounts : allSourceAccounts.filter(account => {
        if (!allowedPackageIds.has(account.packageId)) return false;
        return !account.dispatchSiteId || allowed.includes(account.dispatchSiteId);
    });
    const accountRows = sourceForUser.map(row => ({ ...row }));
    const fields = [['policyName', 'ชื่อ Policy'], ['userPrefix', 'User Prefix'], ['usernameFormat', 'Username format'], ['packageExpired', 'Package Expired'], ['packageType', 'Package Type'], ['upload', 'Upload'], ['download', 'Download'], ['sessionTime', 'Session Time'], ['sessionLimit', 'Session Limit'], ['idleTimeout', 'Idle Timeout'], ['time', 'Time (hours:minutes)'], ['dailyTime', 'Daily time (hours:minutes)'], ['weeklyTime', 'Weekly time (hours:minutes)'], ['monthlyTime', 'Monthly time (hours:minutes)'], ['expiration', 'Expiration'], ['expirationDate', 'Expiration Date'], ['expirationDays', 'Days (from 1st Login)'], ['price', 'Price'], ['description', 'Description'], ['status', 'Status'], ['createdAt', 'Created Date']];
    const requested = new URLSearchParams(location.search);
    let selectedSite = sites.find(s => s.id === requested.get('site'))?.id || sites.find(s => s.id === NT.currentSite)?.id || sites[0]?.id;
    let accountFilter = null; // { packageIds:Set<string>, label:string, siteId?:string }
    let packageSearchTerm = '';
    let visibleAccounts = [];
    const selectedAccounts = new Set();
    const accountDetailDialog = q('#radius-account-detail-dialog');
    let accountDetailOpener = null;
    let currentAccountDetailId = null;
    const display = value => esc(value === null || value === undefined || value === '' ? '—' : value);
    const unlimitedFields = new Set(window.WiFiRadiusCatalog?.unlimitedFields || ['upload', 'download', 'sessionTime', 'sessionLimit', 'idleTimeout', 'time', 'dailyTime', 'weeklyTime', 'monthlyTime']);
    const isUnlimitedValue = value => window.WiFiRadiusCatalog?.isUnlimitedValue ? window.WiFiRadiusCatalog.isUnlimitedValue(value) : String(value ?? '').trim() === '' || /^0+(?::0+){0,2}$/.test(String(value ?? '').trim());
    const displayPackageValue = (key, value) => unlimitedFields.has(key) && isUnlimitedValue(value) ? 'Unlimited' : (value === null || value === undefined || value === '' ? '—' : String(value));
    const packageById = id => catalog.find(p => p.id === id);
    const siteById = id => sites.find(s => s.id === id);
    function accountUsableAtSite(account, site) {
        return !!site && allowEntries(site).some(entry => entry.packageId === account.packageId) && (!account.dispatchSiteId || account.dispatchSiteId === site.id);
    }
    const accountCount = packageId => accountRows.reduce((sum, account) => sum + (account.packageId === packageId ? 1 : 0), 0);
    function siteAccountSummary(site) {
        const entries = allowEntries(site).map(entry => {
            const pkg = packageById(entry.packageId);
            const count = accountRows.reduce((sum, account) => sum + (account.packageId === entry.packageId && accountUsableAtSite(account, site) ? 1 : 0), 0);
            return { packageId: entry.packageId, name: pkg?.policyName || ('ไม่พบ Package (' + entry.packageId + ')'), count };
        });
        return { total: entries.reduce((sum, row) => sum + row.count, 0), entries };
    }
    function tab(name) {
        for (const key of ['nas', 'account', 'packages', 'sites']) {
            q('#radius-tab-' + key).classList.toggle('active', key === name);
            q('#radius-tab-' + key).setAttribute('aria-selected', String(key === name));
            q('#radius-panel-' + key).hidden = key !== name;
        }
    }
    q('#radius-tab-sites').addEventListener('click', () => tab('sites'));
    q('#radius-tab-packages').addEventListener('click', () => tab('packages'));
    q('#radius-tab-account').addEventListener('click', () => tab('account'));
    q('#radius-tab-nas').addEventListener('click', () => tab('nas'));
    function renderSites() {
        const search = q('#radius-site-search').value.trim().toLowerCase();
        const filtered = sites.filter(s => [s.name, s.vlanId, s.location, s.description].some(value => String(value ?? '').toLowerCase().includes(search)));
        q('#radius-site-count').textContent = filtered.length + ' / ' + sites.length + ' Site';
        q('#radius-site-rows').innerHTML = filtered.length ? filtered.map(s => {
            const summary = siteAccountSummary(s);
            return '<tr' + (s.id === selectedSite ? ' class="wt-radius-selected"' : '') + '><td>' + esc(s.name) + '</td><td>' + display(s.vlanId) + '</td><td>' + display(s.location) + '</td><td>' + display(s.concurrent) + '</td><td>' + display(s.description) + '</td><td><button type="button" class="nt-button nt-compact" data-radius-site="' + esc(s.id) + '" aria-haspopup="dialog" aria-controls="radius-allow-panel" aria-label="ดู Allow Package ของ ' + esc(s.name) + '">ดู Allow Package</button></td><td class="wt-account-number"><button type="button" class="wt-account-count-link" data-account-site="' + esc(s.id) + '" aria-label="ดู ' + summary.total.toLocaleString('en-US') + ' Account ของ Site ' + esc(s.name) + '">' + summary.total.toLocaleString('en-US') + '</button></td>' + (admin ? '<td><div class="wt-nas-row-actions"><button type="button" class="nt-button nt-compact" data-site-edit="' + esc(s.id) + '">แก้ไข</button><button type="button" class="nt-button nt-compact wt-nas-delete" data-site-delete="' + esc(s.id) + '">ลบ</button></div></td>' : '<td>—</td>') + '</tr>';
        }).join('') : '<tr><td colspan="8">ไม่พบ Site ในขอบเขตสิทธิ์หรือคำค้นนี้</td></tr>';
    }
    function renderAccounts() {
        const search = q('#radius-account-search').value.trim().toLowerCase();
        const site = accountFilter?.siteId ? siteById(accountFilter.siteId) : null;
        const scoped = accountFilter ? accountRows.filter(account => accountFilter.packageIds.has(account.packageId) && (!site || accountUsableAtSite(account, site))) : accountRows;
        visibleAccounts = scoped.filter(account => {
            const pkg = packageById(account.packageId);
            const dispatchSite = account.dispatchSiteId ? siteById(account.dispatchSiteId) : null;
            const dispatchLabel = account.dispatchSiteId ? (dispatchSite?.name || account.dispatchSiteId) : 'ทุก Site ที่มี Package';
            return [account.username, pkg?.policyName, account.status, dispatchLabel].some(value => String(value ?? '').toLowerCase().includes(search));
        });
        const filterBox = q('#radius-account-filter');
        filterBox.hidden = !accountFilter;
        q('#radius-account-filter-label').textContent = accountFilter ? 'กำลังดู Account: ' + accountFilter.label : '';
        const breakdownBox = q('#radius-account-breakdown');
        const breakdownRows = q('#radius-account-breakdown-rows');
        if (site) {
            const summary = siteAccountSummary(site);
            breakdownBox.hidden = false;
            q('#radius-account-breakdown-title').textContent = 'Account ตาม Package · ' + site.name;
            breakdownRows.innerHTML = summary.entries.length ? summary.entries.map(row => '<button type="button" class="wt-account-breakdown-item" data-account-breakdown-package="' + esc(row.packageId) + '"><span>' + esc(row.name) + '</span><strong>' + row.count.toLocaleString('en-US') + '</strong></button>').join('') : '<span class="nt-help">Site นี้ยังไม่มี Package</span>';
        } else {
            breakdownBox.hidden = true;
            breakdownRows.innerHTML = '';
        }
        q('#radius-account-count').textContent = visibleAccounts.length + ' / ' + scoped.length + ' Account';
        q('#radius-account-rows').innerHTML = visibleAccounts.length ? visibleAccounts.map(account => {
            const pkg = packageById(account.packageId);
            const dispatchSite = account.dispatchSiteId ? siteById(account.dispatchSiteId) : null;
            const dispatchLabel = account.dispatchSiteId ? (dispatchSite?.name || ('ไม่พบ Site (' + account.dispatchSiteId + ')')) : 'ทุก Site ที่มี Package';
            const checked = selectedAccounts.has(account.id) ? ' checked' : '';
            const selectCell = admin ? '<input type="checkbox" data-account-select="' + esc(account.id) + '" aria-label="เลือก Account ' + esc(account.username) + '"' + checked + '>' : '—';
            return '<tr><td class="wt-account-select">' + selectCell + '</td><td><button type="button" class="wt-account-detail-link" data-account-detail="' + esc(account.id) + '" aria-haspopup="dialog" aria-controls="radius-account-detail-dialog" aria-label="ดูรายละเอียด Account ' + esc(account.username) + '">' + display(account.username) + '</button></td><td>' + display(pkg?.policyName || ('ไม่พบ Package (' + account.packageId + ')')) + '</td><td>' + display(account.status) + '</td><td>' + display(dispatchLabel) + '</td></tr>';
        }).join('') : '<tr><td colspan="5">ไม่พบ Account ในขอบเขตสิทธิ์หรือคำค้นนี้</td></tr>';
        const selectAll = q('#radius-account-select-all');
        selectAll.disabled = !admin || visibleAccounts.length === 0;
        selectAll.checked = visibleAccounts.length > 0 && visibleAccounts.every(row => selectedAccounts.has(row.id));
        selectAll.indeterminate = visibleAccounts.some(row => selectedAccounts.has(row.id)) && !selectAll.checked;
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
    function packageMatchesSearch(p) {
        if (!packageSearchTerm) return true;
        return [p.policyName, p.userPrefix].some(value => String(value ?? '').toLowerCase().includes(packageSearchTerm));
    }
    function renderPackageRows() {
        const chosen = q('#radius-package').value;
        const filtered = rows.filter(packageMatchesSearch);
        q('#radius-package-count').textContent = filtered.length + ' / ' + rows.length + ' Package';
        q('#radius-package-rows').innerHTML = filtered.length ? filtered.map(p =>
            '<tr' + (p.id === chosen ? ' class="wt-radius-selected"' : '') + '><td>' + display(p.status) + '</td><td><button type="button" class="wt-radius-package-link" data-package-select="' + esc(p.id) + '" aria-label="แสดงรายละเอียด Package ' + esc(p.policyName) + '">' + esc(p.policyName) + '</button></td><td>' + display(p.userPrefix) + '</td><td class="wt-account-number"><button type="button" class="wt-account-count-link" data-account-package="' + esc(p.id) + '" aria-label="ดู ' + accountCount(p.id).toLocaleString('en-US') + ' Account ของ Package ' + esc(p.policyName) + '">' + accountCount(p.id).toLocaleString('en-US') + '</button></td><td>' + esc(createdLabel(p.createdAt)) + '</td></tr>'
        ).join('') : '<tr><td colspan="5">' + (rows.length ? 'ไม่พบ Package ตามคำค้น' : 'ไม่มี Package ในขอบเขตสิทธิ์') + '</td></tr>';
    }
    function renderPackage() {
        const p = rows.find(p => p.id === q('#radius-package').value);
        renderPackageRows();
        if (!p) { q('#radius-fields').textContent = 'ไม่มี Package ในขอบเขตสิทธิ์'; q('#radius-sites').textContent = '—'; return; }
        q('#radius-fields').innerHTML = fields.map(([key, label]) => '<dl><dt>' + esc(label) + '</dt><dd>' + (key === 'createdAt' ? esc(createdLabel(p.createdAt)) : esc(displayPackageValue(key, p[key]))) + '</dd></dl>').join('') + '<dl><dt>Accounts</dt><dd>' + accountCount(p.id).toLocaleString('en-US') + '</dd></dl>';
        q('#radius-sites').textContent = sites.filter(s => allowEntries(s).some(entry => entry.packageId === p.id)).map(s => s.name).join(', ') || 'ไม่มี Site ในขอบเขตสิทธิ์ที่กำหนด Package นี้ใน Allow Package';
    }
    q('#radius-package').innerHTML = rows.map(p => '<option value="' + esc(p.id) + '">' + esc(p.policyName) + '</option>').join('');
    if (rows.some(p => p.id === requested.get('package'))) q('#radius-package').value = requested.get('package');
    q('#radius-package-search-form').addEventListener('submit', event => {
        event.preventDefault();
        packageSearchTerm = q('#radius-package-search').value.trim().toLowerCase();
        renderPackageRows();
    });
    q('#radius-package-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-package-select]');
        if (!button || !rows.some(p => p.id === button.dataset.packageSelect)) return;
        q('#radius-package').value = button.dataset.packageSelect; renderPackage();
    });
    function showAccountsForPackages(packageIds, label, options = {}) {
        const ids = new Set(packageIds.filter(id => rows.some(p => p.id === id)));
        accountFilter = { packageIds: ids, label, siteId: options.siteId || null };
        q('#radius-account-search').value = '';
        renderAccounts(); tab('account');
        q('#radius-account-search').focus();
    }
    q('#radius-package-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-account-package]');
        const pkg = button && packageById(button.dataset.accountPackage);
        if (!pkg || !rows.some(row => row.id === pkg.id)) return;
        showAccountsForPackages([pkg.id], 'Package · ' + pkg.policyName);
    });
    q('#radius-site-rows').addEventListener('click', event => {
        const siteButton = event.target.closest('[data-account-site]');
        if (!siteButton) return;
        const site = sites.find(row => row.id === siteButton.dataset.accountSite);
        if (!site) return;
        showAccountsForPackages(allowEntries(site).map(row => row.packageId), 'Site · ' + site.name, { siteId: site.id });
    });
    q('#radius-account-breakdown-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-account-breakdown-package]');
        const pkg = button && packageById(button.dataset.accountBreakdownPackage);
        if (!pkg || !rows.some(row => row.id === pkg.id)) return;
        showAccountsForPackages([pkg.id], 'Package · ' + pkg.policyName);
    });
    q('#radius-account-filter-clear').addEventListener('click', () => {
        accountFilter = null; q('#radius-account-search').value = ''; renderAccounts(); q('#radius-account-search').focus();
    });
    function detailDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('th-TH-u-ca-gregory', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date) + ' ICT';
    }
    function computedExpiredDate(account, pkg) {
        if (account.expiredDate) return account.expiredDate;
        if (!pkg) return '';
        if (pkg.expiration === 'Specified Date' && pkg.expirationDate) return pkg.expirationDate;
        if (pkg.expiration === '1st Login' && account.firstLogin && /^\d+$/.test(String(pkg.expirationDays || ''))) {
            const first = new Date(account.firstLogin);
            if (!Number.isNaN(first.getTime())) return new Date(first.getTime() + Number(pkg.expirationDays) * 86400000).toISOString();
        }
        return '';
    }
    function renderAccountSessions(account) {
        const sessions = Array.isArray(account.sessions) ? account.sessions : [];
        q('#radius-account-session-count').textContent = sessions.length.toLocaleString('en-US') + ' Session';
        q('#radius-account-session-rows').innerHTML = sessions.length ? sessions.map((session, index) => '<tr><td class="wt-session-seq">' + (index + 1).toLocaleString('en-US') + '</td><td>' + display(session.mac) + '</td><td>' + esc(detailDate(session.lastSeen)) + '</td></tr>').join('') : '<tr><td colspan="3">ยังไม่มีประวัติ Session ของ Account นี้ในข้อมูล Draft</td></tr>';
    }
    function renderAccountStatus(account) {
        const status = account.status === 'Inactive' ? 'Inactive' : 'Active';
        for (const value of ['Active', 'Inactive']) {
            const button = q('#radius-account-status-' + value.toLowerCase());
            const selected = value === status;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
            button.disabled = !admin;
        }
        q('#radius-account-status-note').textContent = admin ? '' : 'สิทธิ์ปัจจุบันดู Status ได้อย่างเดียว';
    }
    function renderAccountDetail(account) {
        const pkg = packageById(account.packageId);
        currentAccountDetailId = account.id;
        q('#radius-account-detail-title').textContent = 'Account Detail · ' + account.username;
        const values = {
            username: account.username,
            package: pkg?.policyName || ('ไม่พบ Package (' + account.packageId + ')'),
            'package-type': pkg?.packageType || '—',
            'package-price': pkg?.price || '—',
            'session-time': pkg ? displayPackageValue('sessionTime', pkg.sessionTime) : '—',
            'first-login': detailDate(account.firstLogin),
            'expired-date': detailDate(computedExpiredDate(account, pkg)),
            'time-used': account.timeUsed || '—',
            'last-login': detailDate(account.lastLogin),
            'created-date': detailDate(account.createdAt),
            remain: account.remain || '—'
        };
        for (const [key, value] of Object.entries(values)) q('#radius-account-detail-' + key).textContent = value || '—';
        renderAccountStatus(account);
        renderAccountSessions(account);
    }
    q('#radius-account-rows').addEventListener('click', event => {
        const button = event.target.closest('[data-account-detail]');
        if (!button) return;
        const account = accountRows.find(row => row.id === button.dataset.accountDetail);
        if (!account || !visibleAccounts.some(row => row.id === account.id)) return;
        accountDetailOpener = button; renderAccountDetail(account);
        if (!accountDetailDialog.open) accountDetailDialog.showModal();
    });
    function closeAccountDetail() { if (accountDetailDialog.open) accountDetailDialog.close(); }
    q('#radius-account-detail-close').addEventListener('click', closeAccountDetail);
    q('#radius-account-detail-back').addEventListener('click', closeAccountDetail);
    q('#radius-account-detail-status').addEventListener('click', event => {
        const button = event.target.closest('[data-account-status]');
        if (!button || !admin || !currentAccountDetailId) return;
        const status = button.dataset.accountStatus;
        const action = window.WiFiRadiusAccountActions?.setStatus;
        if (typeof action !== 'function') {
            q('#radius-account-status-note').textContent = 'ยังไม่สามารถบันทึก Status ใน Account Draft ได้';
            return;
        }
        try {
            action(currentAccountDetailId, status);
            const latest = accountRows.find(row => row.id === currentAccountDetailId);
            if (latest) renderAccountStatus(latest);
            q('#radius-account-status-note').textContent = 'บันทึก Status = ' + status + ' ใน Account Draft แล้ว';
        } catch (error) {
            q('#radius-account-status-note').textContent = error.message || 'บันทึก Status ไม่สำเร็จ';
        }
    });
    q('#radius-account-session-refresh').addEventListener('click', () => {
        if (!currentAccountDetailId) return;
        const latest = accountRows.find(row => row.id === currentAccountDetailId);
        if (!latest) { q('#radius-account-session-refresh-status').textContent = 'ไม่พบ Account ใน Draft ปัจจุบัน'; return; }
        renderAccountSessions(latest);
        const now = new Intl.DateTimeFormat('th-TH-u-ca-gregory', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date());
        q('#radius-account-session-refresh-status').textContent = 'Refresh จาก Account Draft แล้ว · ' + now + ' ICT';
    });
    accountDetailDialog.addEventListener('close', () => { accountDetailOpener?.focus(); accountDetailOpener = null; currentAccountDetailId = null; q('#radius-account-session-refresh-status').textContent = ''; });
    q('#radius-account-rows').addEventListener('change', event => {
        const input = event.target.closest('[data-account-select]');
        if (!admin || !input) return;
        if (input.checked) selectedAccounts.add(input.dataset.accountSelect); else selectedAccounts.delete(input.dataset.accountSelect);
        renderAccounts();
    });
    q('#radius-account-select-all').addEventListener('change', event => {
        if (!admin) return;
        if (event.currentTarget.checked) for (const row of visibleAccounts) selectedAccounts.add(row.id);
        else for (const row of visibleAccounts) selectedAccounts.delete(row.id);
        renderAccounts();
    });
    q('#radius-package').addEventListener('change', renderPackage);
    q('#radius-site-search').addEventListener('input', renderSites);
    q('#radius-account-search').addEventListener('input', renderAccounts);
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
    window.WiFiRadiusPage = {
        sites, catalog, accounts: accountRows, renderSites, renderAccounts, renderAllow, renderPackage, accountCount, siteAccountSummary, accountUsableAtSite,
        selectSite(id) { selectedSite = id; },
        selectPackage(id) { q('#radius-package').value = id; },
        getVisibleAccounts() { return visibleAccounts.map(row => ({ ...row })); },
        getSelectedAccountIds() { return [...selectedAccounts]; },
        clearAccountSelection() { selectedAccounts.clear(); renderAccounts(); },
        replaceAccounts(next) {
            accountRows.splice(0, accountRows.length, ...next.map(row => ({ ...row })));
            for (const id of [...selectedAccounts]) if (!accountRows.some(row => row.id === id)) selectedAccounts.delete(id);
            renderSites(); renderAccounts(); renderPackage();
            if (accountDetailDialog.open && currentAccountDetailId) {
                const latest = accountRows.find(row => row.id === currentAccountDetailId);
                if (latest) renderAccountDetail(latest);
            }
        },
        refresh() {
            q('#radius-package').innerHTML = rows.map(p => '<option value="' + esc(p.id) + '">' + esc(p.policyName) + '</option>').join('');
            if (!sites.some(s => s.id === selectedSite)) selectedSite = sites[0]?.id;
            renderSites(); renderAccounts(); renderAllow(); renderPackage();
        }
    };
    if (!admin) {
        q('#radius-account-select-all').hidden = true;
        for (const id of ['#radius-account-create', '#radius-account-generate', '#radius-account-import', '#radius-account-dispatch', '#radius-account-export']) q(id).hidden = true;
    }
    renderSites(); renderAccounts(); renderAllow(); renderPackage();
    tab(rows.some(p => p.id === requested.get('package')) ? 'packages' : 'nas');
})();
