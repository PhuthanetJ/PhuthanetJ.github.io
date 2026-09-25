'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html', 'radius-policy.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'radius-policy.css'), 'utf8');

test('V053 Account toolbar uses requested action order', () => {
  const ids = [
    'radius-account-create',
    'radius-account-generate',
    'radius-account-import',
    'radius-account-export',
    'radius-account-dispatch',
    'radius-account-delete'
  ];
  const positions = ids.map(id => html.indexOf(`id="${id}"`));
  assert.ok(positions.every(pos => pos >= 0), 'all toolbar actions must exist');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('V053 CREATE and GENERATE both use primary style', () => {
  assert.match(html, /class="nt-button primary" id="radius-account-create"/);
  assert.match(html, /class="nt-button primary" id="radius-account-generate"/);
});

test('V053 IMPORT is green outline and EXPORT is yellow outline', () => {
  assert.match(html, /class="nt-button account-import" id="radius-account-import"/);
  assert.match(html, /class="nt-button account-export" id="radius-account-export">EXPORT<\/button>/);
  assert.match(css, /#radius-account-import\.nt-button\.account-import\s*\{[^}]*color:\s*#18864b;[^}]*border-color:\s*#18864b;[^}]*background:\s*#fff;/s);
  assert.match(css, /#radius-account-export\.nt-button\.account-export\s*\{[^}]*color:\s*#b77900;[^}]*border-color:\s*#d9a514;[^}]*background:\s*#fff;/s);
});

test('V053 DISPATCH is orange with white text and DELETE keeps danger style', () => {
  assert.match(html, /class="nt-button account-dispatch" id="radius-account-dispatch"/);
  assert.match(css, /#radius-account-dispatch\.nt-button\.account-dispatch\s*\{[^}]*color:\s*#fff;[^}]*border-color:\s*#e67e22;[^}]*background:\s*#e67e22;/s);
  assert.match(html, /class="nt-button danger" id="radius-account-delete"/);
});
