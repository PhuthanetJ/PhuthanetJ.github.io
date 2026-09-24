'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'js/pages/portal-config.js'), 'utf8');
const css = fs.readFileSync(path.join(base, 'css/portal-config.css'), 'utf8');

test('V038 groups LINE Google Apple under Social Login and keeps thaiD separate', () => {
  assert.match(html, /<h3>Social Login<\/h3>/);
  assert.match(html, /wt-social-provider-picker[\s\S]*data-bind="line"[\s\S]*data-bind="google"[\s\S]*data-bind="apple"/);
  assert.match(html, /data-bind="thaid">thaiD Login/);
  assert.match(js, /socialProviders = \[/);
  assert.match(js, /nt-public-social-button/);
  assert.match(css, /\.nt-public-social-button/);
});

test('V038 Free Wi-Fi registration button follows registerEnabled', () => {
  assert.match(html, /data-bind="registerEnabled">ลงทะเบียน Free Wi-Fi/);
  assert.match(js, /if \(state\.registerEnabled\) html \+= '[^']*nt-public-register/);
  assert.match(js, /register: 'ลงทะเบียน Free Wi-Fi'/);
  assert.match(js, /#nt-public-register/);
});
