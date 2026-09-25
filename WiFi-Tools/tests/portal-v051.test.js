'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'html/portal-config.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/pages/portal-config.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'data/config.json'),'utf8'));

test('V051 Preview exposes Free Trial and Register as separate steps',()=>{
  assert.match(html,/<option value="freeTrial">Free Trial<\/option>/);
  assert.match(html,/<option value="register">Register<\/option>/);
  assert.match(html,/data-portal-step="freeTrial">Free Trial<\/button>/);
  assert.match(html,/data-portal-step="register">Register<\/button>/);
  assert.match(js,/\['login', 'freeTrial', 'register', 'terms', 'success', 'error'\]/);
});

test('V051 Free Trial and Register use independent field sets and entry paths',()=>{
  assert.match(js,/portalStep === 'freeTrial' \|\| portalStep === 'register'/);
  assert.match(js,/const context = identity \? 'identity' : 'freeTrial'/);
  assert.match(js,/setPortalStep\('freeTrial'\)/);
  assert.match(js,/state\.registerEnabled && !identityVerified\(username\)[\s\S]*setPortalStep\('register'\)/);
  assert.match(js,/previewRegistrationMarkup\(registerContext\)/);
});

test('V051 copy editor separates Free Trial copy from Register identity copy',()=>{
  assert.match(js,/freeTrial:\s*\[/);
  assert.match(js,/copyStepFields\.identity/);
  assert.match(js,/portalStep === 'register' \? copyStepFields\.identity/);
  for(const lang of ['th','en','zh','ja']) assert.equal(typeof config.copy[lang].identityBack,'string');
});
