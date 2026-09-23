'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/pages/radius-policy.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
function page(allowed = ['a', 'b', 'c'], mutate = () => { }, search = '') {
    const data = {}; for (const name of ['radius-sites', 'radius-packages', 'radius-accounts']) data[name] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', name + '.json'), 'utf8'));
    mutate(data);
    const nodes = new Map();
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
        const listeners = {};
        nodes.set('#' + id, {
            value: '', innerHTML: '', textContent: '', hidden: ['radius-panel-account', 'radius-panel-packages', 'radius-panel-sites'].includes(id), open: false, focused: false,
            classList: { toggle() { } }, setAttribute() { }, scrollIntoView() { }, focus() { this.focused = true; },
            addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
            emit(type, event = {}) { for (const fn of listeners[type] || []) fn(event); },
            showModal() { assert.equal(this.open, false); this.open = true; },
            close() { this.open = false; this.emit('close'); }
        });
    }
    const q = s => { assert.ok(nodes.has(s), 'Selector exists in real HTML: ' + s); return nodes.get(s); };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const c = { NT: { q, esc, allowedIds: () => allowed, can: () => allowed.length === 3, currentSite: allowed[0] }, NT_DATA: data, URLSearchParams, location: { search } };
    c.window = c; vm.runInNewContext(source, c);
    function click(container, attr, id) { const button = { dataset: { [attr]: id }, focused: false, focus() { this.focused = true; } }; q(container).emit('click', { target: { closest: () => button } }); return button; }
    return { q, click };
}
test('Allow Package opens visibly for the default Site and can reopen after closing', () => {
    const { q, click } = page(); q('#radius-tab-sites').emit('click'); const button = click('#radius-site-rows', 'radiusSite', 'a');
    assert.equal(q('#radius-allow-panel').open, true);
    assert.match(q('#radius-allow-title').textContent, /Demo Site A/);
    assert.match(q('#radius-allow-rows').innerHTML, /Free WiFi 1 Hour/);
    assert.match(q('#radius-allow-rows').innerHTML, /Staff Monthly/);
    assert.doesNotMatch(q('#radius-allow-rows').innerHTML, /Visitor Daily/);
    q('#radius-allow-close').emit('click'); assert.equal(q('#radius-allow-panel').open, false); assert.equal(button.focused, true);
    click('#radius-site-rows', 'radiusSite', 'a'); assert.equal(q('#radius-allow-panel').open, true);
});
test('Every Site button shows its own allow list, not the previous Site', () => {
    const { q, click } = page();
    for (const id of ['a', 'b', 'c']) {
        click('#radius-site-rows', 'radiusSite', id);
        assert.match(q('#radius-allow-title').textContent, new RegExp('Demo Site ' + id.toUpperCase()));
        assert.match(q('#radius-allow-rows').innerHTML, id === 'a' ? /Staff Monthly/ : /Visitor Daily/);
        assert.doesNotMatch(q('#radius-allow-rows').innerHTML, id === 'a' ? /Visitor Daily/ : /Staff Monthly/);
        q('#radius-allow-panel').close();
    }
});
test('Package link closes dialog, switches tab and focuses read-only detail selector', () => {
    const { q, click } = page(); click('#radius-site-rows', 'radiusSite', 'b'); click('#radius-allow-rows', 'radiusPackage', 'pkg-2');
    assert.equal(q('#radius-allow-panel').open, false); assert.equal(q('#radius-panel-packages').hidden, false);
    assert.equal(q('#radius-panel-sites').hidden, true); assert.equal(q('#radius-package').value, 'pkg-2');
    assert.equal(q('#radius-package').focused, true); assert.match(q('#radius-fields').innerHTML, /Visitor Daily/);
});
test('Restricted user cannot open other Sites or unrelated Package details', () => {
    const { q, click } = page(['a']); assert.doesNotMatch(q('#radius-site-rows').innerHTML, /Demo Site B/);
    click('#radius-site-rows', 'radiusSite', 'b'); assert.equal(q('#radius-allow-panel').open, false);
    click('#radius-site-rows', 'radiusSite', 'a'); click('#radius-allow-rows', 'radiusPackage', 'pkg-2');
    assert.equal(q('#radius-allow-panel').open, true); assert.equal(q('#radius-panel-packages').hidden, true);
});
test('Empty, missing and unresolved allow lists show an explicit message', () => {
    for (const [value, message] of [[[], /ยังไม่มี Allow Package/], [undefined, /ยังไม่มีข้อมูล Allow Package/], [[{ packageId: 'missing' }], /ไม่พบชื่อ Package/]]) {
        const { q, click } = page(['a'], data => data['radius-sites'].sites[0].allowPackages = value);
        click('#radius-site-rows', 'radiusSite', 'a'); assert.equal(q('#radius-allow-panel').open, true); assert.match(q('#radius-allow-rows').innerHTML, message);
    }
});


