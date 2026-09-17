/* Page: ap-network — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;

 function listTable(type){
  const arr=lists[type],host=q(type==='wg'?'#nt-wg-table':'#nt-mac-table');
  if(!arr.length){host.innerHTML='<div class="nt-empty">ยังไม่มีรายการ</div>';return;}
  host.innerHTML='<table><thead><tr><th>'+(type==='wg'?'ปลายทาง':'MAC / หมดอายุ')+'</th><th>เหตุผล / สถานะ</th><th style="width:60px">จัดการ</th></tr></thead><tbody>'+arr.map((row,i)=>'<tr><td>'+esc(row.value)+(row.expiry?'<br><span class="nt-help">'+esc(row.expiry)+'</span>':'')+'</td><td>'+esc(row.reason)+'<br><span class="nt-badge pending">รอ Sync</span></td><td><button type="button" class="nt-button nt-compact" data-remove="'+type+'" data-index="'+i+'">ลบ</button></td></tr>').join('')+'</tbody></table>';
  host.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',()=>{arr.splice(Number(el.dataset.index),1);changed();listTable(type);toast('ลบรายการออกจาก Draft แล้ว');}));
 }
 q('#nt-wg-add').addEventListener('click',()=>{const value=q('#nt-wg-input').value.trim(),reason=q('#nt-wg-reason').value.trim();if(!value||!reason||/[\s<>]/.test(value))return toast('ระบุ Domain / IP / CIDR และเหตุผล โดยไม่ใส่ URL หรือช่องว่าง');if(value.includes('://'))return toast('ใส่ Domain / IP / CIDR โดยไม่ใส่ https://');if(lists.wg.some(x=>x.value===value))return toast('มีรายการนี้แล้ว');lists.wg.push({value,reason});q('#nt-wg-input').value='';q('#nt-wg-reason').value='';changed();listTable('wg');toast('เพิ่มข้อเสนอ Walled Garden แล้ว ต้อง Validate กับ Vendor ก่อน Sync');});
 q('#nt-mac-add').addEventListener('click',()=>{const value=q('#nt-mac-input').value.trim().toUpperCase(),expiry=q('#nt-mac-expiry').value,reason=q('#nt-mac-reason').value.trim();if(!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(value)||!expiry||!reason)return toast('ระบุ MAC รูปแบบ AA:BB:CC:DD:EE:FF วันหมดอายุ และเหตุผล');if(lists.mac.some(x=>x.value===value))return toast('มี MAC นี้แล้ว');lists.mac.push({value,expiry,reason});q('#nt-mac-input').value='';changed();listTable('mac');toast('เพิ่ม MAC ใน Draft แล้ว ยังไม่ได้ส่งไปอุปกรณ์');});

 NT.onLoad(()=>{listTable('wg');listTable('mac');});
 listTable('wg');listTable('mac');
})();
