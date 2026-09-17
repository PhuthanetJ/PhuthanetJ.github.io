/* Page: reports — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;
 const reportRows=NT_DATA.reports.rows,reportTypes=NT_DATA.reports.types;
 const number=v=>v.toLocaleString('en-US');
 function renderReports(){
  const site=q('#nt-report-site').value,from=q('#nt-report-from').value,to=q('#nt-report-to').value,type=q('#nt-report-type').value;
  const invalid=!from||!to||from>to||from<NT_DATA.reports.dateFrom||to>NT_DATA.reports.dateTo;
  const rows=invalid?[]:reportRows.filter(r=>(site==='all'||r.site===site)&&r.date>=from&&r.date<=to);
  const conf=reportTypes[type];
  const sum=k=>rows.reduce((n,r)=>n+r[k],0);
  const fmt=(k,v)=>['up','down','totalTraffic'].includes(k)?v.toFixed(1):number(v);
  const rate=(a,b)=>b?(100*a/b).toFixed(1)+'%':'—';
  const card=(title,value,sub)=>'<div class="nt-kpi"><span>'+title+'</span><strong>'+value+'</strong><span class="nt-help">'+sub+'</span></div>';
  const value=k=>rows.length?fmt(k,sum(k)):'—';
  let metrics='';
  if(type==='login')metrics=card('Login สำเร็จ',value('success'),'เหตุการณ์ในช่วงข้อมูล')+card('สมัครใหม่',value('register'),'รายการลงทะเบียน')+card('Auth ทั้งหมด',value('attempts'),'Accept + Reject + Timeout')+card('อัตราสำเร็จ',rate(sum('success'),sum('attempts')),'จากคำขอทั้งหมด');
  if(type==='auth')metrics=card('คำขอทั้งหมด',value('attempts'),'Authentication Requests')+card('Accept',value('success'),'ยืนยันสำเร็จ')+card('Reject',value('reject'),'ปฏิเสธสิทธิ์')+card('Timeout',value('timeout'),'ไม่ได้รับคำตอบทันเวลา');
  if(type==='traffic')metrics=card('Upload',value('up'),'GB สะสม')+card('Download',value('down'),'GB สะสม')+card('Data Usage',value('totalTraffic'),'GB รวมสองทิศทาง')+card('Sites',number(new Set(rows.map(r=>r.site)).size),'Site ที่มีข้อมูล');
  if(type==='coupon')metrics=card('ออกคูปอง',value('issued'),'ใบ')+card('ใช้สิทธิ์แล้ว',value('used'),'ใบ ณ Snapshot')+card('ยังไม่ใช้',value('unused'),'ใบ ณ Snapshot')+card('ใช้สิทธิ์แล้ว',rate(sum('used'),sum('issued')),'จากคูปองที่ออก');
  q('#nt-report-metrics').innerHTML=metrics;
  q('#nt-report-message').textContent=invalid?'เลือกช่วงวันที่ 15–17 ก.ย. 2569 และวันที่เริ่มต้องไม่เกินวันที่สิ้นสุด':'แสดง '+rows.length+' รายการ · '+(site==='all'?'ทุก Site':'Demo Site '+site.toUpperCase())+' · '+from+' ถึง '+to;
  q('#nt-report-chart-title').textContent=conf.chart+' ('+conf.unit+')';
  q('#nt-report-table-title').textContent='รายละเอียด '+conf.name;
  q('#nt-report-rowcount').textContent=rows.length+' รายการ';
  q('#nt-report-definition').textContent=conf.definition;
  q('#nt-report-head').innerHTML='<tr><th>วันที่</th><th>Site</th>'+conf.columns.map(c=>'<th>'+c[1]+'</th>').join('')+'</tr>';
  q('#nt-report-body').innerHTML=rows.length?rows.map(r=>'<tr><td>'+r.date.slice(8)+'/'+r.date.slice(5,7)+'/2569</td><td>Demo Site '+r.site.toUpperCase()+'</td>'+conf.columns.map(c=>'<td>'+fmt(c[0],r[c[0]])+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+(conf.columns.length+2)+'">ไม่มีข้อมูลในช่วงที่เลือก</td></tr>';
  q('#nt-report-foot').innerHTML=rows.length?'<tr><th colspan="2">รวม</th>'+conf.columns.map(c=>'<th>'+fmt(c[0],sum(c[0]))+'</th>').join('')+'</tr>':'';
  const totals=new Map();
  rows.forEach(r=>totals.set(r.date,(totals.get(r.date)||0)+r[conf.measure]));
  const days=Array.from(totals.entries()),max=Math.max(1,...days.map(d=>d[1]));
  q('#nt-report-chart').innerHTML=days.length?days.map(([date,v])=>'<div class="nt-report-bar-row" aria-label="'+date+' '+fmt(conf.measure,v)+' '+conf.unit+'"><span>'+date.slice(8)+'/'+date.slice(5,7)+'/2569</span><div class="nt-report-bar-track"><div class="nt-report-bar-fill" style="width:'+(v/max*100)+'%"></div></div><span class="nt-report-value">'+fmt(conf.measure,v)+'</span></div>').join(''):'<div class="nt-empty">ไม่มีข้อมูลสำหรับแสดงกราฟ</div>';
 }
 ['#nt-report-site','#nt-report-from','#nt-report-to','#nt-report-type'].forEach(s=>q(s).addEventListener('change',renderReports));

 q('#nt-report-export').addEventListener('click',()=>{
   const site=q('#nt-report-site').value,from=q('#nt-report-from').value,to=q('#nt-report-to').value;
   if (!from||!to||from>to||from<NT_DATA.reports.dateFrom||to>NT_DATA.reports.dateTo) {
     return toast('ช่วงวันที่ไม่ถูกต้อง กรุณาเลือกช่วงวันที่ที่มีข้อมูล');
   }
   const conf=reportTypes[q('#nt-report-type').value];
   const rows=reportRows.filter(r=>(site==='all'||r.site===site)&&r.date>=from&&r.date<=to);
   if (!rows.length) return toast('ไม่มีข้อมูลสำหรับส่งออก');
   const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
   const csv=[['ข้อมูลจำลอง · ไม่ใช่ข้อมูล Production'],['วันที่','Site',...conf.columns.map(c=>c[1])],
     ...rows.map(r=>[r.date,'Demo Site '+r.site.toUpperCase(),...conf.columns.map(c=>r[c[0]])])]
     .map(row=>row.map(cell).join(',')).join('\r\n');
   NT.download('NT-WiFi-Report-'+q('#nt-report-type').value+'.csv','\ufeff'+csv,'text/csv;charset=utf-8');
   toast('ส่งรายงานข้อมูลจำลองให้เบราว์เซอร์ดาวน์โหลดแล้ว');
 });
 renderReports();

})();
