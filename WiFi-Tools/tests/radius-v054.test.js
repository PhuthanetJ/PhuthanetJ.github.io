'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const nas = fs.readFileSync(path.join(__dirname, '../js/pages/radius-nas.js'), 'utf8');
test('V054 NAS localStorage failure uses session/RAM fallback instead of disabling CREATE', () => {
  assert.match(app, /radiusNasSessionKey/);
  assert.match(app, /sessionStorage\.setItem\(radiusNasSessionKey/);
  assert.doesNotMatch(app, /db\.radiusNas = previousNas/);
  assert.doesNotMatch(app, /NAS มี Secret จึงต้องบันทึกผ่าน localStorage เท่านั้น/);
  assert.match(nas, /localStorage เต็มหรือใช้งานไม่ได้/);
  assert.doesNotMatch(nas, /Browser บันทึก NAS Draft ไม่ได้: ไม่ได้เปลี่ยนข้อมูล/);
});
