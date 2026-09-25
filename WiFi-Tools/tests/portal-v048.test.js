'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'html/portal-config.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/pages/portal-config.js'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'data/config.json'),'utf8'));

test('V048 Free Trial means Register Free Wi-Fi',()=>{
  assert.match(html,/Free Trial · ลงทะเบียน Free Wi-Fi/);
  assert.match(js,/if \(state\.guest\)[\s\S]*nt-public-connect/);
  assert.match(js,/registerContext = 'freeTrial'/);
});

test('V048 Register is first-time identity verification after username password login',()=>{
  assert.match(html,/Register · ยืนยันตัวตนหลัง Username \/ Password ครั้งแรก/);
  assert.match(js,/handleMemberLogin/);
  assert.match(js,/state\.registerEnabled && !identityVerified\(username\)/);
  assert.match(js,/markIdentityVerified\(pendingIdentityUsername\)/);
  assert.match(js,/copyStepFields\.identity/);
  assert.match(app,/identityVerified:\s*\{\}/);
});

test('V048 identity copy exists in every portal language',()=>{
  assert.equal(config.schemaVersion,11);
  for(const lang of ['th','en','zh','ja']) for(const key of ['identityTitle','identitySubtitle','identityButton']) assert.ok(config.copy[lang][key]);
});
