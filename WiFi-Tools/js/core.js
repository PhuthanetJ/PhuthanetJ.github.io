/* Shared config, draft handoff, JSON import/export, and form binding.
 * Classic scripts work with file://; no fetch, CDN, npm or backend is required.
 */
(function () {
  'use strict';
  const root = document.getElementById('nt-portal');
  const q = s => root.querySelector(s);
  const qa = s => Array.from(root.querySelectorAll(s));
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const defaults = NT_DATA.config;
  const state = clone(defaults.state);
  const copy = clone(defaults.copy);
  const assets = clone(defaults.assets);
  const lists = clone(defaults.lists);
  const changeListeners = [], loadListeners = [];
  const base = new URL('../', window.location.href).href;
  const key = 'nt-wifi-tools:split-v1:' + base;
  const handoffPrefix = 'NT_WIFI_OFFLINE_DRAFT:';
  let version = 1, dirty = false, changedAt = 0, storageOK = false;
  const toast = text => { q('#nt-toast').textContent = text; };

  function snapshot() {
    return {
      format: defaults.format, schemaVersion: 1, version,
      savedAt: new Date().toISOString(), state, copy, assets, lists
    };
  }

  // Parse a full draft without changing current state; reject before applying.
  function parseConfig(doc, draft) {
    if (!doc || doc.format !== defaults.format || doc.schemaVersion !== 1) {
      throw Error('รูปแบบหรือเวอร์ชัน Config ไม่รองรับ');
    }
    if (!doc.state || !doc.copy || !doc.assets || !doc.lists) throw Error('Config ไม่ครบ');
    const next = { state: {}, copy: { th: {}, en: {} }, assets: {}, lists: { wg: [], mac: [] } };
    for (const name of Object.keys(defaults.state)) {
      const value = doc.state[name];
      if (typeof value !== typeof defaults.state[name]) throw Error('ชนิดข้อมูลไม่ถูกต้อง: ' + name);
      if (typeof value === 'number' && !Number.isFinite(value)) throw Error('ตัวเลขไม่ถูกต้อง: ' + name);
      if (typeof value === 'string' && value.length > 6000) throw Error('ข้อความยาวเกินกำหนด: ' + name);
      next.state[name] = value;
    }
    for (const name of ['buttonColor', 'buttonTextColor']) {
      if (!/^#[0-9a-fA-F]{6}$/.test(next.state[name])) throw Error('สีต้องเป็น #RRGGBB');
    }
    for (const language of ['th', 'en']) {
      for (const name of Object.keys(defaults.copy[language])) {
        const value = doc.copy[language] && doc.copy[language][name];
        if (typeof value !== 'string' || value.length > 6000) throw Error('คำแปลไม่ถูกต้อง');
        next.copy[language][name] = value;
      }
    }
    for (const name of Object.keys(defaults.assets)) {
      const value = doc.assets[name];
      if (typeof value !== 'string' || value.length > 4300000 ||
        (value !== '' && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))) {
        throw Error('รูปต้องเป็น PNG / JPG / WebP ที่ฝังใน JSON');
      }
      next.assets[name] = value;
    }
    for (const name of ['wg', 'mac']) {
      const rows = doc.lists[name];
      if (!Array.isArray(rows) || rows.length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง');
      for (const row of rows) {
        if (!row || typeof row.value !== 'string' || row.value.length > 500 ||
          typeof row.reason !== 'string' || row.reason.length > 1000) throw Error('รายการเครือข่ายไม่ถูกต้อง');
        const entry = { value: row.value, reason: row.reason };
        if (name === 'mac') {
          if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(row.value) ||
            typeof row.expiry !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.expiry)) {
            throw Error('MAC หรือวันหมดอายุไม่ถูกต้อง');
          }
          entry.expiry = row.expiry;
        }
        next.lists[name].push(entry);
      }
    }
    next.version = Number.isInteger(doc.version) && doc.version > 0 ? doc.version : 1;
    if (!draft) {
      const issues = validateState(next.state);
      if (issues.length) throw Error(issues.join(' · '));
    }
    return next;
  }

  function validateState(value) {
    const issues = [];
    if (!value.name.trim()) issues.push('กรอกชื่อ Portal');
    if (!/^\/portal\/[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(value.path)) issues.push('Path ต้องอยู่ใต้ /portal/ เช่น /portal/demo');
    if (!['guest', 'member', 'otp', 'line', 'google', 'facebook', 'apple'].some(k => value[k])) issues.push('เปิดวิธีรับสิทธิ์อย่างน้อย 1 วิธี');
    const ranges = {
      hours: [1, 24], downloadMbps: [1, 10000], uploadMbps: [1, 10000],
      quotaGb: [0, 1000000], concurrent: [1, 100], otpTtl: [30, 900],
      otpResend: [10, 600], otpAttempts: [1, 10], videoSeconds: [1, 3600],
      alertThreshold: [1, 1000000], alertWindow: [1, 1000000]
    };
    for (const [name, [min, max]] of Object.entries(ranges)) {
      if (!Number.isFinite(value[name]) || value[name] < min || value[name] > max) issues.push(name + ' ต้องอยู่ในช่วง ' + min + '–' + max);
    }
    const enums = { shape: ['rounded', 'pill', 'square'], surveyType: ['survey', 'quiz'], voucherMode: ['click', 'coupon'] };
    for (const [name, options] of Object.entries(enums)) {
      if (!options.includes(value[name])) issues.push('ค่าไม่รองรับ: ' + name);
    }
    if (value.surveyEnabled && (!value.question.trim() || value.answers.split(',').filter(x => x.trim()).length < 2)) issues.push('เพิ่มคำถามและตัวเลือกอย่างน้อย 2 ข้อ');
    if (value.surveyEnabled && value.surveyType === 'quiz' && !value.answers.split(',').map(x => x.trim()).includes(value.correctAnswer.trim())) issues.push('คำตอบ Quiz ต้องตรงกับตัวเลือก');
    return issues;
  }
  const validate = () => validateState(state);

  function applyConfig(value) {
    Object.assign(state, value.state);
    Object.assign(copy.th, value.copy.th); Object.assign(copy.en, value.copy.en);
    Object.assign(assets, value.assets);
    lists.wg = value.lists.wg; lists.mac = value.lists.mac;
    version = value.version || 1;
  }

  function syncFields() {
    qa('[data-bind]').forEach(el => {
      const value = state[el.dataset.bind];
      if (el.type === 'checkbox') el.checked = value;
      else el.value = value;
    });
  }

  function status() {
    q('#nt-draft-status').textContent = 'Draft v' + version + (dirty ? ' · มีการแก้ไข' : '');
    q('#nt-save-help').textContent = dirty ? 'Draft มีการแก้ไข · ดาวน์โหลด JSON เพื่อเก็บเป็นไฟล์' : 'ดาวน์โหลด JSON เพื่อเก็บค่าและรูปภาพ';
  }

  function persist() {
    const envelope = JSON.stringify({ key, config: snapshot(), dirty, changedAt });
    storageOK = false;
    try { localStorage.setItem(key, envelope); storageOK = true; } catch (_) { /* File/Private mode or quota. */ }
    // Also carry the same draft through local, same-project navigation when
    // file:// storage is unavailable or isolated per document by the browser.
    try { window.name = handoffPrefix + envelope; storageOK = true; } catch (_) { /* Export stays available. */ }
    return storageOK;
  }

  function restore() {
    const candidates = [];
    try { const stored = localStorage.getItem(key); if (stored) candidates.push(JSON.parse(stored)); } catch (_) { }
    try { if (window.name.startsWith(handoffPrefix)) candidates.push(JSON.parse(window.name.slice(handoffPrefix.length))); } catch (_) { }
    candidates.sort((a, b) => Number(b.changedAt || 0) - Number(a.changedAt || 0));
    for (const item of candidates) {
      if (item.key !== key) continue;
      try {
        applyConfig(parseConfig(item.config, true));
        dirty = !!item.dirty; changedAt = Number(item.changedAt) || 0;
        return;
      } catch (_) { /* Ignore invalid cache; never execute cache contents. */ }
    }
  }

  function changed() {
    dirty = true; changedAt = Date.now(); status();
    persist(); changeListeners.forEach(fn => fn());
  }

  function download(filename, contents, mime) {
    const url = URL.createObjectURL(new Blob([contents], { type: mime }));
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportConfig() {
    const issues = validate();
    if (issues.length) return toast('ยังบันทึกไม่ได้: ' + issues.join(' · '));
    version++; dirty = false; changedAt = Date.now();
    download('NT-WiFi-Config-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(snapshot(), null, 2), 'application/json;charset=utf-8');
    persist(); status(); toast('ส่ง Config JSON ให้เบราว์เซอร์ดาวน์โหลดแล้ว');
  }

  window.NT = {
    q, qa, esc, state, copy, assets, lists, toast, syncFields,
    changed, validate, download, snapshot, parseConfig,
    onChange: fn => changeListeners.push(fn), onLoad: fn => loadListeners.push(fn)
  };
  restore(); syncFields(); status();

  qa('[data-bind]').forEach(el => el.addEventListener('input', () => {
    const name = el.dataset.bind;
    state[name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
    qa('[data-bind]').filter(x => x !== el && x.dataset.bind === name).forEach(x => {
      if (x.type === 'checkbox') x.checked = state[name]; else x.value = state[name];
    });
    changed();
  }));
  qa('a[data-nav]').forEach(link => link.addEventListener('click', () => {
    // Only links generated for this project receive the draft handoff.
    if (new URL(link.href).href.startsWith(base)) persist();
  }));
  window.addEventListener('pagehide', persist);
  window.addEventListener('pageshow', event => {
    if (event.persisted) { restore(); syncFields(); status(); loadListeners.forEach(fn => fn()); }
  });

  q('#nt-export-config').addEventListener('click', exportConfig);
  q('#nt-save').addEventListener('click', exportConfig);
  q('#nt-import-config').addEventListener('click', () => q('#nt-config-file').click());
  q('#nt-config-file').addEventListener('change', async () => {
    const input = q('#nt-config-file'), file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 15000000) { input.value = ''; return toast('Config ต้องไม่เกิน 15 MB'); }
    try {
      const value = parseConfig(JSON.parse((await file.text()).replace(/^\uFEFF/, '')), false);
      applyConfig(value); dirty = false; changedAt = Date.now();
      syncFields(); persist(); status(); q('#nt-review-panel').hidden = true;
      loadListeners.forEach(fn => fn()); toast('โหลด Config พร้อมรูปภาพแล้ว · ใช้ร่วมกันทุกเมนู');
    } catch (error) { toast('โหลด Config ไม่สำเร็จ: ' + error.message); }
    input.value = '';
  });
  q('#nt-reset-config').addEventListener('click', () => {
    if (!window.confirm('โหลดค่าตั้งต้นแทน Draft ปัจจุบัน? หากต้องการเก็บค่าเดิม ให้ดาวน์โหลด JSON ก่อน')) return;
    try {
      applyConfig(parseConfig(clone(defaults), false)); dirty = false; changedAt = Date.now();
      syncFields(); persist(); status(); loadListeners.forEach(fn => fn());
      toast('โหลดค่าตั้งต้นจากชุดข้อมูลโปรเจกต์แล้ว');
    } catch (error) { toast('ค่าตั้งต้นไม่ถูกต้อง: ' + error.message); }
  });
  q('#nt-review').addEventListener('click', () => {
    const issues = validate();
    const rows = issues.map(text => ['ต้องแก้', text]);
    if (!issues.length) rows.push(['ผ่าน', 'รูปแบบ Config พื้นฐาน']);
    rows.push(['รอตรวจ', 'Path ไม่ซ้ำ และ HTTPS ของ Portal'],
      ['รอตรวจ', 'Vendor Adapter ของ ' + state.vendor + ' ตามรุ่นและ Firmware'],
      ['รอตรวจ', 'RADIUS / Authorize / Accounting / Timeout กับระบบจริง']);
    if (state.otp || state.line || state.google || state.facebook || state.apple) rows.push(['รอตรวจ', 'Provider credentials และ Callback']);
    q('#nt-review-results').innerHTML = rows.map(row => '<div class="nt-module"><div>' + esc(row[1]) + '</div><span class="nt-badge ' + (row[0] === 'ผ่าน' ? 'good' : 'pending') + '">' + row[0] + '</span></div>').join('');
    q('#nt-review-panel').hidden = false;
    toast('ตรวจ Config ต้นแบบแล้ว · ยังไม่มีการเชื่อมต่อหรือ Deploy');
  });
})();
