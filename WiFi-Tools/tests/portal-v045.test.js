const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/pages/portal-config.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/portal-config.css'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));

test('V045 Design groups four Portal button color pairs', () => {
  for (const key of ['buttonColor','buttonTextColor','backButtonColor','backButtonTextColor','registerButtonColor','registerButtonTextColor','thaidButtonColor','thaidButtonTextColor']) {
    assert.match(html, new RegExp(`data-bind="${key}"`), key);
    assert.match(config.state[key], /^#[0-9a-f]{6}$/i, key);
  }
  for (const label of ['Submit','Back','ลงทะเบียน Free Wi-Fi','เข้าสู่ระบบด้วย thaiD']) assert.match(html, new RegExp(label));
});

test('V045 Preview maps button types to independent classes and CSS variables', () => {
  for (const cls of ['wt-btn-submit','wt-btn-back','wt-btn-register','wt-btn-thaid']) {
    assert.match(js, new RegExp(cls));
    assert.match(css, new RegExp(cls));
  }
  for (const variable of ['--portal-submit-button','--portal-back-button','--portal-register-button','--portal-thaid-button']) assert.match(js, new RegExp(variable));
});

test('V045 thaiD Portal button has an inline generic ID icon', () => {
  assert.match(js, /class="wt-thaid-icon"/);
  assert.match(js, /viewBox="0 0 24 24"/);
  assert.match(css, /\.wt-thaid-icon/);
});

test('V045 older drafts receive new button colors through migration and validation', () => {
  for (const key of ['backButtonColor','backButtonTextColor','registerButtonColor','registerButtonTextColor','thaidButtonColor','thaidButtonTextColor']) assert.match(app, new RegExp(key));
  assert.match(app, /\['buttonColor', 'buttonTextColor', 'backButtonColor'/);
  assert.equal(config.schemaVersion, 9);
});
