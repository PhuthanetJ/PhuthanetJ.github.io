(function () {
    'use strict'; if (!window.NT) return; const { q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate } = NT;
    const dashSites = NT_DATA.dashboard.sites.filter(s => NT.allowedIds().includes(s.id)), dashIncidents = NT_DATA.dashboard.incidents.filter(e => NT.allowedIds().includes(e.site));
    const number = v => v.toLocaleString('en-US');
    function drawDashboard() {
        const selected = q('#nt-dash-site').value;
        const sites = dashSites.filter(s => selected === 'all' || s.id === selected);
        const sum = k => sites.reduce((a, s) => a + s[k], 0);
        const metric = (label, value, detail) => '<div class="nt-kpi"><span>' + label + '</span><strong>' + value + '</strong><span class="nt-help">' + detail + '</span></div>';
        q('#nt-dash-metrics').innerHTML = metric('Active Sessions', number(sum('active')), 'ณ Snapshot · ไม่ใช่จำนวนคน') +
            metric('AP Online', sum('online') + ' / ' + sum('aps'), 'Offline ' + (sum('aps') - sum('online')) + ' ตัว') +
            metric('Authentication สำเร็จ', (100 * sum('success') / sum('attempts')).toFixed(1) + '%', number(sum('success')) + ' / ' + number(sum('attempts')) + ' ครั้ง') +
            metric('เหตุการณ์ค้าง', number(sum('alerts')), 'รอทีมตรวจสอบ · ข้อมูลตัวอย่าง');
        const values = Array.from({ length: 8 }, (_, i) => sites.reduce((a, s) => a + s.trend[i], 0));
        const cap = Math.ceil(Math.max(...values) / 50) * 50;
        const times = ['00', '03', '06', '09', '12', '15', '18', '21'];
        q('#nt-dash-trend').setAttribute('aria-label', 'ข้อมูลจำลอง Active Sessions: ' + values.map((v, i) => times[i] + ':00 ' + v + ' Sessions').join(', '));
        q('#nt-dash-trend').innerHTML = '<div class="nt-dash-scale"><span>' + cap + ' Sessions</span><span>0 ที่ฐานกราฟ</span></div><div class="nt-dash-bars">' + values.map((v, i) => '<div class="nt-dash-column"><div class="nt-dash-barspace"><div class="nt-dash-bar" style="height:' + (v / cap * 100) + '%"><span>' + v + '</span></div></div><span class="nt-help">' + times[i] + '</span></div>').join('') + '</div>';
        q('#nt-dash-sites').innerHTML = sites.map(s => '<tr><td><a href="ap-vendors.html?site=' + s.id + '">' + esc(s.name) + '</a></td><td>' + s.active + '</td><td>' + s.online + ' / ' + s.aps + '</td><td>' + (100 * s.success / s.attempts).toFixed(1) + '%<br><span class="nt-help">' + s.success + ' / ' + s.attempts + '</span></td><td>' + s.traffic.toFixed(1) + ' GB</td><td><span class="nt-badge ' + (s.alerts ? 'pending' : 'good') + '">' + (s.alerts ? s.alerts + ' เหตุการณ์' : 'ไม่มี') + '</span></td></tr>').join('');
        const methods = ['Free WiFi / คูปอง', 'SMS / OTP', 'Username / Password', 'Social Login'];
        q('#nt-dash-methods').innerHTML = methods.map((name, i) => { const count = sites.reduce((a, s) => a + s.methods[i], 0); const pct = count / sum('success') * 100; return '<div class="nt-dash-method"><div class="nt-row" style="justify-content:space-between"><span>' + name + '</span><span>' + number(count) + ' · ' + pct.toFixed(1) + '%</span></div><div class="nt-dash-track"><div style="width:' + pct + '%"></div></div></div>'; }).join('');
        q('#nt-dash-coupons').innerHTML = '<div class="nt-dash-service"><span>ออกคูปองแล้ว</span><strong>' + sum('issued') + '</strong></div><div class="nt-dash-service"><span>ใช้สิทธิ์แล้ว</span><strong>' + sum('used') + '</strong></div><div class="nt-dash-service"><span>ยังไม่ใช้ / ยังไม่หมดอายุ</span><strong>' + (sum('issued') - sum('used')) + '</strong></div><div class="nt-help" style="margin-top:10px">ชุดตัวอย่างนี้ไม่มีคูปองหมดอายุหรือถูกเพิกถอน</div>';
        const events = dashIncidents.filter(e => selected === 'all' || e.site === selected);
        q('#nt-dash-incidents').innerHTML = events.length ? events.map(e => '<div class="nt-module"><div><span class="nt-help">' + e.time + ' ICT · Demo Site ' + e.site.toUpperCase() + '</span><div>' + esc(e.title) + '</div><p>' + esc(e.detail) + '</p></div><span class="nt-badge pending">' + e.level + '</span></div>').join('') : '<div class="nt-empty">ไม่มีเหตุการณ์ค้างใน Site ตัวอย่างนี้</div>';
    }
    q('#nt-dash-site').addEventListener('change', drawDashboard);

    NT.fillSites(q('#nt-dash-site'), true); drawDashboard();
})();