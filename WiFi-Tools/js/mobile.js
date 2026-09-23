/* Mobile navigation enhances the same per-menu HTML used on desktop. */
(function () {
    'use strict';
    const root = document.getElementById('nt-portal');
    if (!root || root.hidden) return;

    // Keep keyboard users and touch users aware that wide tables scroll locally.
    root.querySelectorAll('.nt-table-wrap, .wt-radius-table, .wt-plan-table, .wt-portal-coverage').forEach((wrap) => {
        wrap.tabIndex = 0;
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'ตารางข้อมูล เลื่อนซ้าย–ขวาเพื่อดูทุกคอลัมน์');
        const hint = document.createElement('p');
        hint.className = 'wt-scroll-hint';
        hint.textContent = 'เลื่อนตารางซ้าย–ขวาเพื่อดูทุกคอลัมน์ ↔';
        wrap.before(hint);
    });

    const nav = root.querySelector('.nt-side');
    const brand = root.querySelector('.nt-brand');
    if (!nav || !brand) return; // Login and print pages have no navigation drawer.
    const media = window.matchMedia('(max-width: 780px)');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'wt-menu-toggle';
    toggle.className = 'wt-menu-toggle';
    toggle.setAttribute('aria-label', 'เปิดเมนูหลัก');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'wt-main-navigation');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    brand.prepend(toggle);
    nav.id = 'wt-main-navigation';
    nav.setAttribute('aria-label', 'เมนูหลัก Wi-Fi Tools');
    const heading = document.createElement('div');
    heading.className = 'wt-drawer-heading';
    const title = document.createElement('strong');
    title.textContent = 'Wi-Fi Tools';
    const close = document.createElement('button');
    close.type = 'button';
    close.id = 'wt-menu-close';
    close.textContent = 'ปิด';
    close.setAttribute('aria-label', 'ปิดเมนูหลัก');
    heading.append(title, close);
    nav.prepend(heading);
    nav.querySelector('a.active')?.setAttribute('aria-current', 'page');
    const backdrop = document.createElement('div');
    backdrop.className = 'wt-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    root.append(backdrop);

    // Mobile fallback for the division selector: use explicit touch-friendly buttons
    // instead of relying on the device's native <select> popup. The original select
    // remains the only data source and still handles persistence via its change event.
    const divisionSelect = root.querySelector('#wt-current-division');
    const originalDivisionLabel = divisionSelect?.closest('label');
    let closeDivision = () => {};
    if (divisionSelect && originalDivisionLabel && divisionSelect.options.length) {
        originalDivisionLabel.classList.add('wt-division-original');
        const picker = document.createElement('div');
        picker.className = 'wt-division-mobile';
        const title = document.createElement('span');
        title.className = 'wt-division-title';
        title.textContent = 'ส่วนงาน';
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'wt-division-trigger';
        trigger.id = 'wt-division-mobile-trigger';
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'wt-division-mobile-choices');
        const choices = document.createElement('div');
        choices.id = 'wt-division-mobile-choices';
        choices.className = 'wt-division-choices';
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', 'เลือกส่วนงาน');
        choices.hidden = true;
        const buttons = [];
        const sync = () => {
            trigger.textContent = divisionSelect.selectedOptions[0]?.textContent || 'ALL';
            buttons.forEach(button => {
                const selected = button.dataset.division === divisionSelect.value;
                button.setAttribute('aria-pressed', String(selected));
                button.classList.toggle('selected', selected);
            });
        };
        closeDivision = (returnFocus = false) => {
            if (choices.hidden) return;
            choices.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (returnFocus) trigger.focus();
        };
        Array.from(divisionSelect.options).forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wt-division-choice';
            button.dataset.division = option.value;
            button.textContent = option.textContent;
            button.addEventListener('click', () => {
                divisionSelect.value = option.value;
                // Reuse the existing app.js change handler; no independent mobile state.
                divisionSelect.dispatchEvent(new Event('change', { bubbles: true }));
                sync();
                closeDivision(true);
            });
            buttons.push(button);
            choices.append(button);
        });
        picker.append(title, trigger, choices);
        originalDivisionLabel.after(picker);
        divisionSelect.addEventListener('change', sync);
        trigger.addEventListener('click', () => {
            if (!media.matches) return;
            choices.hidden = !choices.hidden;
            trigger.setAttribute('aria-expanded', String(!choices.hidden));
        });
        document.addEventListener('click', event => {
            if (!picker.contains(event.target)) closeDivision();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !choices.hidden) {
                event.preventDefault();
                closeDivision(true);
            }
        });
        sync();
    }

    let opened = false;
    let previousOverflow = '';
    let inertBefore = [];
    const content = Array.from(root.querySelectorAll('.nt-top, .nt-main, .nt-app-footer'));
    function setOpen(value, returnFocus = true) {
        const next = Boolean(value && media.matches);
        if (next === opened) return;
        opened = next;
        root.classList.toggle('wt-menu-open', opened);
        toggle.setAttribute('aria-expanded', String(opened));
        if (opened) {
            closeDivision();
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            inertBefore = content.map(el => el.inert);
            nav.inert = false;
            nav.setAttribute('role', 'dialog');
            nav.setAttribute('aria-modal', 'true');
            close.focus();
            content.forEach(el => { el.inert = true; });
        } else {
            content.forEach((el, i) => { el.inert = inertBefore[i]; });
            document.body.style.overflow = previousOverflow;
            nav.removeAttribute('role');
            nav.removeAttribute('aria-modal');
            nav.inert = media.matches;
            if (returnFocus && media.matches) toggle.focus();
        }
    }
    toggle.addEventListener('click', () => setOpen(!opened));
    close.addEventListener('click', () => setOpen(false));
    backdrop.addEventListener('click', () => setOpen(false));
    nav.addEventListener('click', event => {
        if (event.target.closest('a[href]')) setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (!opened) return;
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(nav.querySelectorAll('a[href], button:not(:disabled)'))
            .filter(el => !el.hidden && el.getClientRects().length > 0);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !nav.contains(document.activeElement))) {
            event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !nav.contains(document.activeElement))) {
            event.preventDefault(); first?.focus();
        }
    });
    function resize() {
        if (!media.matches) closeDivision();
        const focusWasInMenu = nav.contains(document.activeElement);
        setOpen(false, false);
        nav.inert = media.matches;
        if (media.matches && focusWasInMenu) toggle.focus();
        else if (!media.matches && (document.activeElement === toggle || document.activeElement === close)) nav.querySelector('a.active')?.focus();
    }
    if (media.addEventListener) media.addEventListener('change', resize);
    else media.addListener(resize);
    root.classList.add('wt-mobile-ready');
    resize();
})();
