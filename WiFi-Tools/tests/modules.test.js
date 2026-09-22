'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const plan=require('../data/server-plan.json'),modules=require('../data/modules.json');
test('Separate-server allocation includes OS, data and backup once and maps every module to a real VM',()=>{
    const ids=plan.servers.map(s=>s.id);assert.equal(ids.length,new Set(ids).size);
    assert.ok(plan.servers.every(s=>s.count===1&&s.vcpu>0&&s.ramGiB>0&&s.osDiskGB>0&&s.dataDiskGB>=0));
    assert.ok(modules.every(m=>m.servers.length&&m.servers.every(id=>ids.includes(id))));
    const total=plan.servers.reduce((t,s)=>[t[0]+s.count,t[1]+s.count*s.vcpu,t[2]+s.count*s.ramGiB,t[3]+s.count*(s.osDiskGB+s.dataDiskGB)],[0,0,0,0]);
    assert.deepEqual(total,[12,78,316,71560]);assert.equal(plan.servers.find(s=>s.id==='backup').dataDiskGB,60000);
    assert.ok(plan.assumptions.some(s=>s.includes('ไม่ใช่ HA')||s.includes('ไม่มี Replica')));
});
test('Module search and VM links switch to the correct server table',()=>{
    const base=path.join(__dirname,'..'),html=fs.readFileSync(path.join(base,'html/modules.html'),'utf8'),nodes=new Map();
    function node(){const listeners={};return {value:'',innerHTML:'',textContent:'',hidden:false,attrs:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener:(k,f)=>listeners[k]=f,emit:(k,event)=>listeners[k]?.(event),scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}};}
    for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,node());
    for(const s of plan.servers)nodes.set('#wt-vm-'+s.id,node());
    nodes.get('#wt-module-group').value='all';
    const q=s=>{assert.ok(nodes.has(s),s);return nodes.get(s);},ctx={NT:{q,esc:require('../js/domain.js').esc},NT_DATA:{modules,'server-plan':plan}};ctx.window=ctx;
    vm.runInNewContext(fs.readFileSync(path.join(base,'js/pages/modules.js'),'utf8'),ctx);
    assert.match(q('#wt-server-summary').innerHTML,/71,560/);assert.match(q('#wt-capacity-rows').innerHTML,/59,800/);assert.match(q('#wt-server-rows').innerHTML,/VRAM 48 GB/);assert.match(q('#wt-module-count').textContent,/20 \/ 20/);
    q('#wt-module-search').value='Questionnaire';q('#wt-module-search').emit('input');assert.match(q('#wt-module-rows').innerHTML,/Video \/ Questionnaire/);assert.doesNotMatch(q('#wt-module-rows').innerHTML,/Payment \/ Billing/);
    q('#wt-modules-tab').emit('click');assert.equal(q('#wt-servers-panel').hidden,true);
    q('#wt-module-rows').emit('click',{target:{closest:()=>({dataset:{server:'media'}})},preventDefault(){}});
    assert.equal(q('#wt-servers-panel').hidden,false);assert.equal(q('#wt-vm-media').focused,true);
    q('#wt-module-search').value='not-a-module';q('#wt-module-search').emit('input');assert.match(q('#wt-module-rows').innerHTML,/ไม่พบโมดูล/);
});

test('Retention budgets cover explicit scenarios and GPU is allocated only to inference',()=>{
 const i=plan.capacityInputs;
 for(const x of plan.capacityScenarios){
  assert.equal(x.logRequiredGB,Math.round(i.rawLogGBPerDay*x.days*i.logStorageFactor*i.headroomMultiplier*100)/100);
  assert.equal(x.mediaRequiredGB,Math.round((i.initialMediaGB+i.netMediaGrowthGBPerDay*x.days)*i.headroomMultiplier*100)/100);
  assert.equal(x.fullCopies,x.months+1);
  assert.equal(x.incrementalDays,x.days+i.chainOverlapDays);
  assert.equal(x.backupRequiredGB,Math.round((i.fullBackupGB*x.fullCopies+i.incrementalBackupGBPerDay*x.incrementalDays)*i.headroomMultiplier*100)/100);
  assert.ok(x.logBudgetGB>=x.logRequiredGB&&x.mediaBudgetGB>=x.mediaRequiredGB&&x.backupBudgetGB>=x.backupRequiredGB);
 }
 const nine=plan.capacityScenarios.find(x=>x.months===9);
 for(const [id,field] of [['monitor','logBudgetGB'],['media','mediaBudgetGB'],['backup','backupBudgetGB']])assert.equal(plan.servers.find(x=>x.id===id).dataDiskGB,nine[field]);
 assert.equal(plan.servers.reduce((n,x)=>n+x.gpuCount*x.count,0),1);
 assert.equal(plan.servers.find(x=>x.id==='inference').gpuVramGB,48);
 assert.ok(modules.filter(x=>x.id.startsWith('ai-')).every(x=>x.servers.includes('inference')));
});
