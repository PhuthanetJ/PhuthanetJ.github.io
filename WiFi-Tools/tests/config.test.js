'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('../js/domain.js'), data = {};
for (const f of fs.readdirSync(path.join(__dirname, '../data'))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));
function app(name = '', page = 'login') {
    const nodes = new Map(), node = () => ({ addEventListener() { }, setAttribute() { }, prepend() { } });
    const root = { dataset: { page }, querySelector: s => { if (page === 'login') return null; if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); }, querySelectorAll: () => [] };
    const c = { NT_DATA: data, WiFiDomain: D, WiFiPortalBindings: require('../js/portal-bindings.js'), WiFiBanners: require('../js/banner-model.js'), URL, Date, JSON, console, location: { href: 'file:///demo/html/' + page + '.html', replace() { }, reload() { } }, document: { getElementById: () => root, createElement: node }, localStorage: { getItem: () => null, setItem() { } }, setTimeout };
    c.window = c; c.name = name; c.addEventListener = () => { };
    vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), c); return c;
}
test('Migrate old site drafts without losing custom path or acceptance label', () => {
    const first = app(), db = first.WiFiStore.get();
    db.configs.a.state.path = '/portal/lobby'; db.configs.a.state.termsTh = 'อ่านและยอมรับข้อกำหนด';
    delete db.configs.a.state.termsBodyTh; delete db.configs.a.state.termsBodyEn;
    db.configs.b.state.termsBodyTh = 'เงื่อนไขเฉพาะ Site B';
    first.WiFiStore.save(); const next = app(first.name);
    assert.equal(next.NT.state.path, '/portal/lobby'); assert.equal(next.NT.state.termsTh, 'อ่านและยอมรับข้อกำหนด');
    assert.equal(next.NT.state.termsBodyTh, data.config.state.termsBodyTh);
    assert.equal(next.NT.db.configs.b.state.termsBodyTh, 'เงื่อนไขเฉพาะ Site B');
});
test('Terms, newlines and Portal Path survive the JSON export/import round trip', () => {
    const c = app(); c.NT.state.path = '/portal/lobby/free-wifi';
    c.NT.state.termsBodyTh = 'ข้อกำหนดไทย\nบรรทัดที่สอง\n<script>ข้อความธรรมดา</script>';
    c.NT.state.termsBodyEn = 'Terms in English\nSecond line';
    const doc = JSON.parse(JSON.stringify(c.NT.snapshot())), loaded = c.NT.parseConfig(doc);
    assert.equal(doc.siteId, 'a'); assert.equal(loaded.state.path, c.NT.state.path);
    assert.equal(loaded.state.termsBodyTh, c.NT.state.termsBodyTh);
    assert.equal(loaded.state.termsBodyEn, c.NT.state.termsBodyEn);
    assert.throws(() => c.NT.parseConfig({ ...doc, siteId: 'b' }), /เลือก Portal Path/);
});
test('Old JSON can load, but blank or malformed new terms are rejected', () => {
    const c = app(), legacy = D.clone(data.config); delete legacy.state.termsBodyTh; delete legacy.state.termsBodyEn;
    assert.equal(c.NT.parseConfig(legacy).state.termsBodyTh, data.config.state.termsBodyTh);
    const current = D.clone(data.config); current.state.termsBodyTh = '   ';
    assert.throws(() => c.NT.parseConfig(current), /เนื้อหาเงื่อนไข/);
    current.state.termsBodyTh = { html: 'invalid' }; assert.throws(() => c.NT.parseConfig(current), /ชนิดข้อมูล/);
    current.state.termsBodyTh = 'a'.repeat(6001); assert.throws(() => c.NT.parseConfig(current), /ชนิดข้อมูล/);
});
test('A Site Admin cannot select another site config through the shared selector API', () => {
    const first = app(); first.WiFiAuth.login('siteadmin', 'Demo1234!');
    const next = app(first.name); let reloads = 0; next.location.reload = () => reloads++;
    next.NT.selectSite('b'); assert.equal(next.NT.db.currentSite, 'a'); assert.equal(reloads, 0);
    assert.deepEqual(Array.from(next.NT.allowedSites(), s => s.id), ['a']);
});
test('Legacy banner migration preserves media within its own site', () => {
    const first = app(), db = first.WiFiStore.get(), src = 'data:image/png;base64,AQID';
    delete db.configs.a.assets.banners; db.configs.a.assets.banner = src; first.WiFiStore.save();
    const next = app(first.name); assert.equal(next.NT.assets.banners[0].src, src); assert.equal(next.NT.assets.banner, '');
    assert.equal(next.NT.db.configs.b.assets.banners.length, 0);
    const doc = D.clone(data.config); doc.schemaVersion = 2; delete doc.assets.banners; doc.assets.banner = src;
    assert.equal(next.NT.parseConfig(doc).assets.banners[0].src, src);
});
test('JSON export/import preserves mixed banners and disabled items', () => {
    const c = app(); c.NT.assets.banners = [{ id: 'b1', type: 'image', name: 'Photo', fileName: 'photo.jpg', src: 'data:image/jpeg;base64,AQID', link: 'https://example.com/promo', enabled: true }, { id: 'b2', type: 'video', name: 'Video', fileName: 'clip.webm', src: 'data:video/webm;base64,AQID', link: '', enabled: false }];
    const doc = JSON.parse(JSON.stringify(c.NT.snapshot())), loaded = c.NT.parseConfig(doc);
    assert.deepEqual(loaded.assets.banners.map(({area, clickable, action, questionnaireIds, ...original}) => original), doc.assets.banners);
    doc.assets.banners[0].link = 'javascript:alert(1)'; assert.throws(() => c.NT.parseConfig(doc));
});
test('Storage quota failure is reported while the current tab retains the config', () => {
    const c = app(); c.localStorage.setItem = () => { throw Error('QuotaExceededError'); };
    c.NT.state.name = 'Latest draft'; const result = c.NT.persist();
    assert.equal(result.local, false); assert.equal(result.handoff, true); assert.equal(c.NT.storageStatus().local, false);
    const restored = app(c.name); assert.equal(restored.NT.state.name, 'Latest draft');
});
test('A shared Portal opens the same config from either assigned site and keeps other configs intact', () => {
    const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const a = app(first.name, 'settings');
    const originalB = JSON.stringify(a.NT.db.configs.b); a.NT.state.name = 'Shared lobby';
    a.NT.setBindings({ siteIds: ['a', 'b'], packageIds: ['pkg-0', 'pkg-1', 'pkg-2'] }); a.NT.choosePortal('b', 'a');
    const b = app(a.name, 'settings'); assert.equal(b.NT.currentSite, 'b'); assert.equal(b.NT.currentPortalId, 'a'); assert.equal(b.NT.state.name, 'Shared lobby');
    assert.equal(JSON.stringify(b.NT.db.configs.b), originalB);
    const doc = JSON.parse(JSON.stringify(b.NT.snapshot())); assert.equal(doc.siteId, 'a'); assert.equal(doc.schemaVersion, 8);
    assert.deepEqual(b.NT.parseConfig(doc).bindings, { siteIds: ['a', 'b'], packageSource: 'radius-manager-allow-package', packageIds: ['pkg-0', 'pkg-1', 'pkg-2'] });
    assert.deepEqual(Array.from(b.NT.portalChoices('b'), p => p.id), ['a', 'b']);
});
test('A Site Admin cannot shrink shared scope to gain edit or Config export rights', () => {
    const first = app(); first.WiFiAuth.login('admin', 'Demo1234!'); const a = app(first.name, 'settings'); a.NT.setBindings({ siteIds: ['a', 'b'], packageIds: ['pkg-0'] });
    a.WiFiAuth.login('siteadmin', 'Demo1234!'); const limited = app(a.name, 'settings');
    assert.equal(limited.NT.can('editSite'), false); assert.equal(limited.NT.can('export'), false);
    assert.throws(() => limited.NT.setBindings({ siteIds: ['a'], packageIds: ['pkg-0'] }), /ไม่มีสิทธิ์/);
    assert.deepEqual(Array.from(limited.NT.bindings().siteIds), ['a', 'b']);
    assert.throws(() => limited.NT.choosePortal('b', 'b'), /ไม่มีสิทธิ์/);
});
test('Legacy imports migrate sites and replace manual Package choices with current Allow Package', () => {
    const c = app(), legacy = D.clone(data.config); legacy.schemaVersion = 3; delete legacy.bindings;
    assert.deepEqual(c.NT.parseConfig(legacy).bindings, { siteIds: ['a'], packageSource: 'radius-manager-allow-package', packageIds: ['pkg-0', 'pkg-1'] });
    const doc = D.clone(data.config); doc.schemaVersion = 4; doc.bindings = { siteIds: ['a', 'b'], packageIds: ['pkg-1'] };
    assert.deepEqual(c.NT.parseConfig(doc).bindings.packageIds, ['pkg-0', 'pkg-1', 'pkg-2']);
    doc.bindings.packageIds = ['pkg-2', 'untrusted-id']; assert.deepEqual(c.NT.parseConfig(doc).bindings.packageIds, ['pkg-0', 'pkg-1', 'pkg-2']);
});
test('Stored manual selections are recomputed from RADIUS Site Allow Package on startup', () => {
    const c = app(); c.NT.db.configs.a.bindings.packageIds = ['pkg-2']; c.NT.db.configs.a.state.policyName = 'Old manual policy'; c.NT.persist();
    const next = app(c.name); assert.deepEqual(next.NT.bindings().packageIds, ['pkg-0', 'pkg-1']);
    assert.equal(next.NT.state.policyName, undefined); assert.equal(next.NT.snapshot().bindings.packageSource, 'radius-manager-allow-package');
});

