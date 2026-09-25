const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/pages/portal-config.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/portal-config.css'), 'utf8');

test('V041 Portal Preview exposes Login/Register/Terms/Success/Error flow controls', () => {
  for (const step of ['login', 'register', 'terms', 'success', 'error']) {
    assert.match(html, new RegExp(`data-portal-step="${step}"`));
  }
  assert.match(js, /portalStep = 'login'/);
  assert.match(js, /function setPortalStep\(step\)/);
});

test('V041 Register submit advances to Terms or Success using configured Terms', () => {
  assert.match(js, /wt-preview-register-form/);
  assert.match(js, /state\.termsEnabled && termBody\(language\)\.trim\(\)/);
  assert.match(js, /setPortalStep\('terms'\)/);
  assert.match(js, /setPortalStep\('success'\)/);
});

test('V041 Portal Preview uses selected registration fields, Province options and current Terms', () => {
  assert.match(js, /previewRegistrationMarkup/);
  assert.match(js, /provinceOptions\(\)/);
  assert.match(js, /termBody\(language\)/);
});

test('Portal visual shell keeps language pill and footer navigation', () => {
  assert.match(html, /id="wt-portal-language-pill"/);
  assert.match(html, /class="wt-portal-footer-nav"/);
  assert.match(css, /V041 Portal visual flow preview/);
});

test('V041 Preview supports explicit Success and Error screens without a backend', () => {
  assert.match(js, /portalStep === 'success'/);
  assert.match(js, /เข้าสู่ระบบสำเร็จ/);
  assert.match(js, /portalStep === 'error'/);
  assert.match(js, /DEMO-001/);
});
