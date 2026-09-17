/* Page: free-wifi-coupons — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;

 q('#nt-voucher-create').addEventListener('click',()=>{const count=Number(q('#nt-voucher-count').value);if(!Number.isInteger(count)||count<1||count>10||state.hours<1||state.hours>24)return toast('กำหนด 1–10 คูปอง และระยะเวลา 1–24 ชั่วโมง');q('#nt-voucher-result').innerHTML='<div class="nt-notice" style="margin-top:14px">คูปองตัวอย่างเท่านั้น · ใช้กับเครือข่ายจริงไม่ได้</div><table><thead><tr><th>รหัสตัวอย่าง</th><th>ระยะเวลา</th><th>สถานะ</th></tr></thead><tbody>'+Array.from({length:count},(_,i)=>'<tr><td>DEMO-'+String(i+1).padStart(2,'0')+'</td><td>'+esc(state.hours)+' ชั่วโมง</td><td>ยังไม่ใช้</td></tr>').join('')+'</tbody></table>';toast('สร้างรายการคูปองตัวอย่างแล้ว');});

 NT.onLoad(()=>q('#nt-voucher-result').replaceChildren());
})();
