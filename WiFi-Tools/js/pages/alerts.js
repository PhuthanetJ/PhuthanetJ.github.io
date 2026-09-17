/* Page: alerts — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;

 q('#nt-alert-preview').addEventListener('click',()=>{q('#nt-alert-output').hidden=false;q('#nt-alert-output').textContent='[ตัวอย่าง] '+state.alertEvent+' เกิดอย่างน้อย '+state.alertThreshold+' ครั้ง ใน '+state.alertWindow+' นาที · Site: '+state.site+' · ช่องทาง: '+state.alertChannel+' · ยังไม่มีการส่งข้อความจริง';});

 NT.onLoad(()=>q('#nt-alert-output').hidden=true);
 NT.onChange(()=>q('#nt-alert-output').hidden=true);
})();
