(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc } = NT, plan = NT_DATA['server-plan'], modules = NT_DATA.modules, fmt = value => Number(value).toLocaleString('en-US');
    const totals = plan.servers.reduce((t, s) => ({ vm:t.vm+s.count, cpu:t.cpu+s.count*s.vcpu, ram:t.ram+s.count*s.ramGiB, os:t.os+s.count*s.osDiskGB, data:t.data+s.count*s.dataDiskGB }), {vm:0,cpu:0,ram:0,os:0,data:0});
    q('#wt-server-summary').innerHTML = [[fmt(totals.vm), 'VM · แยกตามบทบาท'], [fmt(totals.cpu), 'vCPU รวม'], [fmt(totals.ram)+' GiB', 'RAM รวม'], [fmt(totals.os+totals.data)+' GB', 'Disk งบตัวอย่าง · รวม Backup']].map(([value, label]) => '<div class="wt-server-kpi"><strong>'+value+'</strong><span>'+label+'</span></div>').join('');
    for (const [id, key] of [['assumptions','assumptions'],['sizing','sizingNotes'],['ha','haNotes'],['exclusions','exclusions']]) q('#wt-plan-'+id).innerHTML = plan[key].map(text=>'<li>'+esc(text)+'</li>').join('');
    q('#wt-server-rows').innerHTML = plan.servers.map(s=>'<tr id="wt-vm-'+s.id+'" tabindex="-1"><td class="wt-server-role"><strong>'+esc(s.code)+' · '+esc(s.name)+'</strong><p>'+esc(s.purpose)+'</p><details><summary>รายละเอียด / ข้อจำกัด</summary><p>'+esc(s.note)+'</p></details></td><td>'+esc(s.os)+'</td><td class="wt-num">'+fmt(s.count)+'</td><td class="wt-num">'+fmt(s.vcpu)+'</td><td class="wt-num">'+fmt(s.ramGiB)+'</td><td class="wt-num">'+fmt(s.osDiskGB)+'</td><td class="wt-num">'+fmt(s.dataDiskGB)+'</td><td class="wt-num">'+fmt(s.osDiskGB+s.dataDiskGB)+'</td><td>'+esc(s.diskType)+'</td><td>'+(s.gpuCount ? fmt(s.gpuCount)+' ใบ · VRAM '+fmt(s.gpuVramGB)+' GB/ใบ' : '—')+'</td></tr>').join('');
    q('#wt-server-total').innerHTML='<tr><th colspan="2">รวมทรัพยากรทุก VM</th><td>'+fmt(totals.vm)+'</td><td>'+fmt(totals.cpu)+'</td><td>'+fmt(totals.ram)+'</td><td>'+fmt(totals.os)+'</td><td>'+fmt(totals.data)+'</td><td>'+fmt(totals.os+totals.data)+'</td><td>ยังไม่รวม HA / DR</td><td>'+fmt(plan.servers.reduce((n,s)=>n+s.count*(s.gpuCount||0),0))+' GPU · ดู VRAM ต่อใบด้านบน</td></tr>';
    q('#wt-capacity-rows').innerHTML = (plan.capacityScenarios || []).map(s=>'<tr><td>'+s.months+' เดือน ≈ '+s.days+' วัน</td><td>'+fmt(s.logRequiredGB)+' / '+fmt(s.logBudgetGB)+'</td><td>'+fmt(s.mediaRequiredGB)+' / '+fmt(s.mediaBudgetGB)+'</td><td>'+fmt(s.backupRequiredGB)+' / '+fmt(s.backupBudgetGB)+'</td><td>'+s.fullCopies+' Full + '+s.incrementalDays+' วัน Incremental</td></tr>').join('');
    q('#wt-plan-sources').innerHTML = plan.sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><p>'+esc(s.note)+'</p></li>').join('');
    function tab(name) { for(const key of ['servers','modules']) {q('#wt-'+key+'-tab').classList.toggle('active',key===name);q('#wt-'+key+'-tab').setAttribute('aria-selected',String(key===name));q('#wt-'+key+'-panel').hidden=key!==name;} }
    q('#wt-servers-tab').addEventListener('click',()=>tab('servers'));q('#wt-modules-tab').addEventListener('click',()=>tab('modules'));
    function renderModules() {
        const query=q('#wt-module-search').value.trim().toLowerCase(),group=q('#wt-module-group').value;
        const rows=modules.filter(m=>(group==='all'||m.group===group)&&[m.name,m.features,m.status].some(text=>text.toLowerCase().includes(query)));
        q('#wt-module-count').textContent=rows.length+' / '+modules.length+' โมดูล';
        q('#wt-module-rows').innerHTML=rows.length?rows.map(m=>'<tr><td><strong>'+esc(m.name)+'</strong><p><span class="nt-badge neutral">'+esc(m.group)+'</span></p></td><td>'+esc(m.features)+'</td><td><div class="wt-vm-links">'+m.servers.map(id=>{const s=plan.servers.find(s=>s.id===id);return '<a href="#wt-vm-'+id+'" data-server="'+id+'" title="'+esc(s.name)+'">'+esc(s.code)+'</a>';}).join('')+'</div></td><td>'+esc(m.status)+'</td></tr>').join(''):'<tr><td colspan="4">ไม่พบโมดูลตามคำค้น / ขอบเขตที่เลือก</td></tr>';
    }
    q('#wt-module-search').addEventListener('input',renderModules);q('#wt-module-group').addEventListener('change',renderModules);
    q('#wt-module-rows').addEventListener('click',event=>{const a=event.target.closest('[data-server]');if(!a||!plan.servers.some(s=>s.id===a.dataset.server))return;event.preventDefault();tab('servers');const row=q('#wt-vm-'+a.dataset.server);row.scrollIntoView({block:'center'});row.focus({preventScroll:true});});
    renderModules();
})();
