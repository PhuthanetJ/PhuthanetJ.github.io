'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'html/portal-config.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/pages/portal-config.js'),'utf8');
const appJs=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'data/config.json'),'utf8'));
const D=require('../js/domain.js'), data={};
for(const f of fs.readdirSync(path.join(root,'data'))) if(f.endsWith('.json')) data[f.slice(0,-5)]=JSON.parse(fs.readFileSync(path.join(root,'data',f),'utf8'));
function make(name='',page='login'){
  const node=()=>({addEventListener(){},setAttribute(){},prepend(){}}), nodes=new Map();
  const rootNode={dataset:{page},querySelector:s=>{if(page==='login') return null; if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll:()=>[]};
  const c={NT_DATA:data,WiFiDomain:D,WiFiPortalBindings:require('../js/portal-bindings.js'),WiFiBanners:require('../js/banner-model.js'),URL,Date,JSON,console,location:{href:'file:///demo/html/'+page+'.html',replace(){},reload(){}},document:{getElementById:()=>rootNode,createElement:node},localStorage:{getItem:()=>null,setItem(){}},setTimeout};
  c.window=c;c.name=name;c.addEventListener=()=>{};vm.createContext(c);vm.runInContext(appJs,c);return c;
}
function authenticated(){ const first=make(); first.WiFiAuth.login('admin','Demo1234!'); return make(first.name,'settings'); }

test('V049 config stores independent Free Trial and identity field sets',()=>{
  assert.equal(config.schemaVersion,11);
  assert.match(html,/Free Trial Fields/);
  assert.match(html,/Register Identity Fields/);
  assert.match(js,/freeTrialPanel\.hidden = !state\.guest/);
  assert.match(js,/identityPanel\.hidden = !state\.registerEnabled/);
  assert.doesNotMatch(html,/Field ชุดนี้ใช้ทั้ง Free Trial/);
});

test('V049 validation checks each field set independently',()=>{
  assert.match(appJs,/เลือก Free Trial Field อย่างน้อย 1 รายการ/);
  assert.match(appJs,/เลือก Register Identity Field อย่างน้อย 1 รายการ/);
  const c=authenticated(), doc=JSON.parse(JSON.stringify(c.NT.snapshot()));
  doc.state.guest=true;
  for(const k of Object.keys(doc.state).filter(k=>/^freeTrial.*Enabled$/.test(k))) doc.state[k]=false;
  assert.throws(()=>c.NT.parseConfig(doc),/Free Trial Field/);
  const doc2=JSON.parse(JSON.stringify(c.NT.snapshot()));
  doc2.state.registerEnabled=true;
  for(const k of Object.keys(doc2.state).filter(k=>/^identity.*Enabled$/.test(k))) doc2.state[k]=false;
  assert.throws(()=>c.NT.parseConfig(doc2),/Register Identity Field/);
});

test('V049 imports schema 10 by copying legacy field selection into both new sets once',()=>{
  const c=authenticated(), legacy=JSON.parse(JSON.stringify(c.NT.snapshot()));
  legacy.schemaVersion=10;
  for(const k of Object.keys(legacy.state).filter(k=>/^(freeTrial|identity).*Enabled$/.test(k))) delete legacy.state[k];
  legacy.state.registerNameEnabled=true;
  legacy.state.registerGenderEnabled=false;
  legacy.state.registerThaiCitizenIdEnabled=false;
  legacy.state.registerPassportEnabled=true;
  legacy.state.registerBirthdayEnabled=false;
  legacy.state.registerMobileEnabled=true;
  legacy.state.registerEmailEnabled=true;
  legacy.state.registerProvinceEnabled=false;
  const loaded=c.NT.parseConfig(legacy);
  assert.equal(loaded.state.freeTrialNameEnabled,true); assert.equal(loaded.state.identityNameEnabled,true);
  assert.equal(loaded.state.freeTrialGenderEnabled,false); assert.equal(loaded.state.identityGenderEnabled,false);
  assert.equal(loaded.state.freeTrialPassportEnabled,true); assert.equal(loaded.state.identityPassportEnabled,true);
});