test('V025: tabs render NAS, Package, Account, Site in that order and NAS is the default', () => {
    const tablist = html.match(/<div class="nt-tabs"[^>]*>([\s\S]*?)<\/div>/)[1];
    assert.deepEqual([...tablist.matchAll(/id="radius-tab-(nas|account|packages|sites)"/g)].map(match => match[1]), ['nas', 'packages', 'account', 'sites']);
    assert.match(tablist, /class="nt-tab active" role="tab" id="radius-tab-nas"[\s\S]*?aria-selected="true"/);
    const { q } = page();
    assert.equal(q('#radius-panel-nas').hidden, false);
    for (const name of ['account', 'packages', 'sites']) assert.equal(q('#radius-panel-' + name).hidden, true);
    q('#radius-tab-account').emit('click');
    assert.equal(q('#radius-panel-account').hidden, false); assert.equal(q('#radius-panel-nas').hidden, true);
    q('#radius-tab-packages').emit('click');
    assert.equal(q('#radius-panel-packages').hidden, false); assert.equal(q('#radius-panel-account').hidden, true);
    q('#radius-tab-sites').emit('click');
    assert.equal(q('#radius-panel-sites').hidden, false); assert.equal(q('#radius-panel-packages').hidden, true);
    q('#radius-tab-nas').emit('click');
    assert.equal(q('#radius-panel-nas').hidden, false); assert.equal(q('#radius-panel-sites').hidden, true);
});

test('V019: package deep link still switches to Package rather than the default NAS', () => {
    const { q } = page(['a', 'b', 'c'], () => {}, '?package=pkg-2');
    assert.equal(q('#radius-panel-packages').hidden, false);
    assert.equal(q('#radius-panel-nas').hidden, true);
    assert.equal(q('#radius-panel-sites').hidden, true);
    assert.equal(q('#radius-package').value, 'pkg-2');
});


test('V021: Account tab and Package counts use the same account data while Site table shows only total Accounts', () => {
    const { q } = page();
    q('#radius-tab-account').emit('click');
    assert.match(q('#radius-account-count').textContent, /9 \/ 9 Account/);
    assert.match(q('#radius-account-rows').innerHTML, /FREE00000001/);
    assert.match(q('#radius-account-rows').innerHTML, /Free WiFi 1 Hour/);
    q('#radius-tab-packages').emit('click');
    assert.match(q('#radius-package-rows').innerHTML, /Free WiFi 1 Hour[\s\S]*?FREE[\s\S]*?4/);
    assert.match(q('#radius-package-rows').innerHTML, /Staff Monthly[\s\S]*?STF[\s\S]*?3/);
    assert.match(q('#radius-package-rows').innerHTML, /Visitor Daily[\s\S]*?VST[\s\S]*?2/);
    q('#radius-tab-sites').emit('click');
    assert.match(q('#radius-site-rows').innerHTML, /Demo Site A[\s\S]*?data-account-site="a"[\s\S]*?>7<\/button>/);
    assert.doesNotMatch(q('#radius-site-rows').innerHTML, /wt-site-account-breakdown|data-account-package=/);
});

test('V019: restricted user sees only accounts for Packages available to their Sites', () => {
    const { q } = page(['a']);
    assert.match(q('#radius-account-count').textContent, /7 \/ 7 Account/);
    assert.doesNotMatch(q('#radius-account-rows').innerHTML, /VST00000001/);
    assert.match(q('#radius-account-rows').innerHTML, /STF00000001/);
});


test('V020: Account count columns are centered and counts are clickable', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/radius-policy.css'), 'utf8');
    assert.match(css, /\.wt-account-number\s*\{[\s\S]*?text-align:\s*center/);
    const { q } = page();
    assert.match(q('#radius-package-rows').innerHTML, /data-account-package="pkg-0"[\s\S]*?>4<\/button>/);
    assert.match(q('#radius-site-rows').innerHTML, /data-account-site="a"[\s\S]*?>7<\/button>/);
});

test('V020: clicking a Package Account count opens Account tab filtered to that Package', () => {
    const { q, click } = page();
    click('#radius-package-rows', 'accountPackage', 'pkg-2');
    assert.equal(q('#radius-panel-account').hidden, false);
    assert.equal(q('#radius-panel-packages').hidden, true);
    assert.match(q('#radius-account-filter-label').textContent, /Package · Visitor Daily/);
    assert.match(q('#radius-account-count').textContent, /2 \/ 2 Account/);
    assert.match(q('#radius-account-rows').innerHTML, /VST00000001/);
    assert.doesNotMatch(q('#radius-account-rows').innerHTML, /FREE00000001/);
});