test('Banner areas and linked questionnaires survive Config export/import and stored draft reload', () => {
    const c=app(); c.NT.assets.banners=require('../js/banner-model.js').parse([{id:'v-area',type:'video',name:'Welcome',fileName:'welcome.mp4',src:'data:video/mp4;base64,AQID',link:'',enabled:true,area:'first',clickable:true,action:'questionnaires',questionnaireIds:['customer-age','wifi-quiz']}]);
    c.NT.lists.questionnaires[0].name='Edited age';
    const doc=JSON.parse(JSON.stringify(c.NT.snapshot())), next=c.NT.parseConfig(doc);
    assert.deepEqual(next.assets.banners,doc.assets.banners); assert.deepEqual(next.lists.questionnaires,doc.lists.questionnaires);
    c.NT.persist(); const restored=app(c.name);
    assert.equal(restored.NT.assets.banners[0].area,'first'); assert.equal(restored.NT.lists.questionnaires[0].name,'Edited age');
    doc.assets.banners[0].questionnaireIds=['missing']; assert.throws(()=>c.NT.parseConfig(doc),/ไม่พบ Questionnaire/);
});
test('Old Config and drafts gain questionnaires without losing the original portal question', () => {
    const c=app(),old=JSON.parse(JSON.stringify(c.NT.snapshot())); old.schemaVersion=5;delete old.lists.questionnaires; old.state.question='คำถามเดิมของฉัน';
    assert.equal(c.NT.parseConfig(old).state.question,'คำถามเดิมของฉัน');assert.ok(c.NT.parseConfig(old).lists.questionnaires.length);
    old.schemaVersion=6;assert.throws(()=>c.NT.parseConfig(old),/Questionnaires/);
    delete c.NT.lists.questionnaires;c.NT.persist();assert.ok(app(c.name).NT.lists.questionnaires.length);
});

