/* Page: monitor-logs — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;
 const logs=NT_DATA.logs;
 function showLogs(){const type=q('#nt-log-type').value,term=q('#nt-log-search').value.toLowerCase();const rows=logs.filter(x=>(type==='all'||x.type===type)&&(x.id+' '+x.title+' '+x.detail).toLowerCase().includes(term));q('#nt-log-list').innerHTML=rows.length?rows.map(x=>'<div class="nt-log-event"><span class="nt-badge neutral">'+esc(x.type)+'</span> <span class="nt-help">'+x.id+'</span><div>'+esc(x.title)+'</div><div class="nt-help">'+esc(x.detail)+'</div></div>').join(''):'<div class="nt-empty">ไม่พบเหตุการณ์ตัวอย่างที่ตรงกัน</div>';}
 q('#nt-log-type').addEventListener('change',showLogs);q('#nt-log-search').addEventListener('input',showLogs);

 showLogs();
})();
