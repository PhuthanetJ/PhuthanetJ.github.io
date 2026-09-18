(function () {
    'use strict'; if (!window.NT) return;
    const { q, qa, esc, assets, lists, can, changed, toast } = NT, B = WiFiBanners;
    let busy = false, language = 'th', signature = '', replaceId = '', dialogArea = '', quizBannerId = '', quizContext = null, quizPassed = false;
    const selected = {}, fileInput = q('#wt-banner-files'), list = q('#wt-banner-list'), dialog = q('#wt-banner-dialog'), quizDialog = q('#wt-quiz-dialog');
    const active = area => assets.banners.filter(b => b.enabled && b.area === area);
    function error(message) { q('#wt-banner-message').textContent = message; toast(message); }
    function controls() {
        q('#wt-banner-add').disabled = busy || !can('editSite') || assets.banners.length >= B.limits.count;
        qa('[data-banner-action],[data-banner-field],[data-banner-question]').forEach(e => e.disabled = busy || e.dataset.bannerAction !== 'preview' && !can('editSite'));
    }
    function renderList() {
        list.innerHTML = assets.banners.length ? assets.banners.map((b, i) => {
            const attr = ' data-banner-id="' + b.id + '"', field = key => ' data-banner-field="' + key + '"' + attr;
            return '<article class="wt-banner-card" data-banner-card="' + b.id + '"><div class="wt-banner-card-head"><strong>Banner ' + (i + 1) + ' · ' + (b.type === 'video' ? 'Video' : 'Image') + '</strong><label class="nt-check"><input type="checkbox"' + field('enabled') + (b.enabled ? ' checked' : '') + '>Enabled</label></div>' +
                '<p class="nt-help">' + esc(b.fileName || b.name) + '</p><label class="nt-field">Name<input' + field('name') + ' maxlength="160" required value="' + esc(b.name) + '"></label>' +
                '<label class="nt-field">Banner area<select' + field('area') + '>' + Object.entries(B.areas).map(([key, label]) => '<option value="' + key + '"' + (b.area === key ? ' selected' : '') + '>' + esc(label) + '</option>').join('') + '</select></label>' +
                '<label class="nt-check"><input type="checkbox"' + field('clickable') + (b.clickable ? ' checked' : '') + '>Clickable · เปิดการกด Banner</label>' +
                (b.clickable ? (b.type === 'video' ? '<label class="nt-field">เมื่อดำเนินการต่อ<select' + field('action') + '><option value="link"' + (b.action === 'link' ? ' selected' : '') + '>เปิดลิงก์</option><option value="questionnaires"' + (b.action === 'questionnaires' ? ' selected' : '') + '>Quiz / Questionnaires</option></select></label>' : '') +
                    (b.action === 'questionnaires' ? '<fieldset class="wt-banner-question-choices"><legend>Questionnaires · เลือกได้หลายข้อ</legend>' + (lists.questionnaires.length ? lists.questionnaires.map(item => '<label class="nt-check"><input type="checkbox" data-banner-question="' + item.id + '"' + attr + (b.questionnaireIds.includes(item.id) ? ' checked' : '') + '><span>' + esc(item.name) + ' <small>(' + (item.type === 'quiz' ? 'Quiz' : 'แบบสอบถาม') + ')</small></span></label>').join('') : '<p>ยังไม่มีคำถาม สร้างและแก้ไขได้ในแท็บ Quiz &amp; เงื่อนไข</p>') + '<button type="button" class="nt-button nt-compact" data-banner-action="questions"' + attr + '>แก้ไข Questionnaires</button></fieldset>' : '<label class="nt-field">ลิงก์ปลายทาง<input type="url"' + field('link') + ' maxlength="2000" placeholder="https://example.com/promotion" value="' + esc(b.link) + '"></label>') : '') +
                '<div class="nt-row">' + [['preview', 'ดูตัวอย่าง'], ['replace', 'เปลี่ยนไฟล์'], ['up', 'ขึ้น ↑'], ['down', 'ลง ↓'], ['remove', 'ลบ']].map(([key, label]) => '<button type="button" class="nt-button nt-compact" data-banner-action="' + key + '"' + attr + '>' + label + '</button>').join('') + '</div></article>';
        }).join('') : '<p class="nt-help">ยังไม่มี Banner — เพิ่มรูปภาพหรือวิดีโอได้หลายไฟล์</p>';
        q('#wt-banner-count').textContent = assets.banners.length + ' / 20 รายการ · เปิด ' + assets.banners.filter(b => b.enabled).length;
        controls();
    }
    function update(items) { assets.banners = B.parse(items); assets.banner = ''; changed(); renderList(); preview(); }
    async function readFile(file) {
        const { mime, type } = B.fileType(file);
        const src = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ: ' + file.name)); reader.readAsDataURL(file.slice(0, file.size, mime)); });
        return { type, src, fileName: file.name };
    }
    q('#wt-banner-add').addEventListener('click', () => { if (!can('editSite') || busy) return; replaceId = ''; fileInput.multiple = true; fileInput.click(); });
    fileInput.addEventListener('change', async () => {
        if (!can('editSite') || busy) return; const files = Array.from(fileInput.files || []); if (!files.length) return;
        busy = true; controls(); error('กำลังอ่านไฟล์สื่อ…');
        try {
            const replacement = replaceId, next = assets.banners.map(b => ({ ...b })), chosen = replacement ? files.slice(0, 1) : files;
            if (!replacement && next.length + files.length > B.limits.count) throw Error('เพิ่ม Banner ได้ไม่เกิน 20 รายการ');
            chosen.forEach(file => B.fileType(file));
            const total = next.filter(b => b.id !== replacement).reduce((n, b) => n + B.media(b.src, b.type), 0) + chosen.reduce((n, f) => n + f.size, 0);
            if (total > B.limits.total) throw Error('ไฟล์สื่อ Banner รวมต่อ Site ต้องไม่เกิน 30 MB');
            for (const file of chosen) {
                const info = await readFile(file);
                if (replacement) {
                    const target = next.find(b => b.id === replacement); if (!target) throw Error('ไม่พบ Banner ที่ต้องการเปลี่ยน'); Object.assign(target, info);
                    if (info.type !== 'video') { target.action = 'link'; target.questionnaireIds = []; target.clickable = target.clickable && !!target.link; }
                } else next.push({ id: 'banner-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10), name: file.name.slice(0, 160), ...info, link: '', enabled: true, area: 'b01', clickable: false, action: 'link', questionnaireIds: [] });
            }
            update(next); error('เพิ่ม / อัปเดตสื่อ Banner แล้ว');
        } catch (e) { error(e.message); } finally { busy = false; replaceId = ''; fileInput.value = ''; controls(); }
    });
    list.addEventListener('change', event => {
        const input = event.target, id = input.dataset.bannerId, field = input.dataset.bannerField, questionId = input.dataset.bannerQuestion;
        if (!id || !can('editSite') || busy) return;
        try {
            const next = assets.banners.map(b => ({ ...b, questionnaireIds: b.questionnaireIds.slice() })), target = next.find(b => b.id === id); if (!target) return;
            if (questionId) {
                if (!lists.questionnaires.some(item => item.id === questionId)) return;
                target.questionnaireIds = target.questionnaireIds.filter(key => key !== questionId); if (input.checked) target.questionnaireIds.push(questionId);
            } else if (['enabled', 'clickable', 'name', 'area', 'action', 'link'].includes(field)) target[field] = ['enabled', 'clickable'].includes(field) ? input.checked : input.value;
            else return;
            input.setCustomValidity(''); update(next); error('บันทึกค่า Banner แล้ว');
        } catch (e) { input.setCustomValidity(e.message); input.reportValidity(); error('ยังไม่บันทึกค่า: ' + e.message); }
    });
    list.addEventListener('input', event => event.target.setCustomValidity?.(''));
    list.addEventListener('click', event => {
        const button = event.target.closest('[data-banner-action]'); if (!button || busy) return;
        const id = button.dataset.bannerId, action = button.dataset.bannerAction, index = assets.banners.findIndex(b => b.id === id); if (index < 0) return;
        if (action === 'preview') {
            const b = assets.banners[index]; if (!b.enabled) return error('เปิด Enabled ก่อนแสดงใน Preview');
            selected[b.area] = id;
            if (['first', 'modal'].includes(b.area)) openArea(b.area); else { preview(language, true); q('#wt-banner-' + b.area).scrollIntoView({ block: 'center' }); }
            return;
        }
        if (!can('editSite')) return;
        if (action === 'questions') { window.WiFiQuestionnaireUI?.edit(assets.banners[index].questionnaireIds[0]); return; }
        if (action === 'replace') { replaceId = id; fileInput.multiple = false; fileInput.click(); return; }
        const next = assets.banners.slice();
        if (action === 'remove') next.splice(index, 1);
        else if (['up', 'down'].includes(action)) { const to = index + (action === 'up' ? -1 : 1); if (to < 0 || to >= next.length) return; [next[index], next[to]] = [next[to], next[index]]; }
        else return;
        update(next); error(action === 'remove' ? 'ลบ Banner แล้ว' : 'เปลี่ยนลำดับ Banner แล้ว');
    });
    function pause(host) { host.querySelectorAll('video').forEach(video => video.pause()); }
    function renderArea(area, host) {
        pause(host); host.replaceChildren(); const items = active(area); host.hidden = !items.length; if (!items.length) return;
        const b = items.find(item => item.id === selected[area]) || items[0]; selected[area] = b.id;
        const label = document.createElement('p'); label.className = 'wt-banner-area-label'; label.textContent = B.areas[area]; host.append(label);
        const mediaWrap = document.createElement('div'); mediaWrap.className = 'wt-banner-media'; host.append(mediaWrap);
        const media = document.createElement(b.type === 'video' ? 'video' : 'img'); media.src = b.src;
        if (b.type === 'video') { media.controls = true; media.playsInline = true; media.preload = 'metadata'; media.setAttribute('aria-label', b.name); } else media.alt = b.name;
        const href = b.clickable && b.action === 'link' ? B.link(b.link) : '';
        if (href && b.type === 'image') { const anchor = document.createElement('a'); anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.append(media); mediaWrap.append(anchor); } else mediaWrap.append(media);
        const caption = document.createElement('p'); caption.textContent = b.name; host.append(caption);
        const playback = document.createElement('p'); playback.className = 'wt-banner-playback-error'; playback.setAttribute('role', 'status'); host.append(playback);
        media.addEventListener('error', () => { playback.textContent = language === 'en' ? 'This browser cannot display this media. Try another file or codec.' : 'Browser เปิดสื่อนี้ไม่ได้ ลองเปลี่ยนไฟล์หรือรูปแบบการเข้ารหัสวิดีโอ'; });
        if (b.clickable && b.action === 'questionnaires' && !['first', 'modal'].includes(area)) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'nt-button primary wt-banner-continue'; button.textContent = language === 'en' ? 'Continue' : 'ดำเนินการต่อ';
            button.addEventListener('click', () => { pause(host); if (!openQuiz(b.id, false)) playback.textContent = 'กรุณาเลือก Questionnaire ของ Banner ให้ครบก่อนทดลอง'; }); host.append(button);
        } else if (href && b.type === 'video') {
            const anchor = document.createElement('a'); anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = language === 'en' ? 'Open banner link ↗' : 'เปิดลิงก์ Banner ↗'; host.append(anchor);
        }
        if (items.length > 1) {
            const nav = document.createElement('div'); nav.className = 'wt-banner-navigation';
            const position = document.createElement('span'); position.textContent = (items.indexOf(b) + 1) + ' / ' + items.length; position.setAttribute('aria-live', 'polite');
            for (const [offset, text] of [[-1, '←'], [1, '→']]) {
                const button = document.createElement('button'); button.type = 'button'; button.className = 'nt-button'; button.textContent = text;
                button.setAttribute('aria-label', offset < 0 ? 'Banner ก่อนหน้า' : 'Banner ถัดไป');
                button.addEventListener('click', () => { selected[area] = items[(items.indexOf(b) + offset + items.length) % items.length].id; renderArea(area, host); });
                nav.append(button); if (offset < 0) nav.append(position);
            }
            host.append(nav);
        }
    }
    function openArea(area) {
        if (!active(area).length) return;
        dialogArea = area; q('#wt-banner-dialog-title').textContent = area === 'first' ? '1st page · ก่อนเข้า Portal' : 'Modal · Banner';
        q('#wt-banner-dialog-message').textContent = '';
        renderArea(area, q('#wt-banner-dialog-content')); if (!dialog.open) dialog.showModal();
    }
    function advance(area) { if (area === 'first' && active('modal').length) openArea('modal'); }
    q('#wt-banner-first-open').addEventListener('click', () => openArea('first'));
    q('#wt-banner-modal-open').addEventListener('click', () => openArea('modal'));
    q('#wt-banner-dialog-close').addEventListener('click', () => {
        const b = active(dialogArea).find(item => item.id === selected[dialogArea]);
        if (b && b.type === 'video' && b.clickable && b.action === 'questionnaires') {
            if (!openQuiz(b.id, true)) q('#wt-banner-dialog-message').textContent = 'กรุณาเลือก Questionnaire ของ Banner ให้ครบก่อนทดลอง';
            return;
        }
        const area = dialogArea; dialog.close(); advance(area);
    });
    dialog.addEventListener('close', () => pause(q('#wt-banner-dialog-content')));
    function openQuiz(id, fromDialog) {
        const b = assets.banners.find(item => item.id === id && item.enabled && item.clickable && item.action === 'questionnaires'); if (!b) return false;
        const questions = b.questionnaireIds.map(key => lists.questionnaires.find(item => item.id === key));
        if (!questions.length || questions.some(item => !item)) { error('เลือก Questionnaire ของ Banner ให้ครบก่อนทดลอง'); return false; }
        quizBannerId = b.id; quizContext = { area: b.area, fromDialog }; quizPassed = false; q('#wt-quiz-next').hidden = true;
        q('#wt-quiz-title').textContent = b.name + ' · Quiz / Questionnaires'; q('#wt-quiz-result').textContent = '';
        q('#wt-quiz-questions').innerHTML = questions.map((item, index) => '<fieldset class="wt-quiz-question"><legend>' + (index + 1) + '. ' + esc(item.question) + '</legend><p class="nt-help">' + esc(item.name) + ' · ' + (item.type === 'quiz' ? 'Quiz' : 'แบบสอบถาม') + '</p>' + item.answers.map((answer, i) => '<label class="nt-check"><input type="radio" name="question-' + item.id + '" value="' + i + '"><span>' + esc(answer) + '</span></label>').join('') + '</fieldset>').join('');
        if (fromDialog) { pause(q('#wt-banner-dialog-content')); dialog.close(); }
        if (!quizDialog.open) quizDialog.showModal(); return true;
    }
    q('#wt-quiz-close').addEventListener('click', () => quizDialog.close());
    quizDialog.addEventListener('close', () => { const context = quizContext; quizContext = null; if (context?.fromDialog) openArea(context.area); });
    q('#wt-quiz-form').addEventListener('change', () => { quizPassed = false; q('#wt-quiz-next').hidden = true; q('#wt-quiz-result').textContent = ''; });
    q('#wt-quiz-form').addEventListener('submit', event => {
        event.preventDefault(); const b = assets.banners.find(item => item.id === quizBannerId); if (!b) return quizDialog.close();
        const questions = b.questionnaireIds.map(id => lists.questionnaires.find(item => item.id === id)), answers = Object.create(null);
        for (const item of questions) { const checked = q('[name="question-' + item.id + '"]:checked'); if (checked) answers[item.id] = item.answers[Number(checked.value)]; }
        const result = B.grade(questions, answers), output = q('#wt-quiz-result'); quizPassed = result.ok; q('#wt-quiz-next').hidden = !result.ok;
        output.className = 'nt-public-message' + (result.ok ? ' success' : '');
        output.textContent = result.missing.length ? 'กรุณาตอบคำถามให้ครบทุกข้อ' : result.incorrect.length ? 'คำตอบ Quiz ข้อ ' + result.incorrect.map(id => questions.findIndex(item => item.id === id) + 1).join(', ') + ' ยังไม่ถูกต้อง ลองอีกครั้ง' : 'ตอบครบแล้ว · Quiz ผ่าน · กดดำเนินการต่อได้ (ผลตัวอย่าง)';
    });
    q('#wt-quiz-next').addEventListener('click', () => {
        if (!quizPassed) return;
        const context = quizContext; quizContext = null; quizDialog.close(); if (context?.fromDialog) advance(context.area);
    });
    function preview(lang = language, force = false) {
        language = lang; const next = JSON.stringify([language, assets.banners, lists.questionnaires]); if (!force && signature === next) return; signature = next;
        if (quizDialog.open) { quizContext = null; quizDialog.close(); }
        for (const area of ['b01', 'login', 'b02']) renderArea(area, q('#wt-banner-' + area));
        q('#nt-hero').classList.toggle('wt-has-banners', !!active('b01').length);
        q('#wt-banner-first-open').disabled = !active('first').length; q('#wt-banner-modal-open').disabled = !active('modal').length;
        if (dialog.open) { if (active(dialogArea).length) renderArea(dialogArea, q('#wt-banner-dialog-content')); else dialog.close(); }
    }
    window.WiFiBannerUI = { preview, refresh: () => { renderList(); preview(language, true); } };
    NT.onLoad(() => { quizContext = null; dialog.close(); quizDialog.close(); signature = ''; renderList(); preview(language, true); });
    renderList(); preview();
})();