test('V020: clicking a Site Account total opens Account tab for all Packages allowed by that Site and can clear filter', () => {
    const { q, click } = page();
    click('#radius-site-rows', 'accountSite', 'a');
    assert.equal(q('#radius-panel-account').hidden, false);
    assert.match(q('#radius-account-filter-label').textContent, /Site · Demo Site A/);
    assert.match(q('#radius-account-count').textContent, /7 \/ 7 Account/);
    assert.equal(q('#radius-account-breakdown').hidden, false);
    assert.match(q('#radius-account-breakdown-title').textContent, /Account ตาม Package · Demo Site A/);
    assert.match(q('#radius-account-breakdown-rows').innerHTML, /Free WiFi 1 Hour[\s\S]*?4/);
    assert.match(q('#radius-account-breakdown-rows').innerHTML, /Staff Monthly[\s\S]*?3/);
    assert.doesNotMatch(q('#radius-account-breakdown-rows').innerHTML, /Visitor Daily/);
    assert.match(q('#radius-account-rows').innerHTML, /FREE00000001/);
    assert.match(q('#radius-account-rows').innerHTML, /STF00000001/);
    assert.doesNotMatch(q('#radius-account-rows').innerHTML, /VST00000001/);
    q('#radius-account-filter-clear').emit('click');
    assert.equal(q('#radius-account-filter').hidden, true);
    assert.equal(q('#radius-account-breakdown').hidden, true);
    assert.match(q('#radius-account-count').textContent, /9 \/ 9 Account/);
});


test('V021: Site Account breakdown is shown only after opening a Site total and each Package can be drilled down', () => {
    const { q, click } = page();
    assert.equal(q('#radius-account-breakdown').hidden, true);
    q('#radius-tab-sites').emit('click');
    click('#radius-site-rows', 'accountSite', 'a');
    assert.equal(q('#radius-account-breakdown').hidden, false);
    click('#radius-account-breakdown-rows', 'accountBreakdownPackage', 'pkg-1');
    assert.match(q('#radius-account-filter-label').textContent, /Package · Staff Monthly/);
    assert.equal(q('#radius-account-breakdown').hidden, true);
    assert.match(q('#radius-account-count').textContent, /3 \/ 3 Account/);
    assert.match(q('#radius-account-rows').innerHTML, /STF00000001/);
    assert.doesNotMatch(q('#radius-account-rows').innerHTML, /FREE00000001/);
});

test('V022: Account tab exposes CREATE, GENERATE, IMPORT, DISPATCH and EXPORT CSV controls', () => {
    for (const id of ['radius-account-create', 'radius-account-generate', 'radius-account-import', 'radius-account-dispatch', 'radius-account-export']) {
        assert.match(html, new RegExp('id="' + id + '"'));
    }
    assert.match(html, /ไม่ DISPATCH[\s\S]*ทุก Site ที่มี Package/);
    assert.match(html, /DISPATCH[\s\S]*เฉพาะ Site ที่กำหนด/);
});

test('V022: DISPATCH restricts a Package Account to that Site while undispatched Accounts remain usable on every Site with the Package', () => {
    const { q, click } = page(['a', 'b', 'c'], data => {
        data['radius-accounts'].accounts[0].dispatchSiteId = 'b';
    });
    q('#radius-tab-sites').emit('click');
    assert.match(q('#radius-site-rows').innerHTML, /Demo Site A[\s\S]*?data-account-site="a"[\s\S]*?>6<\/button>/);
    assert.match(q('#radius-site-rows').innerHTML, /Demo Site B[\s\S]*?data-account-site="b"[\s\S]*?>6<\/button>/);
    assert.match(q('#radius-site-rows').innerHTML, /Demo Site C[\s\S]*?data-account-site="c"[\s\S]*?>5<\/button>/);
    q('#radius-tab-packages').emit('click');
    assert.match(q('#radius-package-rows').innerHTML, /Free WiFi 1 Hour[\s\S]*?data-account-package="pkg-0"[\s\S]*?>4<\/button>/);
    click('#radius-site-rows', 'accountSite', 'a');
    assert.doesNotMatch(q('#radius-account-rows').innerHTML, /FREE00000001/);
    assert.match(q('#radius-account-rows').innerHTML, /FREE00000002/);
    q('#radius-tab-sites').emit('click');
    click('#radius-site-rows', 'accountSite', 'b');
    assert.match(q('#radius-account-rows').innerHTML, /FREE00000001/);
});


