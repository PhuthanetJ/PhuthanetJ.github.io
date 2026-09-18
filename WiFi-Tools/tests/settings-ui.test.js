'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..'),html=fs.readFileSync(path.join(base,'html/settings.html'),'utf8');
test('Settings selects Config by Path alone and blocks exports until the chosen Config is opened',()=>{
    const nodes=new Map();for(const [,id] of html.matchAll(/id="([^"]+)"/g)){
        const listeners={};nodes.set('#'+id,{value:'',disabled:false,innerHTML:'',textContent:'',addEventListener:(k,f)=>listeners[k]=f,emit:k=>listeners[k]?.()});
    }
    assert.doesNotMatch(html,/id="wt-config-site"/);
    const q=s=>{assert.ok(nodes.has(s),'HTML contains '+s);return nodes.get(s);},selected=[];
    const context={NT:{q,esc:s=>s,currentPortalId:'a',state:{name:'Portal A',path:'/portal/a'},can:()=>true,
        portalPathChoices:()=>[{id:'a',path:'/portal/a'},{id:'b',path:'/portal/b'}],bindings:()=>({siteIds:['a','b']}),allowedIds:()=>['a','b'],siteName:id=>'Site '+id,
        choosePortalPath:id=>selected.push(id),toast(){},onLoad(){}}};context.window=context;
    vm.runInNewContext(fs.readFileSync(path.join(base,'js/pages/settings.js'),'utf8'),context);
    assert.equal(q('#wt-config-path').value,'a');assert.equal(q('#nt-export-config').disabled,false);
    assert.match(q('#wt-config-assigned-sites').textContent,/Site a, Site b/);
    q('#wt-config-path').value='b';q('#wt-config-path').emit('change');
    for(const id of ['#nt-import-config','#nt-export-config','#nt-reset-config'])assert.equal(q(id).disabled,true);
    q('#wt-select-config').emit('click');assert.deepEqual(selected,['b']);
});
