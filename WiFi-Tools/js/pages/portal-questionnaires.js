(function () {
    'use strict'; if (!window.NT) return;
    const { q, esc, lists, assets, can, changed } = NT, B = WiFiBanners;
    const languageNames = { th: 'ไทย', en: 'English', zh: 'Chinese', ja: 'Japanese' };
    let editingId = '';
    const message = text => { q('#wt-question-message').textContent = text; };
    function answers() { return q('#wt-question-answers').value.split(/\r?\n/).map(a => a.trim()).filter(Boolean); }
    function correctOptions(value = q('#wt-question-correct').value) {
        q('#wt-question-correct-field').hidden = q('#wt-question-type').value !== 'quiz';
        q('#wt-question-correct').innerHTML = '<option value="">เลือกคำตอบที่ถูก</option>' + answers().map(a => '<option value="' + esc(a) + '">' + esc(a) + '</option>').join('');
        q('#wt-question-correct').value = value;
    }
    function usage() {
        const where = assets.banners.filter(b => b.questionnaireIds.includes(editingId)).map(b => 'Banner: ' + b.name);
        if (lists.portalQuestionnaireIds.includes(editingId)) where.unshift('หน้า Portal');
        q('#wt-question-usage').textContent = where.length ? 'ใช้คำถามนี้ที่: ' + where.join(' · ') : 'ยังไม่ได้ผูกคำถามนี้กับ Portal หรือวิดีโอ';
    }
    function load(id) {
        const item = lists.questionnaires.find(item => item.id === id); editingId = item?.id || '';
        q('#wt-question-select').value = editingId;
        q('#wt-question-name').value = item?.name || '';
        q('#wt-question-type').value = item?.type || 'survey';
        q('#wt-question-language').value = item?.language || 'th';
        q('#wt-question-text').value = item?.question || '';
        q('#wt-question-answers').value = item?.answers.join('\n') || ''; correctOptions(item?.correctAnswer || '');
        for (const key of ['name', 'type', 'language', 'text', 'answers', 'correct', 'new', 'save']) q('#wt-question-' + key).disabled = !can('editSite');
        q('#wt-question-delete').disabled = !can('editSite') || !editingId; usage();
    }
    function renderChoices() {
        q('#wt-portal-question-choices').innerHTML = lists.questionnaires.length ? lists.questionnaires.map(item => '<label class="nt-check"><input type="checkbox" data-portal-question="' + item.id + '"' + (lists.portalQuestionnaireIds.includes(item.id) ? ' checked' : '') + (can('editSite') ? '' : ' disabled') + '><span>[' + esc(languageNames[item.language] || item.language) + '] ' + esc(item.name) + ' · ' + esc(item.question) + '</span></label>').join('') : '<p>ยังไม่มีคำถาม สร้างได้ในฟอร์มด้านล่าง</p>';
    }
    function render(id = editingId) {
        q('#wt-question-select').innerHTML = '<option value="">สร้างคำถามใหม่</option>' + lists.questionnaires.map(item => '<option value="' + item.id + '">[' + esc(languageNames[item.language] || item.language) + '] ' + esc(item.name) + '</option>').join('');
        renderChoices(); load(id);
    }
    q('#wt-portal-question-choices').addEventListener('change', event => {
        const id = event.target.dataset.portalQuestion; if (!can('editSite') || !lists.questionnaires.some(item => item.id === id)) return renderChoices();
        const selected = lists.portalQuestionnaireIds.filter(key => key !== id); if (event.target.checked) selected.push(id);
        lists.portalQuestionnaireIds = B.questionIds(selected, lists.questionnaires); changed(); renderChoices(); usage(); message('อัปเดตคำถามที่แสดงบนหน้า Portal แล้ว');
    });
    q('#wt-question-select').addEventListener('change', event => { load(event.target.value); message(''); });
    q('#wt-question-new').addEventListener('click', () => { if (!can('editSite')) return; load(''); q('#wt-question-name').focus(); message('กรอกข้อมูลแล้วกดบันทึกคำถาม'); });
    q('#wt-question-type').addEventListener('change', () => correctOptions()); q('#wt-question-answers').addEventListener('input', () => correctOptions());
    q('#wt-question-save').addEventListener('click', () => {
        if (!can('editSite')) return;
        try {
            const id = editingId || 'q-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
            const item = { id, name: q('#wt-question-name').value, type: q('#wt-question-type').value, language: q('#wt-question-language').value, question: q('#wt-question-text').value, answers: answers(), correctAnswer: q('#wt-question-correct').value };
            const next = lists.questionnaires.slice(), index = next.findIndex(row => row.id === id); if (index < 0) next.push(item); else next[index] = item;
            lists.questionnaires = B.parseQuestions(next); changed(); WiFiBannerUI.refresh(); render(id); message('บันทึกคำถามแล้ว · อัปเดตทุก Portal / วิดีโอที่ใช้คำถามนี้ใน Config เดียวกัน');
        } catch (e) { message(e.message); }
    });
    q('#wt-question-delete').addEventListener('click', () => {
        if (!can('editSite') || !editingId) return;
        const used = assets.banners.filter(b => b.questionnaireIds.includes(editingId)).map(b => b.name);
        if (lists.portalQuestionnaireIds.includes(editingId)) used.unshift('หน้า Portal');
        if (used.length) return message('ยังลบไม่ได้ มีการใช้คำถามนี้: ' + used.join(', ') + ' · ยกเลิกการเลือกก่อน');
        lists.questionnaires = lists.questionnaires.filter(item => item.id !== editingId); changed(); WiFiBannerUI.refresh(); render(''); message('ลบคำถามแล้ว');
    });
    function selectedQuestions(language = 'th') { return lists.portalQuestionnaireIds.map(id => lists.questionnaires.find(item => item.id === id)).filter(item => item && item.language === language); }
    function portalMarkup(language = 'th') {
        const questions = selectedQuestions(language);
        if (!questions.length) return '<p class="nt-public-message">ยังไม่ได้เลือก Questionnaire สำหรับภาษานี้</p>';
        const choose = { th: 'เลือกคำตอบ', en: 'Select an answer', zh: '选择答案', ja: '回答を選択' }[language] || 'Select an answer';
        return questions.map(item => '<label class="wt-public-question">' + esc(item.question) + '<select id="wt-public-question-' + item.id + '" class="nt-public-input"><option value="">' + choose + '</option>' + item.answers.map((answer, i) => '<option value="' + i + '">' + esc(answer) + '</option>').join('') + '</select></label>').join('');
    }
    function gradePortal(language = 'th') {
        const questions = selectedQuestions(language), answers = Object.create(null);
        if (!questions.length) return { ok: false, missing: [], incorrect: [] };
        for (const item of questions) { const select = q('#wt-public-question-' + item.id); if (select?.value !== '') answers[item.id] = item.answers[Number(select.value)]; }
        return B.grade(questions, answers);
    }
    window.WiFiQuestionnaireUI = { portalMarkup, gradePortal, edit: id => { q('#nt-tab-engage').click(); load(id || lists.questionnaires[0]?.id); q('#wt-question-editor').scrollIntoView({ block: 'center' }); q('#wt-question-name').focus(); } };
    NT.onLoad(() => render(lists.questionnaires[0]?.id)); render(lists.questionnaires[0]?.id);
})();
