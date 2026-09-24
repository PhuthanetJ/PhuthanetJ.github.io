(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.WiFiBanners = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const MiB = 1024 * 1024, limits = { count: 20, image: 3 * MiB, video: 15 * MiB, total: 30 * MiB, config: 60 * MiB };
    const kinds = { 'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'video/mp4': 'video', 'video/webm': 'video' };
    const areas = { b01: 'b01 · ส่วนหัว / ข้างฟอร์ม', b02: 'b02 · ใต้ฟอร์ม', login: 'login · เหนือฟอร์มเข้าสู่ระบบ', modal: 'modal · หน้าต่างบน Portal', first: '1st page · ก่อนเข้าหน้า Portal' };
    function link(value) {
        if (typeof value !== 'string' || value.length > 2000) throw Error('ลิงก์ต้องเป็นข้อความไม่เกิน 2,000 ตัวอักษร');
        const text = value.trim(); if (!text) return '';
        if (!/^https?:\/\//i.test(text) || /[\u0000-\u0020\u007f]/.test(text)) throw Error('ลิงก์ต้องเริ่มด้วย https:// หรือ http:// และไม่มีช่องว่าง');
        let url; try { url = new URL(text); } catch (_) { throw Error('รูปแบบลิงก์ไม่ถูกต้อง'); }
        if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw Error('ลิงก์ไม่ถูกต้อง หรือมี Username / Password ใน URL');
        return url.href;
    }
    function media(src, type) {
        if (typeof src !== 'string') throw Error('ไม่พบไฟล์สื่อ Banner');
        const comma = src.indexOf(','), header = src.slice(0, comma), mime = header.slice(5, -7);
        if (comma < 0 || header !== 'data:' + mime + ';base64' || kinds[mime] !== type) throw Error('ใช้รูปภาพ PNG / JPG / WebP หรือวิดีโอ MP4 / WebM');
        const body = src.slice(comma + 1), bytes = body.length * 3 / 4 - (body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0);
        if (!body.length || body.length % 4 || bytes > limits[type] || !/^[A-Za-z0-9+/]*={0,2}$/.test(body)) throw Error('ไฟล์สื่อไม่ถูกต้อง หรือเกินขนาดที่กำหนด (รูป 3 MB / วิดีโอ 15 MB)');
        return bytes;
    }
    function parse(items) {
        if (!Array.isArray(items) || items.length > limits.count) throw Error('เพิ่ม Banner ได้ไม่เกิน 20 รายการ');
        const seen = new Set(); let total = 0;
        const result = items.map(item => {
            if (!item || !['image', 'video'].includes(item.type) || typeof item.enabled !== 'boolean' || typeof item.id !== 'string' || !/^[-a-zA-Z0-9_]{1,80}$/.test(item.id) || seen.has(item.id)) throw Error('ข้อมูล Banner หรือรหัสรายการไม่ถูกต้อง');
            if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 160 || typeof item.fileName !== 'string' || item.fileName.length > 255) throw Error('กรอกชื่อ Banner ไม่เกิน 160 ตัวอักษร');
            seen.add(item.id); total += media(item.src, item.type);
            const href = link(item.link), area = item.area === undefined ? 'b01' : item.area;
            const clickable = item.clickable === undefined ? !!href : item.clickable;
            const action = item.action === undefined ? 'link' : item.action, questionnaireIds = item.questionnaireIds === undefined ? [] : item.questionnaireIds;
            if (!Object.hasOwn(areas, area) || typeof clickable !== 'boolean' || !['link', 'questionnaires'].includes(action)) throw Error('Banner area หรือ Clickable ไม่ถูกต้อง');
            if (!Array.isArray(questionnaireIds) || questionnaireIds.length > 20 || new Set(questionnaireIds).size !== questionnaireIds.length || questionnaireIds.some(id => typeof id !== 'string' || !/^[-a-zA-Z0-9_]{1,80}$/.test(id))) throw Error('รายการ Questionnaires ไม่ถูกต้อง');
            if (item.type !== 'video' && (action === 'questionnaires' || questionnaireIds.length)) throw Error('เลือก Questionnaires ได้เฉพาะ Banner วิดีโอ');
            return { id: item.id, type: item.type, name: item.name.trim(), fileName: item.fileName, src: item.src, link: href, enabled: item.enabled, area, clickable, action, questionnaireIds: questionnaireIds.slice() };
        });
        if (total > limits.total) throw Error('ไฟล์สื่อ Banner รวมต่อ Site ต้องไม่เกิน 30 MB');
        return result;
    }
    function fromAssets(assets) {
        if (assets.banners !== undefined) return parse(assets.banners);
        return assets.banner ? parse([{ id: 'banner-legacy', type: 'image', name: 'Banner เดิม', fileName: '', src: assets.banner, link: '', enabled: true }]) : [];
    }
    function fileType(file) {
        const mime = file.type || ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' }[file.name.split('.').pop().toLowerCase()]);
        const type = kinds[mime]; if (!type || !file.size || file.size > limits[type]) throw Error('เลือก PNG / JPG / WebP ไม่เกิน 3 MB หรือ MP4 / WebM ไม่เกิน 15 MB');
        return { mime, type };
    }
    function parseQuestions(items) {
        if (!Array.isArray(items) || items.length > 50) throw Error('Questionnaires ต้องเป็นรายการไม่เกิน 50 ข้อ');
        const seen = new Set();
        return items.map(item => {
            if (!item || typeof item.id !== 'string' || !/^[-a-zA-Z0-9_]{1,80}$/.test(item.id) || seen.has(item.id)) throw Error('รหัส Questionnaire ไม่ถูกต้องหรือซ้ำ');
            seen.add(item.id);
            if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 160 || typeof item.question !== 'string' || !item.question.trim() || item.question.length > 2000 || !['survey', 'quiz'].includes(item.type)) throw Error('กรอกชื่อ ประเภท และคำถามให้ครบ');
            const language = item.language === undefined ? 'th' : item.language;
            if (!['th', 'en', 'zh', 'ja'].includes(language)) throw Error('ภาษา Questionnaire ไม่ถูกต้อง');
            if (!Array.isArray(item.answers) || item.answers.length < 2 || item.answers.length > 20 || item.answers.some(a => typeof a !== 'string' || !a.trim() || a.length > 300) || new Set(item.answers.map(a => a.trim())).size !== item.answers.length) throw Error('กรอกตัวเลือก 2–20 รายการที่ไม่ซ้ำกัน');
            const answers = item.answers.map(a => a.trim());
            if (typeof item.correctAnswer !== 'string' || item.type === 'quiz' && !answers.includes(item.correctAnswer.trim())) throw Error('คำตอบ Quiz ต้องตรงกับตัวเลือก');
            return { id: item.id, name: item.name.trim(), type: item.type, language, question: item.question.trim(), answers, correctAnswer: item.type === 'quiz' ? item.correctAnswer.trim() : '' };
        });
    }
    function bindingIssues(banners, questions) {
        const ids = new Set(questions.map(q => q.id)), issues = [];
        for (const b of banners) {
            if (b.questionnaireIds.some(id => !ids.has(id))) issues.push(b.name + ': ไม่พบ Questionnaire ที่เลือก');
            if (!b.enabled || !b.clickable) continue;
            if (b.action === 'questionnaires' && !b.questionnaireIds.length) issues.push(b.name + ': เลือก Questionnaire อย่างน้อย 1 รายการ');
            if (b.action === 'link' && !b.link) issues.push(b.name + ': กรอกลิงก์ปลายทาง หรือปิด Clickable');
        }
        return issues;
    }
    function grade(questions, answers) {
        const missing = [], incorrect = [];
        for (const q of questions) {
            const value = Object.hasOwn(answers, q.id) ? answers[q.id] : undefined;
            if (!q.answers.includes(value)) missing.push(q.id);
            else if (q.type === 'quiz' && value !== q.correctAnswer) incorrect.push(q.id);
        }
        return { ok: !missing.length && !incorrect.length, missing, incorrect };
    }
    function questionIds(ids, questions) {
        if (!Array.isArray(ids) || ids.length > 50 || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !questions.some(q => q.id === id))) throw Error('รายการ Questionnaire ของ Portal ไม่ถูกต้องหรือไม่พบคำถาม');
        return ids.slice();
    }
    function migratePortalQuestions(lists, state) {
        if (lists.portalQuestionnaireIds !== undefined) {
            lists.portalQuestionnaireIds = questionIds(lists.portalQuestionnaireIds, lists.questionnaires); return;
        }
        // Preserve a legacy custom question and reuse a matching catalog entry when possible.
        const answers = typeof state.answers === 'string' ? state.answers.split(',').map(a => a.trim()).filter(Boolean) : [];
        const old = { id: 'legacy-portal-question', name: 'คำถาม Portal เดิม', type: state.surveyType, language: 'th', question: state.question, answers, correctAnswer: state.correctAnswer };
        let valid; try { valid = parseQuestions([old])[0]; } catch (_) { lists.portalQuestionnaireIds = []; return; }
        const match = lists.questionnaires.find(q => q.type === valid.type && q.question === valid.question && JSON.stringify(q.answers) === JSON.stringify(valid.answers) && q.correctAnswer === valid.correctAnswer);
        if (match) { lists.portalQuestionnaireIds = [match.id]; return; }
        let i = 1; while (lists.questionnaires.some(q => q.id === valid.id)) valid.id = 'legacy-portal-question-' + i++;
        lists.questionnaires = parseQuestions([...lists.questionnaires, valid]); lists.portalQuestionnaireIds = [valid.id];
    }
    return { limits, areas, link, media, parse, fromAssets, fileType, parseQuestions, bindingIssues, grade, questionIds, migratePortalQuestions };
});
