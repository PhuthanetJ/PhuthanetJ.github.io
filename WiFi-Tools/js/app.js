/* Browser-only prototype. Production permissions must be enforced by a backend. */
(function () {
    'use strict';
    const D = WiFiDomain, P = WiFiPortalBindings, root = document.getElementById('nt-portal'), page = root.dataset.page;
    let packages = NT_DATA['radius-packages'].packages, sites = NT_DATA['radius-sites'].sites;
    const q = s => root.querySelector(s), qa = s => Array.from(root.querySelectorAll(s)), on = (s, t, f) => q(s)?.addEventListener(t, f);
    const base = new URL('../', location.href).href, key = 'wifi-tools:v2:' + base, prefix = 'WIFI_TOOLS_DEMO:', radiusCatalogKey = 'wifi-tools:radius-catalog-demo:v1:' + base;
    NT_DATA.sites = sites; // Compatibility alias; shared RADIUS Site Draft is the source when available.
    const portalPage = ['builder', 'settings'].includes(page);
    // UI-only division selector. Real site-to-division mappings have not yet been provided.
    const divisions = [
        ['all', 'ALL'],
        ['bangkok-metro', 'กรุงเทพและปริมณฑล'],
        ['central', 'ภาคกลาง'],
        ['east', 'ภาคตะวันออก'],
        ['north', 'ภาคเหนือ'],
        ['northeast', 'ภาคตะวันออกเฉียงเหนือ'],
        ['south', 'ภาคใต้']
    ];
    const portalLanguages = ['th', 'en', 'zh', 'ja'];
    function defaultPortalConfig(site) {
        const draft = D.clone(NT_DATA.config);
        draft.ownerSiteId = site.id; draft.state.site = site.name; draft.state.path = '/portal/site-' + site.id;
        draft.bindings = P.defaults(site.id, sites, packages);
        return draft;
    }
    const configs = {}; for (const site of NT_DATA.sites) configs[site.id] = defaultPortalConfig(site);
    let db = { schema: 2, key, updatedAt: 0, session: null, currentSite: 'a', currentDivision: 'all', portalSelections: {}, configs, radiusCatalog: null, users: D.clone(NT_DATA.users), channels: {}, covers: {}, coupons: [], schedules: [], reportDrafts: {} };
    const candidates = []; try { const x = localStorage.getItem(key); if (x) candidates.push(JSON.parse(x)); } catch (_) { } try { if (window.name.startsWith(prefix)) candidates.push(JSON.parse(window.name.slice(prefix.length))); } catch (_) { }
    candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); const previous = candidates.find(x => x.key === key && x.schema === 2 && x.configs && Array.isArray(x.users)); if (previous) db = Object.assign(db, previous);

    // V031: Site/Package Draft is shared with Portal Configuration through the main browser draft.
    function validCatalog(value) {
        if (!value || !Array.isArray(value.sites) || !Array.isArray(value.packages)) return null;
        try { return window.WiFiRadiusCatalog ? WiFiRadiusCatalog.check(D.clone(value)) : D.clone(value); } catch (_) { return null; }
    }
    let sharedCatalog = validCatalog(db.radiusCatalog);
    if (!sharedCatalog && window.WiFiRadiusCatalog) {
        try { const raw = localStorage.getItem(radiusCatalogKey); if (raw) sharedCatalog = WiFiRadiusCatalog.load(raw, NT_DATA); } catch (_) { }
    }
    if (sharedCatalog) {
        sites.splice(0, sites.length, ...D.clone(sharedCatalog.sites));
        packages.splice(0, packages.length, ...D.clone(sharedCatalog.packages));
        db.radiusCatalog = D.clone(sharedCatalog);
    }
    NT_DATA.sites = sites; NT_DATA['radius-sites'].sites = sites; NT_DATA['radius-packages'].packages = packages;
    function reconcileSiteScopedData() {
        const known = new Set(sites.map(site => site.id));
        if (!known.has(db.currentSite)) db.currentSite = sites[0]?.id || '';
        for (const siteId of Object.keys(db.channels || {})) if (!known.has(siteId)) delete db.channels[siteId];
        if (Array.isArray(db.coupons)) db.coupons = db.coupons.filter(row => known.has(row.siteId));
        if (Array.isArray(db.schedules)) db.schedules = db.schedules.map(row => {
            const siteIds = Array.isArray(row.siteIds) ? row.siteIds.filter(id => known.has(id)) : [];
            return { ...row, siteIds, requestedEnabled: siteIds.length ? !!row.requestedEnabled : false };
        });
        if (Array.isArray(db.users)) for (const user of db.users) if (Array.isArray(user.siteIds)) user.siteIds = user.siteIds.filter(id => known.has(id));
    }
    function reconcilePortalConfigs() {
        const known = new Set(sites.map(site => site.id)), removed = [];
        for (const [id, saved] of Object.entries(db.configs || {})) {
            if (!saved || typeof saved !== 'object' || !saved.state || !saved.bindings) { delete db.configs[id]; removed.push(id); continue; }
            const rawIds = Array.isArray(saved.bindings.siteIds) ? saved.bindings.siteIds : [];
            const siteIds = [...new Set(rawIds.filter(siteId => known.has(siteId)))];
            const owner = known.has(saved.ownerSiteId) ? saved.ownerSiteId : (known.has(id) ? id : siteIds[0]);
            if (!owner) { delete db.configs[id]; removed.push(id); continue; }
            if (!siteIds.includes(owner)) siteIds.unshift(owner);
            try {
                saved.ownerSiteId = owner;
                saved.state.site = sites.find(site => site.id === owner)?.name || saved.state.site || '';
                saved.bindings = P.normalize({ siteIds }, { owner, sites, packages });
            } catch (_) { delete db.configs[id]; removed.push(id); }
        }
        // V036: Site lifecycle and Portal Path lifecycle are independent.
        // Do not auto-create a Portal Path for a Site that has no Path.
        // A Site becomes available as a choice in Portal Path Management and must be assigned explicitly.
        for (const [siteId, selected] of Object.entries(db.portalSelections || {})) {
            if (!known.has(siteId) || !db.configs[selected]?.bindings?.siteIds?.includes(siteId)) delete db.portalSelections[siteId];
        }
        return removed;
    }
    reconcileSiteScopedData();
    reconcilePortalConfigs();
    if (!divisions.some(([id]) => id === db.currentDivision)) db.currentDivision = 'all';
    // Existing drafts and JSON exports may predate newer Portal state fields.
    const migratedStateKeys = ['termsBodyTh', 'termsBodyEn', 'termsZh', 'termsJa', 'termsBodyZh', 'termsBodyJa', 'registerEnabled', 'accountSmsEnabled', 'accountEmailEnabled', 'videoBannerId'];
    for (const saved of Object.values(db.configs)) {
        delete saved.state.policyName;
        if (saved.state.thaid === undefined) saved.state.thaid = typeof saved.state.facebook === 'boolean' ? saved.state.facebook : D.clone(NT_DATA.config.state.thaid);
        delete saved.state.facebook;
        for (const k of migratedStateKeys) if (saved.state[k] === undefined) saved.state[k] = D.clone(NT_DATA.config.state[k]);
        saved.copy = saved.copy || {};
        for (const lang of portalLanguages) if (!saved.copy[lang]) saved.copy[lang] = D.clone(NT_DATA.config.copy[lang]);
        saved.assets.banners = WiFiBanners.fromAssets(saved.assets); saved.assets.banner = '';
        if (saved.state.videoEnabled && !saved.assets.banners.some(b => b.id === saved.state.videoBannerId && b.type === 'video')) {
            const firstVideo = saved.assets.banners.find(b => b.type === 'video'); saved.state.videoBannerId = firstVideo?.id || ''; if (!firstVideo) saved.state.videoEnabled = false;
        }
        saved.lists.questionnaires = WiFiBanners.parseQuestions(saved.lists.questionnaires === undefined ? D.clone(NT_DATA.config.lists.questionnaires) : saved.lists.questionnaires);
        WiFiBanners.migratePortalQuestions(saved.lists, saved.state);
    }
    let storageResult = { local: true, handoff: true };
    function persist() {
        db.updatedAt = Date.now(); const text = JSON.stringify(db); storageResult = { local: false, handoff: false };
        try { localStorage.setItem(key, text); storageResult.local = true; } catch (_) { }
        try { window.name = prefix + text; storageResult.handoff = window.name === prefix + text; } catch (_) { }
        let notice = q('#wt-storage-warning'); const main = q('#page-content');
        if (!storageResult.local && !notice && main) { notice = document.createElement('p'); notice.id = 'wt-storage-warning'; notice.className = 'nt-notice'; notice.setAttribute('role', 'status'); main.prepend(notice); }
        if (notice) { notice.hidden = storageResult.local; notice.textContent = 'Draft ล่าสุดยังเก็บถาวรใน Browser ไม่ได้ ลดขนาดสื่อหรือดาวน์โหลด Config JSON ก่อนปิดแท็บ'; }
        return { ...storageResult };
    }
    function radiusCatalog() { return D.clone(db.radiusCatalog || { sites, packages }); }
    function setRadiusCatalog(value) {
        const validated = validCatalog(value); if (!validated) throw Error('Site / Package Draft ไม่ถูกต้อง');
        sites.splice(0, sites.length, ...D.clone(validated.sites));
        packages.splice(0, packages.length, ...D.clone(validated.packages));
        NT_DATA.sites = sites; NT_DATA['radius-sites'].sites = sites; NT_DATA['radius-packages'].packages = packages;
        db.radiusCatalog = D.clone(validated);
        reconcileSiteScopedData();
        reconcilePortalConfigs();
        persist();
        if (window.NT) window.NT.currentSite = db.currentSite;
        return radiusCatalog();
    }
    const getUser = () => db.session && db.session.expiresAt > Date.now() ? db.users.find(u => u.id === db.session.userId && u.status === 'active') : null;
    const allowedIds = () => D.siteIds(getUser(), NT_DATA.sites);
    const can = p => D.permissions(getUser())[p] === true && (!(p === 'editSite' || portalPage && p === 'export') || P.canManage(config.bindings, allowedIds()));
    function login(username, password) { const user = db.users.find(u => u.status === 'active' && u.username.toLowerCase() === username.trim().toLowerCase()); if (!user || password !== 'Demo1234!') throw Error('Username / Password ไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน'); db.session = { userId: user.id, expiresAt: Date.now() + 8 * 3600000 }; if (!allowedIds().length) { db.session = null; throw Error('ยังไม่ได้กำหนด Site'); } if (!allowedIds().includes(db.currentSite)) db.currentSite = allowedIds()[0]; persist(); }
    function logout() { db.session = null; persist(); location.replace('login.html'); }
    window.addEventListener('pagehide', persist);
    window.WiFiStore = { get: () => db, save: persist }; window.WiFiAuth = { user: getUser, can, allowed: allowedIds, login, logout };
    if (page !== 'login' && (!getUser() || !allowedIds().length)) { root.hidden = true; location.replace('login.html'); return; }
    if (page !== 'login' && !allowedIds().includes(db.currentSite)) db.currentSite = allowedIds()[0];
    let currentSite = db.currentSite;
    const requestedPortalId = page === 'builder' ? new URL(location.href).searchParams.get('portal') : null;
    const permittedPaths = portalPage ? P.pathChoices(db.configs, allowedIds()) : [];
    if (requestedPortalId) {
        const requested = permittedPaths.find(row => row.id === requestedPortalId);
        if (requested && !requested.siteIds.includes(currentSite)) { currentSite = requested.siteIds[0]; db.currentSite = currentSite; }
    }
    const resolvedPortalId = portalPage ? (requestedPortalId && permittedPaths.some(row => row.id === requestedPortalId) ? requestedPortalId : P.resolve(db.configs, currentSite, db.portalSelections[currentSite], allowedIds())) : (db.configs[currentSite] ? currentSite : null);
    // V036: an unassigned Site is valid. Use an in-memory scratch Config only so common page code can run;
    // it is never inserted into db.configs and therefore never appears in Portal Path Management.
    const currentPortalId = resolvedPortalId || '__unassigned__';
    const runtimeSite = sites.find(site => site.id === currentSite) || sites[0];
    const config = resolvedPortalId ? db.configs[resolvedPortalId] : defaultPortalConfig(runtimeSite);
    const ownerSiteId = config.ownerSiteId || currentSite, { state, copy, assets, lists } = config, user = getUser(); let version = config.version || 1;
    const portalConfigMode = page === 'builder' && requestedPortalId && requestedPortalId === resolvedPortalId ? 'configure' : 'list';
    if (portalPage) {
        if (resolvedPortalId && config.bindings.siteIds.includes(currentSite)) db.portalSelections[currentSite] = resolvedPortalId;
        else delete db.portalSelections[currentSite];
    }
    const changeListeners = [], loadListeners = [], esc = D.esc, siteName = id => NT_DATA.sites.find(s => s.id === id)?.name || id;
    const toast = text => { if (q('#nt-toast')) q('#nt-toast').textContent = text; };
    function syncFields() { qa('[data-bind]').forEach(el => { const v = state[el.dataset.bind]; if (el.type === 'checkbox') el.checked = v; else el.value = v; }); }
    function status() { if (q('#nt-draft-status')) q('#nt-draft-status').textContent = 'Draft v' + version; if (q('#nt-save-help')) q('#nt-save-help').textContent = siteName(currentSite) + ' · เก็บ Draft ใน Browser'; }
    function changed() { if (!can('editSite')) return syncFields(); persist(); status(); changeListeners.forEach(f => f()); }
    function validate(value = state, binding = config.bindings, banners = assets.banners, questions = lists.questionnaires, portalQuestionnaireIds = lists.portalQuestionnaireIds) {
        const issues = [];
        if (portalPage) try { P.normalize(binding, { owner: ownerSiteId, sites: NT_DATA.sites, packages }); } catch (e) { issues.push(e.message); }
        if (!value.name.trim()) issues.push('กรอกชื่อ Portal');
        const termFields = ['termsTh', 'termsEn', 'termsZh', 'termsJa', 'termsBodyTh', 'termsBodyEn', 'termsBodyZh', 'termsBodyJa'];
        if (value.termsEnabled && termFields.some(k => typeof value[k] !== 'string' || !value[k].trim() || value[k].length > 6000)) issues.push('กรอกข้อความลิงก์และเนื้อหาเงื่อนไข Terms & Conditions ให้ครบทุกภาษา ไม่เกิน 6,000 ตัวอักษร');
        if (!/^\/portal\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(value.path)) issues.push('Path ต้องอยู่ใต้ /portal/');
        if (!['guest', 'member', 'otp', 'line', 'google', 'thaid', 'apple'].some(k => value[k])) issues.push('เปิดวิธีรับสิทธิ์อย่างน้อย 1 วิธี');
        if (!Number.isFinite(value.hours) || value.hours < 1 || value.hours > 24) issues.push('เวลา 1–24 ชั่วโมง');
        try {
            const parsedBanners = WiFiBanners.parse(banners), parsedQuestions = WiFiBanners.parseQuestions(questions);
            issues.push(...WiFiBanners.bindingIssues(parsedBanners, parsedQuestions));
            const selected = WiFiBanners.questionIds(portalQuestionnaireIds, parsedQuestions);
            if (value.surveyEnabled && !selected.length) issues.push('เลือก Questionnaire สำหรับหน้า Portal อย่างน้อย 1 ข้อ');
            if (value.videoEnabled) {
                const video = parsedBanners.find(b => b.id === value.videoBannerId && b.type === 'video');
                if (!video) issues.push('Video Ads ต้องเลือก Video Banner ที่มีอยู่');
                if (!Number.isFinite(value.videoSeconds) || value.videoSeconds < 1 || value.videoSeconds > 120) issues.push('Video Ads กำหนดเวลา 1–120 วินาที');
            }
        } catch (e) { issues.push(e.message); }
        return issues;
    }
    function snapshot() { return { format: 'wifi-tools-config', schemaVersion: 8, siteId: ownerSiteId, portalId: currentPortalId, version, bindings: P.normalize(config.bindings, { owner: ownerSiteId, sites, packages }), state, copy, assets, lists }; }
    function parseConfig(doc) {
        if (!doc || !['wifi-tools-config', 'nt-wifi-offline-config'].includes(doc.format) || ![1, 2, 3, 4, 5, 6, 7, 8].includes(doc.schemaVersion) || !doc.state || !doc.copy || !doc.assets || !doc.lists) throw Error('Config ไม่ถูกต้อง');
        if (doc.siteId && doc.siteId !== ownerSiteId || doc.portalId && doc.portalId !== currentPortalId) throw Error('เลือก Portal Path / Config ให้ตรงกับไฟล์ก่อนนำเข้า');
        const next = { state: {}, copy: { th: {}, en: {}, zh: {}, ja: {} }, assets: {}, lists: { wg: [], mac: [] } };
        next.bindings = P.normalize(doc.bindings === undefined && doc.schemaVersion < 4 ? P.defaults(ownerSiteId, sites, packages) : doc.bindings, { owner: ownerSiteId, sites: NT_DATA.sites, packages, allowed: getUser() ? allowedIds() : undefined });
        if (!next.bindings.siteIds.includes(currentSite)) throw Error('Config ต้องมี Site ที่กำลังเปิดอยู่ในรายการ');
        for (const [k, v] of Object.entries(NT_DATA.config.state)) { let x = doc.state[k]; if (k === 'thaid' && x === undefined && typeof doc.state.facebook === 'boolean') x = doc.state.facebook; if (x === undefined && (migratedStateKeys.includes(k) || k === 'thaid')) x = D.clone(v); if (typeof x !== typeof v || typeof x === 'number' && !Number.isFinite(x) || typeof x === 'string' && x.length > 6000) throw Error('ชนิดข้อมูลไม่ถูกต้อง: ' + k); next.state[k] = x; }
        for (const k of ['buttonColor', 'buttonTextColor']) if (!/^#[0-9a-f]{6}$/i.test(next.state[k])) throw Error('สีไม่ถูกต้อง');
        for (const lang of portalLanguages) for (const k of Object.keys(NT_DATA.config.copy[lang])) { const fallback = D.clone(NT_DATA.config.copy[lang][k]); const v = doc.copy[lang]?.[k] === undefined && doc.schemaVersion < 8 ? fallback : doc.copy[lang]?.[k]; if (typeof v !== 'string' || v.length > 6000) throw Error('คำแปลไม่ถูกต้อง'); next.copy[lang][k] = v; }
        for (const k of ['logo', 'banner', 'background']) { const v = doc.assets[k]; if (typeof v !== 'string' || v.length > 4300000 || v && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) throw Error('รูปภาพต้องฝังในไฟล์'); next.assets[k] = v; }
        next.assets.banners = WiFiBanners.fromAssets(doc.assets); next.assets.banner = '';
        if (doc.schemaVersion < 8 && next.state.videoEnabled && !next.assets.banners.some(b => b.id === next.state.videoBannerId && b.type === 'video')) {
            const firstVideo = next.assets.banners.find(b => b.type === 'video'); next.state.videoBannerId = firstVideo?.id || ''; if (!firstVideo) next.state.videoEnabled = false;
        }
        for (const k of ['wg', 'mac']) { if (!Array.isArray(doc.lists[k]) || doc.lists[k].length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง'); for (const v of doc.lists[k]) { if (typeof v.value !== 'string' || typeof v.reason !== 'string' || v.value.length > 500 || v.reason.length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง'); if (k === 'mac' && (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(v.value) || !D.validDate(v.expiry))) throw Error('MAC หรือวันหมดอายุไม่ถูกต้อง'); next.lists[k].push({ value: v.value, reason: v.reason, ...(k === 'mac' ? { expiry: v.expiry } : {}) }); } }
        next.lists.questionnaires = WiFiBanners.parseQuestions(doc.lists.questionnaires === undefined && doc.schemaVersion < 6 ? D.clone(NT_DATA.config.lists.questionnaires) : doc.lists.questionnaires);
        if (doc.schemaVersion < 7) { next.lists.portalQuestionnaireIds = doc.lists.portalQuestionnaireIds; WiFiBanners.migratePortalQuestions(next.lists, next.state); }
        else next.lists.portalQuestionnaireIds = WiFiBanners.questionIds(doc.lists.portalQuestionnaireIds, next.lists.questionnaires);
        const errors = validate(next.state, next.bindings, next.assets.banners, next.lists.questionnaires, next.lists.portalQuestionnaireIds); if (errors.length) throw Error(errors.join(' · ')); return next;
    }
    function apply(doc) { const next = parseConfig(doc); config.bindings = next.bindings; Object.assign(state, next.state); for (const lang of portalLanguages) { if (!copy[lang]) copy[lang] = {}; Object.assign(copy[lang], next.copy[lang]); } Object.assign(assets, next.assets); lists.wg = next.lists.wg; lists.mac = next.lists.mac; lists.questionnaires = next.lists.questionnaires; lists.portalQuestionnaireIds = next.lists.portalQuestionnaireIds; persist(); syncFields(); loadListeners.forEach(f => f()); }
    function download(filename, text, mime) { if (!can('export')) return toast('ไม่มีสิทธิ์ Export'); const url = URL.createObjectURL(new Blob([text], { type: mime })), a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
    function fillDivisions(el) {
        if (!el) return;
        el.innerHTML = divisions.map(([id, name]) => '<option value="' + esc(id) + '">' + esc(name) + '</option>').join('');
        el.value = db.currentDivision;
    }
    function selectDivision(id) {
        if (!divisions.some(([value]) => value === id)) return toast('ไม่พบส่วนงานที่เลือก');
        db.currentDivision = id;
        persist();
    }
    function fillSites(el, all = false) { el.innerHTML = (all ? '<option value="all">ทุก Site ตามสิทธิ์</option>' : '') + NT_DATA.sites.filter(s => allowedIds().includes(s.id)).map(s => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join(''); el.value = all ? 'all' : currentSite; }
    function portalChoices(siteId) { return P.choices(db.configs, siteId, allowedIds()); }
    function portalPathChoices() { return P.pathChoices(db.configs, allowedIds()); }
    function portalManagerAllowed() { return D.permissions(getUser()).editSite === true; }
    function portalInput(value, existingId) {
        const name = String(value?.name || '').trim(), path = String(value?.path || '').trim(), template = String(value?.template || '').trim();
        const siteIds = Array.isArray(value?.siteIds) ? [...new Set(value.siteIds)] : [];
        if (!name) throw Error('กรอกชื่อ Portal');
        if (!/^\/portal\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(path)) throw Error('Path ต้องอยู่ใต้ /portal/ และใช้ a-z, 0-9, - เท่านั้น');
        if (!template) throw Error('เลือก Template');
        if (!siteIds.length || siteIds.some(id => !allowedIds().includes(id))) throw Error('เลือก Site อย่างน้อย 1 Site และต้องอยู่ในสิทธิ์');
        const duplicate = Object.entries(db.configs).some(([id, c]) => id !== existingId && c.state.path.toLowerCase() === path.toLowerCase());
        if (duplicate) throw Error('Portal Path นี้มีอยู่แล้ว');
        return { name, path, template, siteIds };
    }
    function createPortalPath(value) {
        if (!portalManagerAllowed()) throw Error('ไม่มีสิทธิ์เพิ่ม Portal Path');
        const next = portalInput(value), owner = next.siteIds[0]; let n = 1; while (db.configs['portal-' + n]) n++;
        const id = 'portal-' + n, draft = D.clone(NT_DATA.config); draft.ownerSiteId = owner; draft.version = 1;
        draft.state.name = next.name; draft.state.path = next.path; draft.state.template = next.template; draft.state.site = siteName(owner);
        draft.bindings = P.normalize({ siteIds: next.siteIds }, { owner, sites, packages, allowed: allowedIds() }); db.configs[id] = draft; persist(); return id;
    }
    function updatePortalPath(id, value) {
        const draft = db.configs[id]; if (!draft) throw Error('ไม่พบ Portal Path'); if (!portalManagerAllowed() || !P.canManage(draft.bindings, allowedIds())) throw Error('ไม่มีสิทธิ์แก้ไข Portal Path นี้');
        const next = portalInput(value, id), owner = draft.ownerSiteId || draft.bindings.siteIds[0]; if (!next.siteIds.includes(owner)) throw Error('ต้องคง Site เจ้าของ Portal Path ไว้');
        draft.state.name = next.name; draft.state.path = next.path; draft.state.template = next.template; draft.bindings = P.normalize({ siteIds: next.siteIds }, { owner, sites, packages, allowed: allowedIds() }); reconcilePortalConfigs(); persist();
    }
    function deletePortalPath(id) {
        const draft = db.configs[id]; if (!draft) throw Error('ไม่พบ Portal Path'); if (!portalManagerAllowed() || !P.canManage(draft.bindings, allowedIds())) throw Error('ไม่มีสิทธิ์ลบ Portal Path นี้');
        if (portalPathChoices().length <= 1) throw Error('ต้องมี Portal Path อย่างน้อย 1 รายการตามสิทธิ์');
        delete db.configs[id]; for (const [siteId, selected] of Object.entries(db.portalSelections)) if (selected === id) delete db.portalSelections[siteId]; reconcilePortalConfigs(); persist();
    }
    function choosePortalPath(portalId) {
        const selected = portalPathChoices().find(c => c.id === portalId); if (!selected) throw Error('ไม่มีสิทธิ์เลือก Portal Path นี้');
        const siteId = selected.siteIds.includes(currentSite) ? currentSite : selected.siteIds[0]; choosePortal(siteId, portalId);
    }
    function choosePortal(siteId, portalId) { if (!portalChoices(siteId).some(c => c.id === portalId)) throw Error('ไม่มีสิทธิ์เลือก Site / Portal นี้'); db.currentSite = siteId; db.portalSelections[siteId] = portalId; persist(); location.reload(); }
    function setBindings(value) { if (!can('editSite')) throw Error('ไม่มีสิทธิ์แก้ไข Portal ร่วมในทุก Site'); const next = P.normalize(value, { owner: ownerSiteId, sites: NT_DATA.sites, packages, allowed: allowedIds() }); if (!next.siteIds.includes(currentSite)) throw Error('เปลี่ยนไป Site เจ้าของ Config ก่อนนำ Site ที่กำลังเปิดออก'); config.bindings = next; reconcilePortalConfigs(); changed(); }
    function selectSite(id) { if (!allowedIds().includes(id)) return toast('ไม่มีสิทธิ์ใน Site'); db.currentSite = id; persist(); location.reload(); }
    window.NT = { q, qa, on, esc, db, user, getUser, state, copy, assets, lists, currentSite, currentPortalId, currentPortalOwnerSiteId: ownerSiteId, portalConfigMode, bindings: () => config.bindings, setBindings, portalChoices, portalPathChoices, createPortalPath, updatePortalPath, deletePortalPath, portalManagerAllowed, choosePortalPath, choosePortal, can, allowedIds, allowedSites: () => NT_DATA.sites.filter(s => allowedIds().includes(s.id)), siteName, fillSites, selectSite, radiusCatalog, setRadiusCatalog, divisions, fillDivisions, selectDivision, currentDivision: () => db.currentDivision, changed, syncFields, toast, validate, download, snapshot, parseConfig, persist, storageStatus: () => ({ ...storageResult }), onChange: f => changeListeners.push(f), onLoad: f => loadListeners.push(f) };
    if (page === 'login' || page === 'print') return;
    if (portalConfigMode === 'configure' && !P.canManage(config.bindings, allowedIds())) {
        const main = q('#page-content'); if (main) { const notice = document.createElement('p'); notice.className = 'nt-notice'; notice.textContent = 'Config นี้ใช้ร่วมกับ Site นอกสิทธิ์ของคุณ การแก้ไขต้องใช้ผู้ดูแลที่มีสิทธิ์ครบทุก Site'; main.prepend(notice); }
    }
    fillDivisions(q('#wt-current-division')); q('#wt-current-user').textContent = user.name + ' · ' + NT_DATA.roles.find(r => r.id === user.role).name;
    on('#wt-current-division', 'change', e => selectDivision(e.target.value)); on('#wt-logout', 'click', logout);
    qa('a[data-nav="users"]').forEach(a => a.hidden = !can('users'));
    syncFields(); status();
    qa('[data-bind]').forEach(el => el.addEventListener('input', () => { if (!can('editSite')) return syncFields(); state[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value; syncFields(); changed(); }));
    if (!can('editSite')) qa('[data-bind],[data-copy],[data-asset],[data-clear],#nt-ai-generate,#nt-ai-apply,#nt-wg-add,#nt-mac-add,#nt-voucher-create,#nt-save,#nt-import-config,#nt-reset-config').forEach(e => e.disabled = true);
    if (!can('export')) q('#nt-export-config')?.setAttribute('disabled', '');
    on('#nt-save', 'click', () => { if (!can('editSite')) return; const errors = validate(); if (errors.length) return toast(errors.join(' · ')); version++; config.version = version; const saved = persist(); status(); toast(saved.local ? 'บันทึก Draft แล้ว' : 'Draft ยังอยู่ในแท็บนี้ แต่เก็บถาวรใน Browser ไม่ได้ กรุณาดาวน์โหลด Config JSON'); });
    on('#nt-export-config', 'click', () => { const errors = validate(); if (errors.length) return toast(errors.join(' · ')); download('Wi-Fi-Config-' + currentPortalId + '-' + state.path.slice(1).replace(/\//g, '_') + '.json', JSON.stringify(snapshot(), null, 2), 'application/json'); });
    on('#nt-import-config', 'click', () => { if (can('editSite')) q('#nt-config-file').click(); });
    on('#nt-config-file', 'change', async () => { const el = q('#nt-config-file'), file = el.files?.[0]; if (!file) return; try { if (!can('editSite')) throw Error('ไม่มีสิทธิ์แก้ Config'); if (file.size > WiFiBanners.limits.config) throw Error('Config ต้องไม่เกิน 60 MB'); apply(JSON.parse((await file.text()).replace(/^\uFEFF/, ''))); toast('โหลด Config แล้ว'); } catch (e) { toast(e.message); } el.value = ''; });
    on('#nt-reset-config', 'click', () => { if (!can('editSite') || !confirm('แทนที่ Draft ของ Site นี้ด้วยค่าตั้งต้น? (คง Portal Path และ Site ที่เลือก)')) return; const doc = D.clone(NT_DATA.config); doc.state.site = siteName(currentPortalId); doc.state.path = state.path; doc.bindings = D.clone(config.bindings); apply(doc); toast('โหลดค่าตั้งต้นแล้ว'); });
    on('#nt-review', 'click', () => { q('#nt-review-results').textContent = validate().join(' · ') || 'ผ่านรูปแบบเบื้องต้น · รอตรวจ Adapter/RADIUS/Provider จริง'; q('#nt-review-panel').hidden = false; });
    window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
})();
