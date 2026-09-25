const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'html/portal-config.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/portal-config.css'), 'utf8');

test('V047 operational shortcut cards live in the left editor column before the Preview', () => {
  const quick = html.indexOf('class="nt-quick-settings nt-quick-settings-left"');
  const preview = html.indexOf('class="nt-preview-wrap"');
  assert.ok(quick > -1, 'left quick settings exists');
  assert.ok(preview > -1, 'preview exists');
  assert.ok(quick < preview, 'quick settings are rendered before/right-preview sibling');
  const editorStart = html.indexOf('class="nt-editor-grid"');
  assert.ok(editorStart < quick && quick < preview);
  for (const heading of ['ฟังก์ชันการทำงาน', 'Walled Garden / MAC', 'Reports']) {
    assert.ok(html.indexOf(heading, quick) > quick && html.indexOf(heading, quick) < preview, heading);
  }
});

test('V047 left quick settings stack vertically so they do not compete with sticky Preview width', () => {
  assert.match(css, /\.nt-quick-settings-left\s*\{/);
  assert.match(css, /\.nt-quick-settings-left \.nt-mini-cards\s*\{[\s\S]*grid-template-columns:\s*1fr/);
});
