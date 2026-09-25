'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'html/portal-config.html'),'utf8');

test('V055 Login/OTP authentication methods follow requested order',()=>{
  const section=html.slice(html.indexOf('<h3>วิธีเข้าสู่ระบบ</h3>'), html.indexOf('<h3>SMS / OTP Profile</h3>'));
  const positions=[
    section.indexOf('data-bind="member"'),
    section.indexOf('data-bind="otp"'),
    section.indexOf('data-bind="thaid"'),
    section.indexOf('<h3>Social Login</h3>'),
    section.indexOf('data-bind="registerEnabled"'),
    section.indexOf('data-bind="guest"')
  ];
  assert.ok(positions.every(v=>v>=0));
  for(let i=1;i<positions.length;i++) assert.ok(positions[i-1] < positions[i], `method order mismatch at index ${i}`);
});
