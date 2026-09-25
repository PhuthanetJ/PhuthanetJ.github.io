const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/pages/portal-config.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));

test('V044 Login Preview no longer renders a Terms accept/link control', () => {
  assert.doesNotMatch(js, /nt-public-terms-link/);
  assert.doesNotMatch(js, /wt-portal-terms-inline-link/);
  assert.match(js, /proceedAfterActionNoVideo/);
  assert.match(js, /setPortalStep\('terms'\)/);
});

test('V044 Register and Terms back buttons use the same secondary button style as Error', () => {
  const count = (js.match(/nt-public-button wt-secondary[^\n]+data-preview-back="login"/g) || []).length;
  assert.ok(count >= 4, 'expected Register, Terms, Success/Error secondary actions');
  assert.doesNotMatch(js, /class="wt-portal-back-link" data-preview-back/);
});

test('V044 Portal copy editor follows Login Register Terms Success Error selection', () => {
  assert.match(html, /id="wt-copy-step"/);
  for (const step of ['login','register','terms','success','error']) assert.match(html, new RegExp(`<option value="${step}">${step[0].toUpperCase()+step.slice(1)}</option>`));
  assert.match(js, /copyStepFields/);
  assert.match(js, /syncCopyEditor\(\)/);
  assert.match(js, /stepSelect\.value = portalStep/);
});

test('V044 page-specific copy fields are stored for all four languages', () => {
  const required = ['registerTitle','registerSubtitle','registerButton','registerBack','termsTitle','termsAccept','termsBack','successTitle','successSubtitle','successButton','successLogout','errorTitle','errorBack'];
  for (const lang of ['th','en','zh','ja']) for (const key of required) assert.equal(typeof config.copy[lang][key], 'string', `${lang}.${key}`);
  assert.equal(config.schemaVersion, 11);
  assert.match(app, /schemaVersion: 11/);
  assert.match(app, /doc\.copy\[lang\]\?\.\[k\] === undefined \? fallback/);
});

test('V044 editing copy does not force Preview back to Login', () => {
  assert.doesNotMatch(js, /NT\.onChange\(\(\) => \{ previewMode = 'normal'; portalStep = 'login'/);
  assert.match(js, /previewMode = portalStep === 'error' \? 'error' : 'normal'/);
});
