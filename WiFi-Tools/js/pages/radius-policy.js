/* Page: radius-policy — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;
  NT.onLoad(()=>q('#nt-policy-output').hidden=true);
  NT.onChange(()=>q('#nt-policy-output').hidden=true);
 q('#nt-policy-review').addEventListener('click',()=>{const el=q('#nt-policy-output');el.hidden=false;el.textContent='Policy draft: '+state.policyName+'\nSession-Timeout: '+(state.hours*3600)+' seconds\nDownload: '+state.downloadMbps+' Mbps\nUpload: '+state.uploadMbps+' Mbps\nData quota: '+state.quotaGb+' GB (0 = ไม่กำหนด)\nVendor attribute mapping: รอตรวจรุ่นและ Firmware\nไม่ได้ส่งค่าไป RADIUS';});

})();
