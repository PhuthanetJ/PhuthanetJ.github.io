(function () {
    'use strict'; if (!window.NT) return;
    const { q, qa, esc, state, copy, assets, lists, can, changed, syncFields, toast } = NT;
    const languages = ['th', 'en', 'zh', 'ja'];
    const languageLabels = { th: 'ไทย', en: 'English', zh: 'Chinese', ja: 'Japanese' };
    const ui = {
        th: { termsTitle: 'เงื่อนไขการใช้งาน Free WiFi', version: 'รุ่นเงื่อนไข: ', close: 'ปิด', accept: 'ยอมรับเงื่อนไข', accepted: 'ยอมรับเงื่อนไขแล้ว สามารถกดรับสิทธิ์ใช้งานฟรีได้', select: 'เลือกคำตอบ', signIn: 'เข้าสู่ระบบ', continueWith: 'เข้าสู่ระบบด้วย ', phone: 'เบอร์โทรศัพท์', hours: 'ชั่วโมง · ไม่ต้องกรอก Username / OTP', termsRequired: 'กรุณาอ่านและยอมรับเงื่อนไขก่อนรับสิทธิ์', questionsRequired: 'กรุณาตอบคำถามให้ครบทุกข้อ', quizInvalid: 'กรุณาตรวจคำตอบ Quiz และการเลือกคำถาม', coupon: 'ใช้คูปองที่สร้างสำหรับ Site นี้', approved: 'จำลองรับสิทธิ์สำเร็จ: ', approvedTail: ' ชั่วโมง · ยังไม่เกิด Session จริง', providerDemo: 'ตัวอย่างเท่านั้น ยังไม่ได้เชื่อมต่อ ', register: 'ลงทะเบียน Free Wi-Fi', registerDemo: 'ตัวอย่างหน้าลงทะเบียน Free Wi-Fi · ยังไม่เชื่อม Backend', socialLogin: 'Social Login', videoNeed: 'กรุณาดู Video Ads ให้ครบเวลาที่กำหนด', videoDone: 'ดู Video Ads ครบแล้ว · กดดำเนินการต่อได้' },
        en: { termsTitle: 'Free WiFi terms of use', version: 'Version: ', close: 'Close', accept: 'Accept terms', accepted: 'Terms accepted. You can request free WiFi.', select: 'Select an answer', signIn: 'Sign in', continueWith: 'Continue with ', phone: 'Phone number', hours: 'hour(s) · No username or OTP required', termsRequired: 'Please read and accept the terms first.', questionsRequired: 'Please answer every question.', quizInvalid: 'Please check the quiz answers and question settings.', coupon: 'Use a coupon generated for this site.', approved: 'Sample session approved: ', approvedTail: ' hour(s) · no network session created', providerDemo: 'Preview only. Provider is not connected: ', register: 'Register Free Wi-Fi', registerDemo: 'Registration preview only. Backend is not connected.', socialLogin: 'Social Login', videoNeed: 'Watch the Video Ad for the required time.', videoDone: 'Video Ad requirement completed. Continue is available.' },
        zh: { termsTitle: 'Free WiFi 使用条款', version: '版本: ', close: '关闭', accept: '接受条款', accepted: '已接受条款，可以继续申请免费 WiFi。', select: '选择答案', signIn: '登录', continueWith: '使用以下方式继续: ', phone: '手机号码', hours: '小时 · 无需 Username / OTP', termsRequired: '请先阅读并接受使用条款。', questionsRequired: '请回答所有问题。', quizInvalid: '请检查 Quiz 答案和问题设置。', coupon: '请使用此 Site 生成的 Coupon。', approved: '模拟授权成功: ', approvedTail: ' 小时 · 尚未建立真实 Session', providerDemo: '仅为预览，尚未连接 Provider: ', register: '注册 Free Wi-Fi', registerDemo: '仅为注册预览，尚未连接 Backend。', socialLogin: 'Social Login', videoNeed: '请观看 Video Ads 达到设定时间。', videoDone: '已完成 Video Ads 观看要求，可以继续。' },
        ja: { termsTitle: 'Free WiFi 利用規約', version: 'バージョン: ', close: '閉じる', accept: '規約に同意', accepted: '規約に同意しました。無料 WiFi を利用できます。', select: '回答を選択', signIn: 'ログイン', continueWith: '次の方法で続行: ', phone: '電話番号', hours: '時間 · Username / OTP は不要です', termsRequired: '利用規約を読み、同意してください。', questionsRequired: 'すべての質問に回答してください。', quizInvalid: 'Quiz の回答と質問設定を確認してください。', coupon: 'この Site 用に発行された Coupon を使用してください。', approved: 'サンプル認証成功: ', approvedTail: ' 時間 · 実際の Session は作成されません', providerDemo: 'プレビューのみです。Provider は未接続: ', register: 'Free Wi-Fi に登録', registerDemo: '登録画面のプレビューのみです。Backend は未接続です。', socialLogin: 'Social Login', videoNeed: '設定された時間まで Video Ads を視聴してください。', videoDone: 'Video Ads の視聴条件を満たしました。続行できます。' }
    };
    const termFields = {
        th: ['termsTh', 'termsBodyTh'], en: ['termsEn', 'termsBodyEn'],
        zh: ['termsZh', 'termsBodyZh'], ja: ['termsJa', 'termsBodyJa']
    };
    let language = 'th', previewMode = 'normal', proposal = null, acceptedTerms = '', videoContinue = null, watchedSeconds = 0, lastVideoTime = 0;
    const termsDialog = q('#nt-terms-dialog'), videoDialog = q('#wt-video-ad-dialog'), videoMedia = q('#wt-video-ad-media');
    const termsSignature = () => JSON.stringify([state.termsVersion, ...languages.flatMap(lang => termFields[lang].map(key => state[key]))]);
    const termLink = lang => state[termFields[lang]?.[0]] || '';
    const termBody = lang => state[termFields[lang]?.[1]] || '';
    function fillTermsEditor() {
        const lang = q('#wt-terms-language').value || 'th', [linkKey, bodyKey] = termFields[lang];
        q('#wt-terms-link-text').value = state[linkKey] || '';
        q('#wt-terms-body-text').value = state[bodyKey] || '';
        q('#wt-terms-link-text').disabled = !can('editSite'); q('#wt-terms-body-text').disabled = !can('editSite');
    }
    q('#wt-terms-language').addEventListener('change', fillTermsEditor);
    q('#wt-terms-link-text').addEventListener('input', event => { if (!can('editSite')) return fillTermsEditor(); state[termFields[q('#wt-terms-language').value][0]] = event.target.value; acceptedTerms = ''; changed(); });
    q('#wt-terms-body-text').addEventListener('input', event => { if (!can('editSite')) return fillTermsEditor(); state[termFields[q('#wt-terms-language').value][1]] = event.target.value; acceptedTerms = ''; changed(); });
    function openTerms() {
        const text = ui[language] || ui.en, body = termBody(language);
        q('#nt-terms-title').textContent = text.termsTitle;
        q('#nt-terms-version').textContent = text.version + state.termsVersion;
        q('#nt-terms-body').textContent = body; q('#nt-terms-body').lang = language;
        q('#nt-terms-close').textContent = text.close; q('#nt-terms-confirm').textContent = text.accept;
        q('#nt-terms-confirm').disabled = !body.trim(); termsDialog.showModal(); q('#nt-terms-body').scrollTop = 0;
    }
    q('#nt-terms-close').addEventListener('click', () => termsDialog.close());
    q('#nt-terms-confirm').addEventListener('click', () => {
        if (!state.termsEnabled || !termBody(language).trim()) return;
        acceptedTerms = termsSignature(); const accept = q('#nt-public-accept'); if (accept) accept.checked = true;
        termsDialog.close(); feedback((ui[language] || ui.en).accepted, true);
    });
    qa('[data-tab]').forEach(el => el.addEventListener('click', () => { qa('[data-tab]').forEach(x => { x.classList.toggle('active', x === el); x.setAttribute('aria-selected', x === el ? 'true' : 'false'); }); qa('.nt-form').forEach(x => x.hidden = x.id !== 'nt-form-' + el.dataset.tab); }));

    function videoBanners() { return assets.banners.filter(item => item.type === 'video'); }
    function selectedVideoBanner() { return videoBanners().find(item => item.id === state.videoBannerId); }
    function fillVideoAdOptions() {
        const select = q('#wt-video-ad-banner'), videos = videoBanners();
        select.innerHTML = '<option value="">เลือก Video Banner</option>' + videos.map(item => '<option value="' + esc(item.id) + '">' + esc(item.name) + '</option>').join('');
        select.value = videos.some(item => item.id === state.videoBannerId) ? state.videoBannerId : '';
        select.disabled = !can('editSite') || !videos.length;
        q('#wt-video-ad-preview').disabled = !selectedVideoBanner();
        q('#wt-video-ad-help').textContent = videos.length ? 'พบ Video Banner ' + videos.length + ' รายการ' : 'ยังไม่มี Video Banner · เพิ่มวิดีโอที่แท็บดีไซน์ก่อน';
    }
    q('#wt-video-ad-banner').addEventListener('change', event => { if (!can('editSite')) return fillVideoAdOptions(); state.videoBannerId = event.target.value; changed(); });
    function closeVideoAd() { try { videoMedia.pause(); } catch (_) { } videoMedia.removeAttribute('src'); videoMedia.load?.(); videoContinue = null; if (videoDialog.open) videoDialog.close(); }
    function unlockVideoAd() { q('#wt-video-ad-continue').hidden = false; q('#wt-video-ad-status').textContent = (ui[language] || ui.en).videoDone; }
    function openVideoAd(done) {
        const banner = selectedVideoBanner(); if (!banner) { feedback('Video Ads: ยังไม่ได้เลือก Video Banner', false); return false; }
        watchedSeconds = 0; lastVideoTime = 0; videoContinue = typeof done === 'function' ? done : null;
        q('#wt-video-ad-title').textContent = banner.name + ' · Video Ads'; q('#wt-video-ad-continue').hidden = true;
        q('#wt-video-ad-status').textContent = (ui[language] || ui.en).videoNeed + ' (' + state.videoSeconds + 's)';
        videoMedia.src = banner.src; videoMedia.currentTime = 0; if (!videoDialog.open) videoDialog.showModal(); return true;
    }
    videoMedia.addEventListener('timeupdate', () => {
        const now = Number(videoMedia.currentTime) || 0, delta = now - lastVideoTime; lastVideoTime = now;
        if (!videoMedia.paused && delta > 0 && delta < 2) watchedSeconds += delta;
        const duration = Number(videoMedia.duration), required = Number.isFinite(duration) && duration > 0 ? Math.min(state.videoSeconds, duration) : state.videoSeconds;
        if (watchedSeconds >= required) unlockVideoAd(); else q('#wt-video-ad-status').textContent = (ui[language] || ui.en).videoNeed + ' (' + Math.max(0, Math.ceil(required - watchedSeconds)) + 's)';
    });
    videoMedia.addEventListener('ended', () => { const duration = Number(videoMedia.duration), required = Number.isFinite(duration) && duration > 0 ? Math.min(state.videoSeconds, duration) : state.videoSeconds; if (watchedSeconds >= Math.max(0, required - 0.5)) unlockVideoAd(); });
    q('#wt-video-ad-cancel').addEventListener('click', closeVideoAd);
    q('#wt-video-ad-continue').addEventListener('click', () => { if (q('#wt-video-ad-continue').hidden) return; const done = videoContinue; closeVideoAd(); done?.(); });
    q('#wt-video-ad-preview').addEventListener('click', () => openVideoAd(() => toast('ทดลอง Video Ads เสร็จแล้ว')));

    function approve(text) { feedback(text.approved + state.hours + text.approvedTail, true); }
    function preview() {
        const c = copy[language] || copy.en, text = ui[language] || ui.en;
        q('#nt-phone').style.setProperty('--portal-button', state.buttonColor); q('#nt-phone').style.setProperty('--portal-text', state.buttonTextColor);
        WiFiBannerUI.preview(language); q('#nt-phone').style.backgroundImage = assets.background ? 'url("' + assets.background + '")' : ''; q('#nt-phone').style.backgroundSize = 'cover';
        q('#nt-hero-label').textContent = state.name; q('#nt-logo-image').hidden = !assets.logo; q('#nt-wordmark').hidden = !!assets.logo;
        if (assets.logo) q('#nt-logo-image').src = assets.logo; else q('#nt-logo-image').removeAttribute('src');
        q('#nt-path-preview').textContent = 'https://portal.example' + state.path; q('#nt-browser-url').textContent = 'portal.example' + state.path;
        let html = '<h3>' + esc(c.title) + '</h3><p>' + esc(c.subtitle) + '</p>';
        if (state.videoEnabled) { const video = selectedVideoBanner(); html += '<div class="nt-public-message success">Video Ads · ' + esc(video?.name || 'ยังไม่ได้เลือก Video Banner') + ' · ' + esc(state.videoSeconds) + 's</div>'; }
        if (state.surveyEnabled) html += WiFiQuestionnaireUI.portalMarkup(language);
        if (state.member) html += '<input aria-label="Username ตัวอย่าง" class="nt-public-input" placeholder="Username" autocomplete="off"><input aria-label="Password ตัวอย่าง" class="nt-public-input" type="password" placeholder="Password" autocomplete="off"><button type="button" class="nt-public-button" data-public-auth="RADIUS">' + text.signIn + '</button>';
        if (state.thaid) html += '<button type="button" class="nt-public-button" data-public-auth="thaid">' + text.continueWith + 'thaiD</button>';
        if (state.otp) html += '<input aria-label="เบอร์โทรศัพท์ตัวอย่าง" class="nt-public-input" inputmode="tel" placeholder="' + text.phone + '"><button type="button" class="nt-public-button" data-public-auth="OTP">' + esc(c.otp) + '</button>';
        if (state.registerEnabled) html += '<button type="button" class="nt-public-register-button" id="nt-public-register">' + esc(text.register) + '</button>';
        const socialProviders = [
            { key: 'line', label: 'LINE', cls: 'line', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-4 3v-3H4z"></path><circle cx="9" cy="10.5" r="1"></circle><circle cx="12" cy="10.5" r="1"></circle><circle cx="15" cy="10.5" r="1"></circle></svg>' },
            { key: 'google', label: 'Google', cls: 'google', icon: '<span aria-hidden="true">G</span>' },
            { key: 'apple', label: 'Apple', cls: 'apple', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-1.7-2-4.7-1.8-6.3.3-2.4 3.1-.8 9 1.7 12 1 1.2 2.2 1 3.2.4.9-.5 2-.5 2.9 0 1 .6 2.2.8 3.3-.6 1.1-1.4 2-3.2 2.3-4.9-2.7-1.1-3.2-4.7-.9-6.1-1.2-.8-3.1-1-4.3-.8z"></path><path d="M13.8 3c.1 1.2-.4 2.4-1.2 3.2-.8.8-1.9 1.3-3 1.2-.1-1.1.4-2.3 1.2-3.1.8-.8 2-1.3 3-1.3z"></path></svg>' }
        ];
        const enabledSocial = socialProviders.filter(provider => state[provider.key]);
        if (enabledSocial.length) html += '<div class="nt-public-social-wrap"><div class="nt-public-social-label">' + esc(text.socialLogin) + '</div><div class="nt-public-social">' + enabledSocial.map(provider => '<button type="button" class="nt-public-social-button nt-social-' + provider.cls + '" data-public-auth="' + provider.key + '" aria-label="' + esc(provider.label) + ' Login" title="' + esc(provider.label) + ' Login">' + provider.icon + '</button>').join('') + '</div></div>';
        if (state.termsEnabled) html += '<div class="nt-public-terms"><input type="checkbox" id="nt-public-accept" aria-labelledby="nt-public-terms-link"' + (acceptedTerms === termsSignature() ? ' checked' : '') + '><button type="button" id="nt-public-terms-link" class="wt-terms-link" aria-haspopup="dialog" aria-controls="nt-terms-dialog">' + esc(termLink(language)) + '</button></div>';
        if (state.guest) { if (state.voucherMode === 'coupon') html += '<input id="nt-public-coupon" class="nt-public-input" aria-label="คูปองตัวอย่าง" placeholder="DEMO-01">'; html += '<button type="button" class="nt-public-button" id="nt-public-connect">' + esc(c.button) + '</button><p>' + esc(state.hours) + ' ' + text.hours + '</p>'; }
        html += '<div id="nt-public-feedback" role="status"></div><div>' + languages.map(lang => '<button type="button" class="nt-public-lang ' + (language === lang ? 'active' : '') + '" data-lang="' + lang + '">' + languageLabels[lang] + '</button>').join('') + '</div>';
        q('#nt-public-content').innerHTML = html;
        q('#nt-public-terms-link')?.addEventListener('click', openTerms);
        q('#nt-public-accept')?.addEventListener('click', event => { if (event.currentTarget.checked) { event.preventDefault(); openTerms(); } else acceptedTerms = ''; });
        qa('.nt-public-button, .nt-public-register-button').forEach(el => el.style.borderRadius = state.shape === 'pill' ? '24px' : state.shape === 'square' ? '0' : '7px');
        qa('[data-lang]').forEach(el => el.addEventListener('click', () => { language = el.dataset.lang; q('#nt-edit-language').value = language; fillCopy(); preview(); }));
        qa('[data-public-auth]').forEach(el => el.addEventListener('click', () => feedback(text.providerDemo + el.dataset.publicAuth, false)));
        q('#nt-public-register')?.addEventListener('click', () => feedback(text.registerDemo, true));
        q('#nt-public-connect')?.addEventListener('click', () => {
            if (state.termsEnabled && (acceptedTerms !== termsSignature() || !q('#nt-public-accept').checked)) return feedback(text.termsRequired, false);
            if (state.surveyEnabled) { const result = WiFiQuestionnaireUI.gradePortal(language); if (result.missing.length || !lists.portalQuestionnaireIds.some(id => lists.questionnaires.find(item => item.id === id)?.language === language)) return feedback(text.questionsRequired, false); if (!result.ok) return feedback(text.quizInvalid, false); }
            if (state.guest && state.voucherMode === 'coupon' && !NT.db.coupons.some(coupon => coupon.siteId === NT.currentSite && coupon.code === q('#nt-public-coupon').value.trim())) return feedback(text.coupon, false);
            if (state.videoEnabled) return openVideoAd(() => approve(text));
            approve(text);
        });
        if (previewMode === 'error') feedback(c.error + ' · DEMO-001', false);
        fillVideoAdOptions();
    }
    function feedback(text, ok) { const el = q('#nt-public-feedback'); if (!el) return; el.className = 'nt-public-message' + (ok ? ' success' : ''); el.textContent = text; }
    function fillCopy() { qa('[data-copy]').forEach(el => el.value = (copy[q('#nt-edit-language').value] || copy.en)[el.dataset.copy]); }
    q('#nt-edit-language').addEventListener('change', () => { language = q('#nt-edit-language').value; fillCopy(); preview(); });
    qa('[data-copy]').forEach(el => el.addEventListener('input', () => { copy[q('#nt-edit-language').value][el.dataset.copy] = el.value; changed(); }));
    qa('[data-asset]').forEach(el => el.addEventListener('change', () => {
        const f = el.files && el.files[0]; if (!f) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 3 * 1024 * 1024) { toast('เลือก PNG / JPG / WebP ขนาดไม่เกิน 3 MB'); el.value = ''; return; }
        const reader = new FileReader(); reader.onload = () => { assets[el.dataset.asset] = reader.result; changed(); toast('อัปเดตภาพใน Preview แล้ว'); }; reader.onerror = () => toast('อ่านไฟล์ภาพไม่สำเร็จ'); reader.readAsDataURL(f);
    }));
    qa('[data-clear]').forEach(el => el.addEventListener('click', () => { assets[el.dataset.clear] = ''; q('[data-asset="' + el.dataset.clear + '"]').value = ''; changed(); }));
    q('#nt-preview-error').addEventListener('click', () => { previewMode = 'error'; preview(); }); q('#nt-preview-normal').addEventListener('click', () => { previewMode = 'normal'; preview(); });
    q('#nt-mode-ai').addEventListener('click', () => { q('#nt-ai-panel').hidden = false; q('#nt-mode-ai').setAttribute('aria-pressed', 'true'); q('#nt-mode-manual').setAttribute('aria-pressed', 'false'); });
    q('#nt-mode-manual').addEventListener('click', () => { q('#nt-ai-panel').hidden = true; q('#nt-mode-ai').setAttribute('aria-pressed', 'false'); q('#nt-mode-manual').setAttribute('aria-pressed', 'true'); });
    q('#nt-ai-generate').addEventListener('click', () => {
        const p = q('#nt-ai-prompt').value, hours = p.match(/([1-9][0-9]?)\s*(ชั่วโมง|hour)/i);
        proposal = { hours: hours ? Math.min(24, Number(hours[1])) : state.hours, buttonColor: p.includes('เขียว') ? '#15805e' : p.includes('ม่วง') ? '#7249b9' : '#086cf0', guest: true, otp: !(p.includes('ไม่ใช้ OTP') || p.includes('ไม่ใช้ otp')), termsEnabled: true };
        const labels = { hours: 'ระยะเวลา (ชั่วโมง)', buttonColor: 'สีปุ่ม', guest: 'รับสิทธิ์ฟรี', otp: 'SMS / OTP', termsEnabled: 'ยอมรับเงื่อนไข' }, display = v => typeof v === 'boolean' ? (v ? 'เปิด' : 'ปิด') : v;
        q('#nt-ai-diff').innerHTML = '<table><thead><tr><th>รายการ</th><th>ปัจจุบัน</th><th>ข้อเสนอ</th></tr></thead><tbody>' + Object.keys(proposal).map(k => '<tr><td>' + labels[k] + '</td><td>' + esc(display(state[k])) + '</td><td>' + esc(display(proposal[k])) + '</td></tr>').join('') + '</tbody></table><div class="nt-help">ตัวจำลองอ่านเฉพาะสี ชั่วโมง และการเปิด OTP ไม่ประมวลผลคำสั่งอื่น</div>';
        q('#nt-ai-review').hidden = false;
    });
    q('#nt-ai-apply').addEventListener('click', () => { if (!proposal) return; Object.assign(state, proposal); syncFields(); changed(); q('#nt-ai-review').hidden = true; proposal = null; toast('นำข้อเสนอตัวอย่างเข้า Draft แล้ว สามารถแก้ต่อด้วย Manual ได้'); });
    q('#nt-ai-dismiss').addEventListener('click', () => { proposal = null; q('#nt-ai-review').hidden = true; toast('ยกเลิกข้อเสนอแล้ว'); });
    function setDevice(mode) { const desktop = mode === 'desktop'; q('#nt-phone').classList.toggle('nt-desktop-screen', desktop); q('#nt-phone').classList.toggle('nt-mobile-screen', !desktop); q('.nt-preview-wrap').classList.toggle('nt-mobile-mode', !desktop); q('#nt-device-desktop').setAttribute('aria-pressed', String(desktop)); q('#nt-device-mobile').setAttribute('aria-pressed', String(!desktop)); q('#nt-preview-device-label').textContent = desktop ? 'Desktop' : 'Mobile'; }
    q('#nt-device-desktop').addEventListener('click', () => setDevice('desktop')); q('#nt-device-mobile').addEventListener('click', () => setDevice('mobile'));
    q('#nt-preview-expand').addEventListener('click', () => { const expanded = q('.nt-editor-grid').classList.toggle('nt-preview-expanded'); q('#nt-preview-expand').textContent = expanded ? 'ย่อ Preview' : 'ขยาย Preview'; q('#nt-preview-expand').setAttribute('aria-pressed', String(expanded)); });
    NT.onChange(() => { previewMode = 'normal'; fillTermsEditor(); fillVideoAdOptions(); preview(); });
    NT.onLoad(() => { proposal = null; acceptedTerms = ''; fillCopy(); fillTermsEditor(); fillVideoAdOptions(); preview(); });
    fillCopy(); fillTermsEditor(); fillVideoAdOptions(); preview(); setDevice('desktop');
})();
