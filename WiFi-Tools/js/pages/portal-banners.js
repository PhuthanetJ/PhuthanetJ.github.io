(function () {
    'use strict'; if (!window.NT) return;
    const { q, qa, esc, assets, can, changed, toast } = NT, B = WiFiBanners;
    let busy = false, currentId = '', language = 'th', previous = [], previousLanguage = '';
    const fileInput = q('#wt-banner-files'), list = q('#wt-banner-list');
    const row = id => assets.banners.find(b => b.id === id);
    function error(message) { q('#wt-banner-message').textContent = message; toast(message); }
    function controls() { q('#wt-banner-add').disabled = busy || !can('editSite') || assets.banners.length >= B.limits.count; qa('[data-banner-action],[data-banner-field]').forEach(e => e.disabled = busy || !can('editSite')); }
    function renderList() {
        list.innerHTML = assets.banners.length ? assets.banners.map((b, i) => '<article class="wt-banner-card" data-banner-card="' + b.id + '"><div class="wt-banner-card-head"><strong>Banner ' + (i + 1) + ' · ' + (b.type === 'video' ? 'วิดีโอ' : 'รูปภาพ') + '</strong><label class="nt-check"><input type="checkbox" data-banner-field="enabled" data-banner-id="' + b.id + '"' + (b.enabled ? ' checked' : '') + '>เปิดแสดง</label></div><p class="nt-help">' + esc(b.fileName || b.name) + '</p><label class="nt-field">ชื่อ Banner / คำอธิบายรูป<input data-banner-field="name" data-banner-id="' + b.id + '" maxlength="160" required value="' + esc(b.name) + '"></label><label class="nt-field">ลิงก์ปลายทาง (ไม่บังคับ)<input type="url" data-banner-field="link" data-banner-id="' + b.id + '" maxlength="2000" placeholder="https://example.com/promotion" value="' + esc(b.link) + '"></label><div class="nt-row"><button type="button" class="nt-button nt-compact" data-banner-action="replace" data-banner-id="' + b.id + '">เปลี่ยนไฟล์</button><button type="button" class="nt-button nt-compact" aria-label="เลื่อน Banner ' + (i + 1) + ' ขึ้น" data-banner-action="up" data-banner-id="' + b.id + '">ขึ้น ↑</button><button type="button" class="nt-button nt-compact" aria-label="เลื่อน Banner ' + (i + 1) + ' ลง" data-banner-action="down" data-banner-id="' + b.id + '">ลง ↓</button><button type="button" class="nt-button nt-compact" data-banner-action="remove" data-banner-id="' + b.id + '">ลบ</button></div></article>').join('') : '<p class="nt-help">ยังไม่มี Banner — เพิ่มรูปภาพหรือวิดีโอได้หลายไฟล์</p>';
        q('#wt-banner-count').textContent = assets.banners.length + ' / 20 รายการ · เปิด ' + assets.banners.filter(b => b.enabled).length;
        controls();
    }
    function update(items, rerender = true) { assets.banners = B.parse(items); assets.banner = ''; changed(); if (rerender) renderList(); }
    async function readFile(file) { const { mime, type } = B.fileType(file); const src = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ: ' + file.name)); reader.readAsDataURL(file.slice(0, file.size, mime)); }); return { type, src, fileName: file.name }; }
    let replaceId = '';
    q('#wt-banner-add').addEventListener('click', () => { if (!can('editSite') || busy) return; replaceId = ''; fileInput.multiple = true; fileInput.click(); });
    fileInput.addEventListener('change', async () => {
        if (!can('editSite') || busy) return; const files = Array.from(fileInput.files || []); if (!files.length) return;
        busy = true; controls(); error('กำลังอ่านไฟล์สื่อ…');
        try {
            const replacement = replaceId; let next = assets.banners.map(b => ({ ...b }));
            if (!replacement && next.length + files.length > B.limits.count) throw Error('เพิ่ม Banner ได้ไม่เกิน 20 รายการ');
            const chosen = replacement ? files.slice(0, 1) : files; chosen.forEach(file => B.fileType(file));
            const total = next.filter(b => b.id !== replacement).reduce((n, b) => n + B.media(b.src, b.type), 0) + chosen.reduce((n, f) => n + f.size, 0);
            if (total > B.limits.total) throw Error('ไฟล์สื่อ Banner รวมต่อ Site ต้องไม่เกิน 30 MB');
            for (const file of files) {
                const info = await readFile(file);
                if (replacement) { const target = next.find(b => b.id === replacement); if (!target) throw Error('ไม่พบ Banner ที่ต้องการเปลี่ยน'); Object.assign(target, info); break; }
                next.push({ id: 'banner-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10), name: file.name.slice(0, 160), ...info, link: '', enabled: true });
            }
            update(next); error('เพิ่ม / อัปเดตสื่อ Banner แล้ว');
        } catch (e) { error(e.message); } finally { busy = false; replaceId = ''; fileInput.value = ''; controls(); }
    });
    list.addEventListener('change', event => {
        const input = event.target, id = input.dataset.bannerId, field = input.dataset.bannerField; if (!id || !field || !can('editSite') || busy) return;
        try {
            const next = assets.banners.map(b => ({ ...b })), target = next.find(b => b.id === id); if (!target) return;
            target[field] = field === 'enabled' ? input.checked : input.value;
            if (field === 'link') target.link = B.link(target.link);
            update(next, field === 'enabled'); input.setCustomValidity(''); if (field !== 'enabled') input.value = row(id)[field]; error('บันทึกค่า Banner แล้ว');
        } catch (e) { input.setCustomValidity(e.message); input.reportValidity(); error('ยังไม่บันทึกค่า: ' + e.message); }
    });
    list.addEventListener('input', event => event.target.setCustomValidity?.(''));
    list.addEventListener('click', event => {
        const button = event.target.closest('[data-banner-action]'); if (!button || !can('editSite') || busy) return;
        const id = button.dataset.bannerId, action = button.dataset.bannerAction, index = assets.banners.findIndex(b => b.id === id); if (index < 0) return;
        if (action === 'replace') { replaceId = id; fileInput.multiple = false; fileInput.click(); return; }
        const next = assets.banners.slice();
        if (action === 'remove') next.splice(index, 1);
        else { const to = index + (action === 'up' ? -1 : 1); if (to < 0 || to >= next.length) return;[next[index], next[to]] = [next[to], next[index]]; }
        update(next); error(action === 'remove' ? 'ลบ Banner แล้ว' : 'เปลี่ยนลำดับ Banner แล้ว');
    });
    function preview(lang = language, force = false) {
        language = lang; const en = language === 'en', active = assets.banners.filter(b => b.enabled);
        if (!force && previousLanguage === language && active.length === previous.length && active.every((b, i) => ['id', 'type', 'name', 'src', 'link'].every(k => b[k] === previous[i][k]))) return;
        previous = active.map(b => ({ ...b })); previousLanguage = language;
        const host = q('#wt-banner-media'); host.querySelector('video')?.pause(); host.replaceChildren();
        q('#wt-banner-preview').hidden = !active.length; q('#nt-hero').classList.toggle('wt-has-banners', !!active.length); if (!active.length) { currentId = ''; return; }
        const selected = active.find(b => b.id === currentId) || active[0]; currentId = selected.id;
        const media = document.createElement(selected.type === 'video' ? 'video' : 'img'); media.src = selected.src;
        if (selected.type === 'video') { media.controls = true; media.playsInline = true; media.preload = 'metadata'; media.setAttribute('aria-label', selected.name); } else media.alt = selected.name;
        media.addEventListener('error', () => { q('#wt-banner-playback-error').textContent = en ? 'This browser cannot display this media. Try another file or codec.' : 'Browser เปิดสื่อนี้ไม่ได้ ลองเปลี่ยนไฟล์หรือรูปแบบการเข้ารหัสวิดีโอ'; });
        q('#wt-banner-playback-error').textContent = '';
        const href = B.link(selected.link);
        if (href && selected.type === 'image') { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(media); host.append(a); } else host.append(media);
        const link = q('#wt-banner-link'); link.hidden = !href; link.href = href || '#'; link.textContent = en ? 'Open banner link ↗' : 'เปิดลิงก์ Banner ↗';
        q('#wt-banner-caption').textContent = selected.name;
        q('#wt-banner-position').textContent = (active.indexOf(selected) + 1) + ' / ' + active.length;
        q('#wt-banner-navigation').hidden = active.length < 2;
        q('#wt-banner-prev').textContent = en ? '← Previous' : '← ก่อนหน้า'; q('#wt-banner-next').textContent = en ? 'Next →' : 'ถัดไป →';
    }
    function move(offset) { const active = assets.banners.filter(b => b.enabled); if (!active.length) return; const i = active.findIndex(b => b.id === currentId); currentId = active[(i + offset + active.length) % active.length].id; preview(language, true); }
    q('#wt-banner-prev').addEventListener('click', () => move(-1)); q('#wt-banner-next').addEventListener('click', () => move(1));
    window.WiFiBannerUI = { preview }; NT.onLoad(() => { currentId = ''; renderList(); preview(language, true); });
    renderList(); preview();
})();
