'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html', 'radius-policy.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'radius-policy.css'), 'utf8');

test('V052 Account DELETE keeps destructive semantic class', () => {
  assert.match(html, /id="radius-account-delete"[^>]*class="[^"]*\bdanger\b[^"]*"|class="[^"]*\bdanger\b[^"]*"[^>]*id="radius-account-delete"/);
});

test('V052 Account DELETE uses outlined red destructive styling', () => {
  assert.match(css, /#radius-account-delete\.nt-button\.danger\s*\{[^}]*color:\s*#a20e18;[^}]*border-color:\s*#e7b3b8;[^}]*background:\s*#fff;/s);
});
