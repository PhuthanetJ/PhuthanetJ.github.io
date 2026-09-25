'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');

test('V050 Account toolbar has no EDIT button or general edit dialog', () => {
  const html = fs.readFileSync(path.join(__dirname, '../html/radius-policy.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../js/pages/radius-account.js'), 'utf8');
  assert.doesNotMatch(html, /id="radius-account-edit"/);
  assert.doesNotMatch(html, /id="radius-account-edit-dialog"/);
  assert.doesNotMatch(js, /#radius-account-edit/);
  for (const action of ['radius-account-create','radius-account-generate','radius-account-import','radius-account-dispatch','radius-account-delete','radius-account-export']) assert.match(html, new RegExp('id="' + action + '"'));
});