test('Legacy standalone question migrates to the shared catalog without changing video bindings',()=>{
    const c=app(),doc=JSON.parse(JSON.stringify(c.NT.snapshot()));doc.schemaVersion=6;delete doc.lists.portalQuestionnaireIds;
    doc.state.surveyEnabled=true;doc.state.surveyType='quiz';doc.state.question='My previous quiz';doc.state.answers='Yes,No';doc.state.correctAnswer='No';
    const loaded=c.NT.parseConfig(doc),id=loaded.lists.portalQuestionnaireIds[0],item=loaded.lists.questionnaires.find(q=>q.id===id);
    assert.equal(item.question,'My previous quiz');assert.equal(item.correctAnswer,'No');assert.equal(item.type,'quiz');
    const legacy=JSON.parse(JSON.stringify(c.NT.snapshot()));legacy.schemaVersion=6;delete legacy.lists.portalQuestionnaireIds;
    assert.deepEqual(c.NT.parseConfig(legacy).lists.portalQuestionnaireIds,['wifi-purpose']);
    const bad=JSON.parse(JSON.stringify(c.NT.snapshot()));bad.lists.portalQuestionnaireIds=['missing'];assert.throws(()=>c.NT.parseConfig(bad),/Questionnaire/);
    bad.lists.portalQuestionnaireIds=[];bad.state.surveyEnabled=true;assert.throws(()=>c.NT.parseConfig(bad),/อย่างน้อย 1 ข้อ/);
});
test('Path-only selection finds all permitted Paths and opens the same shared Config',()=>{
    const c=app();c.WiFiAuth.login('admin','Demo1234!');c.NT.choosePortalPath('b');
    const next=app(c.name,'settings');assert.equal(next.NT.currentPortalId,'b');assert.equal(next.NT.state.path,'/portal/site-b');
    assert.deepEqual(Array.from(next.NT.portalPathChoices(),row=>row.path),['/portal/site-a','/portal/site-b','/portal/site-c']);
    next.NT.setBindings({siteIds:['a','b']});next.NT.choosePortalPath('a');const back=app(next.name,'settings');back.NT.choosePortalPath('b');
    assert.equal(app(back.name,'settings').NT.currentPortalId,'b');
    const limited=app();limited.WiFiAuth.login('siteadmin','Demo1234!');
    assert.deepEqual(Array.from(limited.NT.portalPathChoices(),row=>row.id),['a']);assert.throws(()=>limited.NT.choosePortalPath('b'),/ไม่มีสิทธิ์/);
});

