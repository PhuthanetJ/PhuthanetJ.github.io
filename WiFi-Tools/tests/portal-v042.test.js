const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/pages/portal-config.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/portal-config.css'), 'utf8');

test('V042 removes decorative person illustration from Portal Preview', () => {
  assert.doesNotMatch(html, /wt-portal-illustration|wt-portal-person|wt-portal-phone|wt-portal-laptop/);
  assert.doesNotMatch(css, /wt-portal-illustration|wt-portal-person|wt-portal-phone|wt-portal-laptop/);
});

test('V042 removes Template FREE WiFi strip from Portal Preview', () => {
  assert.doesNotMatch(html, /wt-portal-template-strip|Template01 · FREE WiFi/);
  assert.doesNotMatch(js, /wt-portal-template-strip|· FREE WiFi/);
  assert.doesNotMatch(css, /wt-portal-template-strip/);
});

test('V042 keeps language, logo and portal flow shell', () => {
  assert.match(html, /id="wt-portal-language-pill"/);
  assert.match(html, /id="nt-wordmark"/);
  assert.match(html, /id="nt-public-content"/);
});
