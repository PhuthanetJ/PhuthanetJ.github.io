/* Browser-only prototype. Production permissions must be enforced by a backend. */
(function () {
    'use strict';
    const D = WiFiDomain, root = document.getElementById('nt-portal'), page = root.dataset.page;
    const q = s => root.querySelector(s), qa = s => Array.from(root.querySelectorAll(s)), on = (s, t, f) => q(s)?.addEventListener(t, f);
    const base = new URL('../', location.href).href, key = 'wifi-tools:v2:' + base, prefix = 'WIFI_TOOLS_DEMO:';
    const configs = {}; for (const site of NT_DATA.sites) { configs[site.id] = D.clone(NT_DATA.config); configs[site.id].state.site = site.name; configs[site.id].state.path = '/portal/site-' + site.id; }
    let db = { schema: 2, key, updatedAt: 0, session: null, currentSite: 'a', configs, users: D.clone(NT_DATA.users), channels: {}, covers: {}, coupons: [], schedules: [], reportDrafts: {} };
    const candidates = []; try { const x = localStorage.getItem(key); if (x) candidates.push(JSON.parse(x)); } catch (_) { } try { if (window.name.startsWith(prefix)) candidates.push(JSON.parse(window.name.slice(prefix.length))); } catch (_) { }
    candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); const previous = candidates.find(x => x.key === key && x.schema === 2 && x.configs && Array.isArray(x.users)); if (previous) db = Object.assign(db, previous);
    function persist() { db.updatedAt = Date.now(); const text = JSON.stringify(db); try { localStorage.setItem(key, text); } catch (_) { } try { window.name = prefix + text; } catch (_) { } }
    const getUser = () => db.session && db.session.expiresAt > Date.now() ? db.users.find(u => u.id === db.session.userId && u.status === 'active') : null;
    const can = p => D.permissions(getUser())[p] === true, allowedIds = () => D.siteIds(getUser(), NT_DATA.sites);
    function login(username, password) { const user = db.users.find(u => u.status === 'active' && u.username.toLowerCase() === username.trim().toLowerCase()); if (!user || password !== 'Demo1234!') throw Error('Username / Password ไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน'); db.session = { userId: user.id, expiresAt: Date.now() + 8 * 3600000 }; if (!allowedIds().length) { db.session = null; throw Error('ยังไม่ได้กำหนด Site'); } if (!allowedIds().includes(db.currentSite)) db.currentSite = allowedIds()[0]; persist(); }
    function logout() { db.session = null; persist(); location.replace('login.html'); }
    window.addEventListener('pagehide', persist);
    window.WiFiStore = { get: () => db, save: persist }; window.WiFiAuth = { user: getUser, can, allowed: allowedIds, login, logout };
    if (page !== 'login' && (!getUser() || !allowedIds().length)) { root.hidden = true; location.replace('login.html'); return; }
    if (page !== 'login' && !allowedIds().includes(db.currentSite)) db.currentSite = allowedIds()[0];
    const currentSite = db.currentSite, config = db.configs[currentSite], { state, copy, assets, lists } = config, user = getUser(); let version = config.version || 1;
    const changeListeners = [], loadListeners = [], esc = D.esc, siteName = id => NT_DATA.sites.find(s => s.id === id)?.name || id;
    const toast = text => { if (q('#nt-toast')) q('#nt-toast').textContent = text; };
    function syncFields() { qa('[data-bind]').forEach(el => { const v = state[el.dataset.bind]; if (el.type === 'checkbox') el.checked = v; else el.value = v; }); }
    function status() { if (q('#nt-draft-status')) q('#nt-draft-status').textContent = 'Draft v' + version; if (q('#nt-save-help')) q('#nt-save-help').textContent = siteName(currentSite) + ' · เก็บ Draft ใน Browser'; }
    function changed() { if (!can('editSite')) return syncFields(); persist(); status(); changeListeners.forEach(f => f()); }
    function validate(value = state) { const issues = []; if (!value.name.trim()) issues.push('กรอกชื่อ Portal'); if (!/^\/portal\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(value.path)) issues.push('Path ต้องอยู่ใต้ /portal/'); if (!['guest', 'member', 'otp', 'line', 'google', 'facebook', 'apple'].some(k => value[k])) issues.push('เปิดวิธีรับสิทธิ์อย่างน้อย 1 วิธี'); if (!Number.isFinite(value.hours) || value.hours < 1 || value.hours > 24) issues.push('เวลา 1–24 ชั่วโมง'); if (value.surveyEnabled && (!value.question.trim() || value.answers.split(',').filter(v => v.trim()).length < 2)) issues.push('ระบุคำถามและตัวเลือกอย่างน้อย 2 ข้อ'); if (value.surveyEnabled && value.surveyType === 'quiz' && !value.answers.split(',').map(v => v.trim()).includes(value.correctAnswer.trim())) issues.push('คำตอบ Quiz ไม่ตรงตัวเลือก'); return issues; }
    function snapshot() { return { format: 'wifi-tools-config', schemaVersion: 2, siteId: currentSite, version, state, copy, assets, lists }; }
    function parseConfig(doc) {
        if (!doc || !['wifi-tools-config', 'nt-wifi-offline-config'].includes(doc.format) || ![1, 2].includes(doc.schemaVersion) || !doc.state || !doc.copy || !doc.assets || !doc.lists) throw Error('Config ไม่ถูกต้อง');
        if (doc.siteId && doc.siteId !== currentSite) throw Error('เลือก Site ให้ตรงกับไฟล์ก่อนนำเข้า');
        const next = { state: {}, copy: { th: {}, en: {} }, assets: {}, lists: { wg: [], mac: [] } };
        for (const [k, v] of Object.entries(NT_DATA.config.state)) { const x = doc.state[k]; if (typeof x !== typeof v || typeof x === 'number' && !Number.isFinite(x) || typeof x === 'string' && x.length > 6000) throw Error('ชนิดข้อมูลไม่ถูกต้อง: ' + k); next.state[k] = x; }
        for (const k of ['buttonColor', 'buttonTextColor']) if (!/^#[0-9a-f]{6}$/i.test(next.state[k])) throw Error('สีไม่ถูกต้อง');
        for (const lang of ['th', 'en']) for (const k of Object.keys(copy[lang])) { const v = doc.copy[lang]?.[k]; if (typeof v !== 'string' || v.length > 6000) throw Error('คำแปลไม่ถูกต้อง'); next.copy[lang][k] = v; }
        for (const k of ['logo', 'banner', 'background']) { const v = doc.assets[k]; if (typeof v !== 'string' || v.length > 4300000 || v && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) throw Error('รูปภาพต้องฝังในไฟล์'); next.assets[k] = v; }
        for (const k of ['wg', 'mac']) { if (!Array.isArray(doc.lists[k]) || doc.lists[k].length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง'); for (const v of doc.lists[k]) { if (typeof v.value !== 'string' || typeof v.reason !== 'string' || v.value.length > 500 || v.reason.length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง'); if (k === 'mac' && (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(v.value) || !D.validDate(v.expiry))) throw Error('MAC หรือวันหมดอายุไม่ถูกต้อง'); next.lists[k].push({ value: v.value, reason: v.reason, ...(k === 'mac' ? { expiry: v.expiry } : {}) }); } }
        const errors = validate(next.state); if (errors.length) throw Error(errors.join(' · ')); return next;
    }
    function apply(doc) { const next = parseConfig(doc); Object.assign(state, next.state); Object.assign(copy.th, next.copy.th); Object.assign(copy.en, next.copy.en); Object.assign(assets, next.assets); lists.wg = next.lists.wg; lists.mac = next.lists.mac; persist(); syncFields(); loadListeners.forEach(f => f()); }
    function download(filename, text, mime) { if (!can('export')) return toast('ไม่มีสิทธิ์ Export'); const url = URL.createObjectURL(new Blob([text], { type: mime })), a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
    function fillSites(el, all = false) { el.innerHTML = (all ? '<option value="all">ทุก Site ตามสิทธิ์</option>' : '') + NT_DATA.sites.filter(s => allowedIds().includes(s.id)).map(s => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join(''); el.value = all ? 'all' : currentSite; }
    function selectSite(id) { if (!allowedIds().includes(id)) return toast('ไม่มีสิทธิ์ใน Site'); db.currentSite = id; persist(); location.reload(); }
    window.NT = { q, qa, on, esc, db, user, getUser, state, copy, assets, lists, currentSite, can, allowedIds, allowedSites: () => NT_DATA.sites.filter(s => allowedIds().includes(s.id)), siteName, fillSites, selectSite, changed, syncFields, toast, validate, download, snapshot, parseConfig, persist, onChange: f => changeListeners.push(f), onLoad: f => loadListeners.push(f) };
    if (page === 'login' || page === 'print') return;
    fillSites(q('#wt-current-site')); q('#wt-current-user').textContent = user.name + ' · ' + NT_DATA.roles.find(r => r.id === user.role).name;
    on('#wt-current-site', 'change', e => selectSite(e.target.value)); on('#wt-logout', 'click', logout);
    qa('a[data-nav="users"]').forEach(a => a.hidden = !can('users'));
    syncFields(); status();
    qa('[data-bind]').forEach(el => el.addEventListener('input', () => { if (!can('editSite')) return syncFields(); state[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value; syncFields(); changed(); }));
    if (!can('editSite')) qa('[data-bind],[data-copy],[data-asset],[data-clear],#nt-ai-generate,#nt-ai-apply,#nt-wg-add,#nt-mac-add,#nt-voucher-create,#nt-save,#nt-import-config,#nt-reset-config').forEach(e => e.disabled = true);
    if (!can('export')) q('#nt-export-config')?.setAttribute('disabled', '');
    on('#nt-save', 'click', () => { if (!can('editSite')) return; const errors = validate(); if (errors.length) return toast(errors.join(' · ')); version++; config.version = version; persist(); status(); toast('บันทึก Draft แล้ว'); });
    on('#nt-export-config', 'click', () => { const errors = validate(); if (errors.length) return toast(errors.join(' · ')); download('Wi-Fi-Config-' + currentSite + '.json', JSON.stringify(snapshot(), null, 2), 'application/json'); });
    on('#nt-import-config', 'click', () => { if (can('editSite')) q('#nt-config-file').click(); });
    on('#nt-config-file', 'change', async () => { const el = q('#nt-config-file'), file = el.files?.[0]; if (!file) return; try { if (!can('editSite')) throw Error('ไม่มีสิทธิ์แก้ Config'); if (file.size > 15000000) throw Error('Config ต้องไม่เกิน 15 MB'); apply(JSON.parse((await file.text()).replace(/^\uFEFF/, ''))); toast('โหลด Config แล้ว'); } catch (e) { toast(e.message); } el.value = ''; });
    on('#nt-reset-config', 'click', () => { if (!can('editSite') || !confirm('แทนที่ Draft ของ Site นี้ด้วยค่าตั้งต้น?')) return; const doc = D.clone(NT_DATA.config); doc.state.site = siteName(currentSite); doc.state.path = '/portal/site-' + currentSite; apply(doc); toast('โหลดค่าตั้งต้นแล้ว'); });
    on('#nt-review', 'click', () => { q('#nt-review-results').textContent = validate().join(' · ') || 'ผ่านรูปแบบเบื้องต้น · รอตรวจ Adapter/RADIUS/Provider จริง'; q('#nt-review-panel').hidden = false; });
    window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
})();
