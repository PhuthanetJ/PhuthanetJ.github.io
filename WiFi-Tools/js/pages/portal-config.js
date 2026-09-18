(function(){'use strict';if(!window.NT)return;const {q,qa,esc,state,copy,assets,lists,changed,syncFields,toast,validate}=NT;
let language='th',previewMode='normal',proposal=null;
 qa('[data-tab]').forEach(el=>el.addEventListener('click',()=>{qa('[data-tab]').forEach(x=>{x.classList.toggle('active',x===el);x.setAttribute('aria-selected',x===el?'true':'false');});qa('.nt-form').forEach(x=>x.hidden=x.id!=='nt-form-'+el.dataset.tab);}));
 function preview(){
  const c=copy[language],en=language==='en';
  q('#nt-phone').style.setProperty('--portal-button',state.buttonColor);
  q('#nt-phone').style.setProperty('--portal-text',state.buttonTextColor);
  q('#nt-hero').style.backgroundImage=assets.banner?'url("'+assets.banner+'")':'';
  q('#nt-phone').style.backgroundImage=assets.background?'url("'+assets.background+'")':'';
  q('#nt-phone').style.backgroundSize='cover';
  q('#nt-hero-label').textContent=state.name;
  q('#nt-logo-image').hidden=!assets.logo;q('#nt-wordmark').hidden=!!assets.logo;
  if(assets.logo)q('#nt-logo-image').src=assets.logo;else q('#nt-logo-image').removeAttribute('src');
  q('#nt-path-preview').textContent='https://portal.example'+state.path;
  q('#nt-browser-url').textContent='portal.example'+state.path;
  let html='<h3>'+esc(c.title)+'</h3><p>'+esc(c.subtitle)+'</p>';
  if(state.videoEnabled)html+='<div class="nt-public-message success">'+(en?'Video placeholder':'ตัวอย่างพื้นที่วิดีโอ')+' · '+esc(state.videoSeconds)+'s</div>';
  if(state.surveyEnabled){html+='<label style="font-size:14px;display:block;text-align:left">'+esc(state.question)+'<select id="nt-public-answer" class="nt-public-input"><option value="">'+(en?'Select an answer':'เลือกคำตอบ')+'</option>'+state.answers.split(',').map(x=>'<option>'+esc(x.trim())+'</option>').join('')+'</select></label>';}
  if(state.member)html+='<input aria-label="Username ตัวอย่าง" class="nt-public-input" placeholder="Username" autocomplete="off"><input aria-label="Password ตัวอย่าง" class="nt-public-input" type="password" placeholder="Password" autocomplete="off"><button type="button" class="nt-public-button" data-public-auth="RADIUS">'+(en?'Sign in':'เข้าสู่ระบบ')+'</button>';
  ['line','google','facebook','apple'].forEach(provider=>{if(state[provider])html+='<button type="button" class="nt-public-button" data-public-auth="'+provider+'">'+(en?'Continue with ':'เข้าสู่ระบบด้วย ')+({line:'LINE',google:'Google',facebook:'Facebook',apple:'Apple'}[provider])+'</button>';});
  if(state.otp)html+='<input aria-label="เบอร์โทรศัพท์ตัวอย่าง" class="nt-public-input" inputmode="tel" placeholder="'+(en?'Phone number':'เบอร์โทรศัพท์')+'"><button type="button" class="nt-public-button" data-public-auth="OTP">'+esc(c.otp)+'</button>';
  if(state.termsEnabled)html+='<label class="nt-public-terms"><input type="checkbox" id="nt-public-accept"><span>'+esc(en?state.termsEn:state.termsTh)+'</span></label>';
  if(state.guest){if(state.voucherMode==='coupon')html+='<input id="nt-public-coupon" class="nt-public-input" aria-label="คูปองตัวอย่าง" placeholder="DEMO-01">';html+='<button type="button" class="nt-public-button" id="nt-public-connect">'+esc(c.button)+'</button><p>'+esc(state.hours)+' '+(en?'hour(s) · No username or OTP required':'ชั่วโมง · ไม่ต้องกรอก Username / OTP')+'</p>';}
  html+='<div id="nt-public-feedback" role="status"></div><div><button type="button" class="nt-public-lang '+(!en?'active':'')+'" data-lang="th">ไทย</button><button type="button" class="nt-public-lang '+(en?'active':'')+'" data-lang="en">EN</button></div>';
  q('#nt-public-content').innerHTML=html;
  qa('.nt-public-button').forEach(el=>el.style.borderRadius=state.shape==='pill'?'24px':state.shape==='square'?'0':'7px');
  qa('[data-lang]').forEach(el=>el.addEventListener('click',()=>{language=el.dataset.lang;preview();}));
  qa('[data-public-auth]').forEach(el=>el.addEventListener('click',()=>feedback(en?'Preview only. Provider is not connected.':'ตัวอย่างเท่านั้น ยังไม่ได้เชื่อมต่อ '+el.dataset.publicAuth,false)));
  if(q('#nt-public-connect'))q('#nt-public-connect').addEventListener('click',()=>{
   if(state.termsEnabled&&!q('#nt-public-accept').checked)return feedback(en?'Please accept the terms first.':'กรุณายอมรับเงื่อนไขก่อนรับสิทธิ์',false);
   if(state.surveyEnabled&&!q('#nt-public-answer').value)return feedback(en?'Please answer the question.':'กรุณาตอบคำถามก่อนรับสิทธิ์',false);
   if(state.surveyEnabled&&state.surveyType==='quiz'&&q('#nt-public-answer').value!==state.correctAnswer.trim())return feedback(en?'Please try the quiz again.':'คำตอบยังไม่ถูกต้อง ลองอีกครั้ง',false);
   if(state.guest&&state.voucherMode==='coupon'&&!NT.db.coupons.some(c=>c.siteId===NT.currentSite&&c.code===q('#nt-public-coupon').value.trim()))return feedback(en?'Use a coupon generated for this site.':'ใช้คูปองที่สร้างสำหรับ Site นี้',false);
   if(state.videoEnabled)return feedback(en?'Video playback is not connected in this prototype.':'ต้นแบบยังไม่มีไฟล์วิดีโอสำหรับตรวจเงื่อนไข',false);
   feedback((en?'Sample session approved: ':'จำลองรับสิทธิ์สำเร็จ: ')+state.hours+(en?' hour(s) · no network session created':' ชั่วโมง · ยังไม่เกิด Session จริง'),true);
  });
  if(previewMode==='error')feedback(c.error+' · DEMO-001',false);
 }
 function feedback(text,ok){const el=q('#nt-public-feedback');el.className='nt-public-message'+(ok?' success':'');el.textContent=text;}
 function fillCopy(){qa('[data-copy]').forEach(el=>el.value=copy[q('#nt-edit-language').value][el.dataset.copy]);}
 q('#nt-edit-language').addEventListener('change',()=>{language=q('#nt-edit-language').value;fillCopy();preview();});
 qa('[data-copy]').forEach(el=>el.addEventListener('input',()=>{copy[q('#nt-edit-language').value][el.dataset.copy]=el.value;changed();}));
 qa('[data-asset]').forEach(el=>el.addEventListener('change',()=>{
  const f=el.files&&el.files[0];if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>3*1024*1024){toast('เลือก PNG / JPG / WebP ขนาดไม่เกิน 3 MB');el.value='';return;}
  const reader=new FileReader();reader.onload=()=>{assets[el.dataset.asset]=reader.result;changed();toast('อัปเดตภาพใน Preview แล้ว');};reader.onerror=()=>toast('อ่านไฟล์ภาพไม่สำเร็จ');reader.readAsDataURL(f);
 }));
 qa('[data-clear]').forEach(el=>el.addEventListener('click',()=>{assets[el.dataset.clear]='';q('[data-asset="'+el.dataset.clear+'"]').value='';changed();}));
 q('#nt-preview-error').addEventListener('click',()=>{previewMode='error';preview();});
 q('#nt-preview-normal').addEventListener('click',()=>{previewMode='normal';preview();});
 q('#nt-mode-ai').addEventListener('click',()=>{q('#nt-ai-panel').hidden=false;q('#nt-mode-ai').setAttribute('aria-pressed','true');q('#nt-mode-manual').setAttribute('aria-pressed','false');});
 q('#nt-mode-manual').addEventListener('click',()=>{q('#nt-ai-panel').hidden=true;q('#nt-mode-ai').setAttribute('aria-pressed','false');q('#nt-mode-manual').setAttribute('aria-pressed','true');});
 q('#nt-ai-generate').addEventListener('click',()=>{
  const p=q('#nt-ai-prompt').value;
  const hours=p.match(/([1-9][0-9]?)\s*(ชั่วโมง|hour)/i);
  proposal={hours:hours?Math.min(24,Number(hours[1])):state.hours,buttonColor:p.includes('เขียว')?'#15805e':p.includes('ม่วง')?'#7249b9':'#086cf0',guest:true,otp:!(p.includes('ไม่ใช้ OTP')||p.includes('ไม่ใช้ otp')),termsEnabled:true};
  const labels={hours:'ระยะเวลา (ชั่วโมง)',buttonColor:'สีปุ่ม',guest:'รับสิทธิ์ฟรี',otp:'SMS / OTP',termsEnabled:'ยอมรับเงื่อนไข'};
  const display=v=>typeof v==='boolean'?(v?'เปิด':'ปิด'):v;
  q('#nt-ai-diff').innerHTML='<table><thead><tr><th>รายการ</th><th>ปัจจุบัน</th><th>ข้อเสนอ</th></tr></thead><tbody>'+Object.keys(proposal).map(k=>'<tr><td>'+labels[k]+'</td><td>'+esc(display(state[k]))+'</td><td>'+esc(display(proposal[k]))+'</td></tr>').join('')+'</tbody></table><div class="nt-help">ตัวจำลองอ่านเฉพาะสี ชั่วโมง และการเปิด OTP ไม่ประมวลผลคำสั่งอื่น</div>';
  q('#nt-ai-review').hidden=false;
 });
 q('#nt-ai-apply').addEventListener('click',()=>{if(!proposal)return;Object.assign(state,proposal);syncFields();changed();q('#nt-ai-review').hidden=true;proposal=null;toast('นำข้อเสนอตัวอย่างเข้า Draft แล้ว สามารถแก้ต่อด้วย Manual ได้');});
 q('#nt-ai-dismiss').addEventListener('click',()=>{proposal=null;q('#nt-ai-review').hidden=true;toast('ยกเลิกข้อเสนอแล้ว');});
 function setDevice(mode){
  const desktop=mode==='desktop';
  q('#nt-phone').classList.toggle('nt-desktop-screen',desktop);
  q('#nt-phone').classList.toggle('nt-mobile-screen',!desktop);
  q('.nt-preview-wrap').classList.toggle('nt-mobile-mode',!desktop);
  q('#nt-device-desktop').setAttribute('aria-pressed',String(desktop));
  q('#nt-device-mobile').setAttribute('aria-pressed',String(!desktop));
  q('#nt-preview-device-label').textContent=desktop?'Desktop':'Mobile';
 }
 q('#nt-device-desktop').addEventListener('click',()=>setDevice('desktop'));
 q('#nt-device-mobile').addEventListener('click',()=>setDevice('mobile'));
 q('#nt-preview-expand').addEventListener('click',()=>{
  const expanded=q('.nt-editor-grid').classList.toggle('nt-preview-expanded');
  q('#nt-preview-expand').textContent=expanded?'ย่อ Preview':'ขยาย Preview';
  q('#nt-preview-expand').setAttribute('aria-pressed',String(expanded));
 });

NT.onChange(()=>{previewMode='normal';preview();});NT.onLoad(()=>{proposal=null;fillCopy();preview();});fillCopy();preview();setDevice('desktop');
})();