test('V023: Username is clickable and opens Account Detail with Package fields and Session history', () => {
    const { q, click } = page();
    q('#radius-tab-account').emit('click');
    assert.match(q('#radius-account-rows').innerHTML, /data-account-detail="acct-001"[\s\S]*?FREE00000001/);
    const opener = click('#radius-account-rows', 'accountDetail', 'acct-001');
    assert.equal(q('#radius-account-detail-dialog').open, true);
    assert.match(q('#radius-account-detail-title').textContent, /FREE00000001/);
    assert.equal(q('#radius-account-detail-username').textContent, 'FREE00000001');
    assert.equal(q('#radius-account-detail-package').textContent, 'Free WiFi 1 Hour');
    assert.match(html, /id="radius-account-detail-status"[\s\S]*data-account-status="Active"[\s\S]*data-account-status="Inactive"/);
    assert.equal(q('#radius-account-detail-package-type').textContent, 'Time quota (ตัวอย่าง)');
    assert.equal(q('#radius-account-detail-package-price').textContent, '0.00 THB');
    assert.equal(q('#radius-account-detail-session-time').textContent, '01:00');
    assert.match(q('#radius-account-detail-first-login').textContent, /20\/09\/2026/);
    assert.match(q('#radius-account-session-count').textContent, /2 Session/);
    assert.match(q('#radius-account-session-rows').innerHTML, /AA:BB:CC:DD:EE:01/);
    assert.match(q('#radius-account-session-rows').innerHTML, /AA:BB:CC:DD:EE:11/);
    q('#radius-account-detail-back').emit('click');
    assert.equal(q('#radius-account-detail-dialog').open, false);
    assert.equal(opener.focused, true);
});

test('V023: Account without historical sessions shows an explicit empty Session state', () => {
    const { q, click } = page();
    q('#radius-tab-account').emit('click');
    click('#radius-account-rows', 'accountDetail', 'acct-002');
    assert.equal(q('#radius-account-detail-dialog').open, true);
    assert.equal(q('#radius-account-detail-first-login').textContent, '—');
    assert.match(q('#radius-account-session-count').textContent, /0 Session/);
    assert.match(q('#radius-account-session-rows').innerHTML, /ยังไม่มีประวัติ Session/);
});


test('V024: Account Detail labels Package Type, provides Active/Inactive toggle and Sessions Refresh', () => {
    assert.match(html, /<dt>Package Type<\/dt>/);
    assert.doesNotMatch(html, /<dt>Package Based<\/dt>/);
    assert.match(html, /id="radius-account-status-active"[\s\S]*data-account-status="Active"/);
    assert.match(html, /id="radius-account-status-inactive"[\s\S]*data-account-status="Inactive"/);
    assert.match(html, /id="radius-account-session-refresh"[\s\S]*Refresh/);
    const { q, click } = page();
    q('#radius-tab-account').emit('click');
    click('#radius-account-rows', 'accountDetail', 'acct-001');
    q('#radius-account-session-refresh').emit('click');
    assert.match(q('#radius-account-session-refresh-status').textContent, /Refresh จาก Account Draft/);
    assert.match(q('#radius-account-session-count').textContent, /2 Session/);
});


test('V028: Package search filters by Name or Prefix Accounts only after pressing Search', () => {
    assert.match(html, /id="radius-package-search-form"[\s\S]*id="radius-package-search"[\s\S]*id="radius-package-search-button"/);
    const { q } = page();
    q('#radius-tab-packages').emit('click');
    q('#radius-package-search').value = 'staff';
    q('#radius-package-search-form').emit('submit', { preventDefault() {} });
    assert.match(q('#radius-package-count').textContent, /1 \/ 3 Package/);
    assert.match(q('#radius-package-rows').innerHTML, /Staff Monthly/);
    assert.doesNotMatch(q('#radius-package-rows').innerHTML, /Free WiFi 1 Hour|Visitor Daily/);

    q('#radius-package-search').value = 'vst';
    q('#radius-package-search-form').emit('submit', { preventDefault() {} });
    assert.match(q('#radius-package-rows').innerHTML, /Visitor Daily/);
    assert.doesNotMatch(q('#radius-package-rows').innerHTML, /Staff Monthly/);

    q('#radius-package-search').value = 'not-found';
    q('#radius-package-search-form').emit('submit', { preventDefault() {} });
    assert.match(q('#radius-package-count').textContent, /0 \/ 3 Package/);
    assert.match(q('#radius-package-rows').innerHTML, /ไม่พบ Package ตามคำค้น/);
});
