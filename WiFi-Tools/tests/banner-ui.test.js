'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),B=require('../js/banner-model.js');
const base=path.join(__dirname,'..'),html=fs.readFileSync(path.join(base,'html/portal-config.html'),'utf8');
class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.dataset={};this.value='';this.textContent='';this.innerHTML='';this.hidden=false;this.open=false;this.disabled=false;this.attrs={};this.classList={toggle(){}};}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event);}
    setAttribute(k,v){this.attrs[k]=v;}
    setCustomValidity(v){this.validity=v;}
    reportValidity(){}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    querySelectorAll(selector){const all=this.children.flatMap(child=>[child,...child.querySelectorAll('*')]);return selector==='*'?all:all.filter(child=>child.tag===selector);}
    pause(){this.paused=true;}
    showModal(){this.open=true;}
    close(){if(this.open){this.open=false;this.emit('close');}}
    focus(){}
    click(){this.emit('click');}
    scrollIntoView(){}
}
function setup(edit=true){
    const nodes=new Map();for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,new Element());
    const checked=new Map(),q=selector=>{if(selector.startsWith('[name='))return checked.get(selector)||null;assert.ok(nodes.has(selector),'real HTML has '+selector);return nodes.get(selector);};
    const questions=JSON.parse(fs.readFileSync(path.join(base,'data/config.json'),'utf8')).lists.questionnaires;
    const fixture=(id,type,area,extra={})=>({id,type,area,name:id,fileName:id,src:'data:'+(type==='video'?'video/mp4':'image/png')+';base64,AQID',link:'',enabled:true,...extra});
    const assets={banners:B.parse([fixture('head','image','b01'),fixture('movie','video','login',{clickable:true,action:'questionnaires',questionnaireIds:['customer-age','wifi-quiz']}),fixture('bottom','image','b02')])};
    const lists={questionnaires:questions,portalQuestionnaireIds:['wifi-purpose']},loads=[],ctx={WiFiBanners:B,document:{createElement:tag=>new Element(tag)}};
    ctx.NT={q,qa:()=>[],esc:require('../js/domain.js').esc,assets,lists,can:()=>edit,changed:()=>ctx.WiFiBannerUI?.preview(),toast(){},onLoad:fn=>loads.push(fn)};ctx.window=ctx;
    vm.createContext(ctx);for(const file of ['portal-banners.js','portal-questionnaires.js'])vm.runInContext(fs.readFileSync(path.join(base,'js/pages',file),'utf8'),ctx);
    function change(id,field,value){const input=new Element('input');input.dataset={bannerId:id,bannerField:field};input.value=value;input.checked=value;q('#wt-banner-list').emit('change',{target:input});return input;}
    return {q,ctx,assets,lists,checked,change,nodes};
}
const findButton=(host,text)=>host.querySelectorAll('button').find(node=>node.textContent.includes(text));
test('Actual banner UI renders each area and moves a video into a working modal and quiz',()=>{
    const {q,assets,change,checked}=setup();
    assert.equal(q('#wt-banner-b01').querySelectorAll('img').length,1);
    assert.equal(q('#wt-banner-login').querySelectorAll('video').length,1);
    assert.equal(q('#wt-banner-b02').querySelectorAll('img').length,1);
    change('movie','area','modal');assert.equal(q('#wt-banner-login').hidden,true);assert.equal(q('#wt-banner-modal-open').disabled,false);
    q('#wt-banner-modal-open').emit('click');assert.equal(q('#wt-banner-dialog').open,true);
    const host=q('#wt-banner-dialog-content');assert.equal(findButton(host,'Quiz'),undefined);q('#wt-banner-dialog-close').emit('click');assert.equal(q('#wt-banner-dialog').open,false);assert.equal(q('#wt-quiz-dialog').open,true);assert.equal(host.querySelectorAll('video')[0].paused,true);
    assert.match(q('#wt-quiz-questions').innerHTML,/อายุของคุณ/);assert.match(q('#wt-quiz-questions').innerHTML,/ก่อนรับสิทธิ์/);
    q('#wt-quiz-form').emit('submit',{preventDefault(){}});assert.match(q('#wt-quiz-result').textContent,/ครบทุกข้อ/);
    checked.set('[name="question-customer-age"]:checked',{value:'0'});checked.set('[name="question-wifi-quiz"]:checked',{value:'1'});
    q('#wt-quiz-form').emit('submit',{preventDefault(){}});assert.match(q('#wt-quiz-result').textContent,/ยังไม่ถูกต้อง/);
    checked.set('[name="question-wifi-quiz"]:checked',{value:'0'});q('#wt-quiz-form').emit('submit',{preventDefault(){}});assert.match(q('#wt-quiz-result').textContent,/Quiz ผ่าน/);
    q('#wt-quiz-close').emit('click');assert.equal(q('#wt-banner-dialog').open,true);change('movie','clickable',false);assert.equal(q('#wt-quiz-dialog').open,false);assert.equal(findButton(host,'Quiz'),undefined);assert.equal(assets.banners[1].clickable,false);
    change('movie','enabled',false);assert.equal(q('#wt-banner-dialog').open,false);assert.equal(q('#wt-banner-modal-open').disabled,true);
});
test('1st page preview leads to Modal; image links honor Clickable independently of stored URL',()=>{
    const {q,change}=setup();change('head','area','first');change('bottom','area','modal');
    q('#wt-banner-first-open').emit('click');assert.match(q('#wt-banner-dialog-title').textContent,/1st page/);
    q('#wt-banner-dialog-close').emit('click');assert.match(q('#wt-banner-dialog-title').textContent,/Modal/);assert.equal(q('#wt-banner-dialog').open,true);
    q('#wt-banner-dialog-close').emit('click');assert.equal(q('#wt-banner-dialog').open,false);
    change('head','area','b01');change('head','link','https://example.com/');assert.equal(q('#wt-banner-b01').querySelectorAll('a').length,0);
    change('head','clickable',true);assert.equal(q('#wt-banner-b01').querySelectorAll('a')[0].rel,'noopener noreferrer');
});
test('Question editor creates and edits saved choices; refuses deletion while linked',()=>{
    const {q,lists}=setup();q('#wt-question-new').emit('click');q('#wt-question-name').value='New survey';q('#wt-question-text').value='Question?';q('#wt-question-answers').value='Yes\nNo';q('#wt-question-correct').value='';q('#wt-question-save').emit('click');
    const saved=lists.questionnaires.find(item=>item.name==='New survey');assert.ok(saved);assert.deepEqual(Array.from(saved.answers),['Yes','No']);
    q('#wt-question-name').value='Renamed';q('#wt-question-save').emit('click');assert.equal(lists.questionnaires.find(item=>item.id===saved.id).name,'Renamed');
    q('#wt-question-select').emit('change',{target:{value:'customer-age'}});q('#wt-question-delete').emit('click');assert.match(q('#wt-question-message').textContent,/ยังลบไม่ได้/);
});
test('Read-only role cannot alter banners or questionnaires through the event handlers',()=>{
    const {q,change,assets,lists}=setup(false),before=JSON.stringify({assets,lists});assert.equal(q('#wt-banner-add').disabled,true);assert.equal(q('#wt-question-save').disabled,true);
    change('movie','area','modal');q('#wt-question-name').value='Unauthorized';q('#wt-question-save').emit('click');assert.equal(JSON.stringify({assets,lists}),before);
});