test('V037 migrates legacy Facebook Login to thaiD and fills new multilingual copy/terms defaults', () => {
    const c = app(), legacy = JSON.parse(JSON.stringify(c.NT.snapshot()));
    legacy.schemaVersion = 7;
    legacy.state.facebook = true;
    delete legacy.state.thaid;
    for (const key of ['termsZh','termsJa','termsBodyZh','termsBodyJa','videoBannerId']) delete legacy.state[key];
    delete legacy.copy.zh; delete legacy.copy.ja;
    const loaded = c.NT.parseConfig(legacy);
    assert.equal(loaded.state.thaid, true);
    assert.equal(loaded.state.termsZh, data.config.state.termsZh);
    assert.equal(loaded.state.termsBodyJa, data.config.state.termsBodyJa);
    assert.equal(loaded.copy.zh.title, data.config.copy.zh.title);
    assert.equal(loaded.copy.ja.title, data.config.copy.ja.title);
});

test('V037 Video Ads validates the selected Video Banner relationship', () => {
    const c = app(), doc = JSON.parse(JSON.stringify(c.NT.snapshot()));
    doc.state.videoEnabled = true; doc.state.videoSeconds = 15; doc.state.videoBannerId = '';
    assert.throws(() => c.NT.parseConfig(doc), /Video Ads ต้องเลือก Video Banner/);
    doc.assets.banners = [{ id:'video-ad', type:'video', name:'Video Ad', fileName:'ad.mp4', src:'data:video/mp4;base64,AQID', link:'', enabled:true, area:'b01', clickable:false, action:'link', questionnaireIds:[] }];
    doc.state.videoBannerId = 'video-ad';
    assert.equal(c.NT.parseConfig(doc).state.videoBannerId, 'video-ad');
    doc.state.videoBannerId = 'missing';
    assert.throws(() => c.NT.parseConfig(doc), /Video Ads ต้องเลือก Video Banner/);
});
