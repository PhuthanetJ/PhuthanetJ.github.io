const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/pages/portal-config.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/portal-config.css'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));

test('V046 Portal Preview follows long editors on desktop with sticky positioning', () => {
  assert.match(css, /\.nt-editor-grid > \.nt-preview-wrap/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /max-height:\s*calc\(100vh - 24px\)/);
  assert.match(css, /@media \(min-width: 1001px\)/);
});

test('V046 Login copy editor has a login-method selector', () => {
  assert.match(html, /id="wt-copy-login-method"/);
  assert.match(js, /loginCopyMethods/);
  for (const method of ['guest','member','otp','thaid','social']) assert.match(js, new RegExp(method + ':'));
  assert.match(js, /syncLoginCopyMethodOptions/);
});

test('V046 Preview button labels use page copy for each login method', () => {
  for (const key of ['memberButton','thaidButton','registerOpenButton','socialLabel']) assert.match(js, new RegExp('c\\.' + key));
  assert.match(js, /esc\(c\.otp\)/);
  assert.match(js, /registerOpenButton/);
});

test('V046 all languages have editable login-method button labels', () => {
  for (const lang of ['th','en','zh','ja']) {
    for (const key of ['button','otp','memberButton','thaidButton','registerOpenButton','socialLabel']) {
      assert.equal(typeof config.copy[lang][key], 'string', `${lang}.${key}`);
      assert.ok(config.copy[lang][key].length > 0, `${lang}.${key}`);
    }
  }
});