test('Continue on 1st page opens its questions; only successful submission advances to Modal',()=>{
    const {q,change,checked}=setup();change('movie','area','first');change('bottom','area','modal');
    q('#wt-banner-first-open').emit('click');q('#wt-banner-dialog-close').emit('click');
    assert.equal(q('#wt-quiz-dialog').open,true);assert.equal(q('#wt-banner-dialog').open,false);assert.equal(q('#wt-quiz-next').hidden,true);
    q('#wt-quiz-next').emit('click');assert.equal(q('#wt-quiz-dialog').open,true);
    checked.set('[name="question-customer-age"]:checked',{value:'0'});checked.set('[name="question-wifi-quiz"]:checked',{value:'0'});
    q('#wt-quiz-form').emit('submit',{preventDefault(){}});assert.equal(q('#wt-quiz-next').hidden,false);
    q('#wt-quiz-form').emit('change');assert.equal(q('#wt-quiz-next').hidden,true);
    q('#wt-quiz-form').emit('submit',{preventDefault(){}});q('#wt-quiz-next').emit('click');
    assert.equal(q('#wt-quiz-dialog').open,false);assert.equal(q('#wt-banner-dialog').open,true);assert.match(q('#wt-banner-dialog-title').textContent,/Modal/);
});
test('One question editor updates both Portal and the video questions; grading uses the same answers',()=>{
    const {q,ctx,lists,nodes}=setup();
    q('#wt-portal-question-choices').emit('change',{target:{dataset:{portalQuestion:'customer-age'},checked:true}});
    q('#wt-question-select').emit('change',{target:{value:'customer-age'}});q('#wt-question-text').value='คำถามที่แก้พร้อมกัน';q('#wt-question-answers').value='ตัวเลือกใหม่ 1\nตัวเลือกใหม่ 2';q('#wt-question-save').emit('click');
    assert.match(ctx.WiFiQuestionnaireUI.portalMarkup('th'),/คำถามที่แก้พร้อมกัน/);assert.match(ctx.WiFiQuestionnaireUI.portalMarkup('th'),/ตัวเลือกใหม่ 1/);
    const button=findButton(q('#wt-banner-login'),'ดำเนินการต่อ');assert.ok(button);button.emit('click');assert.match(q('#wt-quiz-questions').innerHTML,/คำถามที่แก้พร้อมกัน/);
    q('#wt-quiz-close').emit('click');
    for(const id of lists.portalQuestionnaireIds){const input=new Element('select');input.value='0';nodes.set('#wt-public-question-'+id,input);}
    assert.equal(ctx.WiFiQuestionnaireUI.gradePortal().ok,true);
    q('#wt-public-question-customer-age').value='';assert.equal(ctx.WiFiQuestionnaireUI.gradePortal().ok,false);
    assert.match(q('#wt-question-usage').textContent,/หน้า Portal/);assert.match(q('#wt-question-usage').textContent,/movie/);
});
test('Question editor is in Quiz & Terms and the duplicate legacy question form is removed',()=>{
    const start=html.indexOf('id="nt-form-engage"'),editor=html.indexOf('id="wt-question-editor"'),end=html.indexOf('</section>',start);
    assert.ok(start<editor&&editor<end);assert.doesNotMatch(html,/data-bind="(?:question|answers|correctAnswer|surveyType)"/);
});
