/* Page: modules — local prototype; no backend calls. */
(function () {
  'use strict';
  const {q, qa, esc, state, copy, assets, lists, changed, syncFields, toast, validate} = window.NT;
 const modules=NT_DATA.modules;
 q('#nt-module-list').innerHTML=modules.map(x=>'<div class="nt-module"><div>'+esc(x[0])+'<p>'+esc(x[1])+'</p></div><span class="nt-badge neutral">'+esc(x[2])+'</span></div>').join('');

})();
