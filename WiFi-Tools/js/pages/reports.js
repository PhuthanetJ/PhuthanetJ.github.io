(function(){
 'use strict';if(!window.NT)return;
 const {q,qa,esc,db,user,can,siteName,persist}=NT,D=WiFiDomain;
 db.covers[user.id]||=D.clone(NT_DATA['report-settings'].cover);
 const cover=db.covers[user.id];let report=null,editing=null;
 NT.fillSites(q('#report-site'),true);
 const filter=()=>({site:q('#report-site').value,from:q('#report-from').value,to:q('#report-to').value,type:q('#report-type').value,group:q('#report-group').value});
 const fmt=(key,value)=>['up','down','totalTraffic'].includes(key)?Number(value).toFixed(1):Number(value).toLocaleString('en-US');
 function invalidate(){report=null;q('#report-output').hidden=true;q('#report-export').disabled=true;q('#report-message').textContent='กดสร้างรายงานหลังเปลี่ยนเงื่อนไข';}
 function generate(){
  try{report=D.buildReport({rows:NT_DATA.reports.rows,types:NT_DATA.reports.types,sites:NT_DATA.sites,user:NT.getUser(),filter:filter()});const c=report.definition;
   q('#report-output').hidden=false;q('#report-message').textContent=report.rows.length?'ข้อมูลตัวอย่าง · '+report.rows.length+' แถว จาก '+report.sourceCount+' รายการ · '+report.filter.from+' ถึง '+report.filter.to:'ไม่มีข้อมูลในช่วงที่เลือก (ตัวอย่างมี 15–17 ก.ย. 2569)';
   q('#report-metrics').innerHTML=c.columns.map(([k,label])=>'<div class="nt-kpi">'+esc(label)+'<strong>'+fmt(k,report.totals[k])+'</strong></div>').join('');
   q('#report-head').innerHTML='<tr><th>วันที่</th><th>Site</th>'+c.columns.map(x=>'<th>'+esc(x[1])+'</th>').join('')+'</tr>';
   q('#report-body').innerHTML=report.rows.map(r=>'<tr><td>'+r.date+'</td><td>'+esc(r.site==='all'?'รวม Site ที่เลือก':siteName(r.site))+'</td>'+c.columns.map(x=>'<td>'+fmt(x[0],r[x[0]])+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="'+(c.columns.length+2)+'">ไม่มีข้อมูล</td></tr>';
   q('#report-foot').innerHTML='<tr><th colspan="2">รวม</th>'+c.columns.map(x=>'<th>'+fmt(x[0],report.totals[x[0]])+'</th>').join('')+'</tr>';
   q('#report-definition').textContent=c.definition;
   const days=new Map();for(const r of report.rows)days.set(r.date,(days.get(r.date)||0)+r[c.measure]);const max=Math.max(1,...days.values());
   q('#report-chart').innerHTML=[...days].map(([date,v])=>'<div class="nt-report-bar-row"><span>'+date+'</span><div class="nt-report-bar-track"><div class="nt-report-bar-fill" style="width:'+(v/max*100)+'%"></div></div><span class="nt-report-value">'+fmt(c.measure,v)+'</span></div>').join('');
   q('#report-export').disabled=!can('export')||!report.rows.length;
  }catch(e){report=null;q('#report-output').hidden=true;q('#report-export').disabled=true;q('#report-message').textContent=e.message;}
 }
 function previewCover(){q('#cover-preview').className='wt-cover-preview '+cover.layout;q('#cover-preview').style.setProperty('--accent',cover.accent);q('#cover-preview').style.backgroundImage=cover.layout==='image'&&cover.image?'url("'+cover.image+'")':'';q('#cover-preview').innerHTML=(cover.logo?'<img alt="Logo">':'')+'<div class="wt-cover-copy"><p>'+esc(cover.organization)+'</p><h2>'+esc(cover.title)+'</h2><p>'+esc(cover.subtitle)+'</p><p>ช่วงเวลาตามรายงานที่เลือก</p></div>';if(cover.logo)q('#cover-preview').querySelector('img').src=cover.logo;}
 function fillCover(){for(const key of ['layout','title','subtitle','organization','accent'])q('#cover-'+key).value=cover[key];previewCover();}
 for(const key of ['layout','title','subtitle','organization','accent'])q('#cover-'+key).addEventListener('input',()=>{if(!can('report'))return;cover[key]=q('#cover-'+key).value;persist();previewCover();});
 for(const key of ['logo','image'])q('#cover-'+key).addEventListener('change',()=>{const file=q('#cover-'+key).files?.[0];if(!file||!can('report'))return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024)return NT.toast('ใช้ PNG/JPG/WebP ไม่เกิน 3 MB');const reader=new FileReader();reader.onload=()=>{cover[key]=reader.result;persist();previewCover();};reader.readAsDataURL(file);});
 q('#cover-clear').addEventListener('click',()=>{if(!can('report'))return;cover.logo='';cover.image='';q('#cover-logo').value='';q('#cover-image').value='';persist();previewCover();});
 for(const key of ['site','from','to','type','group'])q('#report-'+key).addEventListener('change',invalidate);
 q('#report-generate').addEventListener('click',generate);
 q('#report-export').addEventListener('click',()=>{if(!can('export')||!can('report')||!report?.rows.length)return NT.toast('ต้องมีรายงานและสิทธิ์ Gen Report / Export');if(q('#report-format').value==='csv')NT.download('Wi-Fi-Report-'+report.filter.type+'.csv',D.csv(report,NT.allowedSites()),'text/csv;charset=utf-8');else{db.reportDrafts[user.id]={report:D.clone(report),cover:D.clone(cover),userId:user.id};persist();location.href='report-print.html';}});
 q('#schedule-sites').innerHTML=NT.allowedSites().map(s=>'<label><input type="checkbox" data-schedule-site value="'+s.id+'" '+(s.id===NT.currentSite?'checked':'')+'>'+esc(s.name)+'</label>').join('');
 const manageable=job=>can('report')&&can('export')&&(can('system')||job.ownerId===user.id||can('editSite')&&job.siteIds.every(id=>NT.allowedIds().includes(id)));
 function schedules(){
  const rows=db.schedules.filter(j=>can('system')||j.siteIds.every(id=>NT.allowedIds().includes(id))&&(j.ownerId===user.id||can('editSite')));
  q('#schedule-table').innerHTML=rows.map(j=>{const next=D.nextMonthlyRun(j.day,j.time);return '<tr><td>'+esc(j.name)+'<br>'+esc(j.siteIds.map(siteName).join(', '))+'</td><td>วันที่ '+j.day+' เวลา '+esc(j.time)+' ICT<br><span class="nt-help">รอบถัดไปตามค่า: '+esc(new Date(next.due).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}))+'<br>รายงาน '+next.from+' ถึง '+next.to+'</span></td><td>'+esc(j.emails.join(', '))+'</td><td>'+esc(j.format.toUpperCase())+' / '+esc(j.format==='pdf'?j.cover.layout:'ไม่มีหน้าปก')+'</td><td>'+(j.requestedEnabled?'รอ Scheduler / SMTP':'ปิดรายการ')+'</td><td><button class="nt-button" data-edit-job="'+j.id+'" '+(manageable(j)?'':'disabled')+'>แก้ไข</button><button class="nt-button" data-toggle-job="'+j.id+'" '+(manageable(j)?'':'disabled')+'>'+(j.requestedEnabled?'ปิด':'เปิด')+'</button></td></tr>';}).join('')||'<tr><td colspan="6">ยังไม่มีรายการ</td></tr>';
  qa('[data-edit-job]').forEach(el=>el.addEventListener('click',()=>{const j=db.schedules.find(j=>j.id===el.dataset.editJob);if(!j||!manageable(j))return;editing=j.id;q('#schedule-name').value=j.name;q('#schedule-day').value=j.day;q('#schedule-time').value=j.time;q('#schedule-emails').value=j.emails.join(', ');q('#schedule-format').value=j.format;q('#schedule-enabled').checked=j.requestedEnabled;qa('[data-schedule-site]').forEach(el=>el.checked=j.siteIds.includes(el.value));q('#report-type').value=j.type;Object.assign(cover,D.clone(j.cover));fillCover();invalidate();q('#schedule-message').textContent='กำลังแก้ไข '+j.name;}));
  qa('[data-toggle-job]').forEach(el=>el.addEventListener('click',()=>{const j=db.schedules.find(j=>j.id===el.dataset.toggleJob);if(!j||!manageable(j))return;j.requestedEnabled=!j.requestedEnabled;persist();schedules();}));
 }
 q('#schedule-form').addEventListener('submit',event=>{
  event.preventDefault();try{
   if(!can('report')||!can('export'))throw Error('ต้องมีสิทธิ์ Gen Report และ Export');
   const ids=qa('[data-schedule-site]').filter(e=>e.checked).map(e=>e.value);if(!ids.length||ids.some(id=>!NT.allowedIds().includes(id)))throw Error('เลือก Site ในสิทธิ์อย่างน้อย 1 Site');
   const day=Number(q('#schedule-day').value),time=q('#schedule-time').value;D.nextMonthlyRun(day,time);
   const old=db.schedules.find(j=>j.id===editing);if(old&&!manageable(old))throw Error('ไม่มีสิทธิ์แก้รายการนี้');
   const job={id:editing||'job-'+Date.now(),ownerId:old?.ownerId||user.id,name:q('#schedule-name').value.trim(),siteIds:ids,day,time,timezone:'Asia/Bangkok',period:'previous_calendar_month',emails:D.parseEmails(q('#schedule-emails').value),format:q('#schedule-format').value,type:q('#report-type').value,cover:D.clone(cover),requestedEnabled:q('#schedule-enabled').checked,deliveryStatus:'backend_not_connected'};
   if(!job.name)throw Error('กรอกชื่อรายการ');const index=db.schedules.findIndex(j=>j.id===job.id);if(index<0)db.schedules.push(job);else db.schedules[index]=job;persist();editing=null;schedules();q('#schedule-message').textContent='บันทึกค่าตั้งแล้ว · ยังไม่มีการตั้ง Job บน Server หรือส่ง Email จริง';
  }catch(e){q('#schedule-message').textContent=e.message;}
 });
 q('#report-generate').disabled=!can('report');q('#report-export').disabled=true;
 if(!can('report'))qa('[id^="cover-"]').forEach(e=>{if('disabled'in e)e.disabled=true;});
 if(!can('report')||!can('export'))q('#schedule-form').querySelectorAll('input,select,button').forEach(e=>e.disabled=true);
 fillCover();schedules();if(can('report'))generate();else q('#report-message').textContent='ไม่มีสิทธิ์ Gen Report';
})();
