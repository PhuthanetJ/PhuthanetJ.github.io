'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// DOM harness: verifies navigation state/focus; it does not render CSS.
function setup({ mobile = true, hidden = false, login = false, division = false } = {}) {
    let doc;
    class Element {
        constructor(tag = 'div', classes = '') {
            this.tagName = tag; this.children = []; this.parent = null;
            this.hidden = false; this.inert = false; this.attrs = {}; this.events = {};
            this.style = {}; this.className = classes; this.dataset = {}; this.textContent = '';
            this.classList = {
                add: c => { this.className += ' ' + c; },
                contains: c => this.className.split(/\s+/).includes(c),
                toggle: (c, on) => {
                    const list = this.className.split(/\s+/).filter(x => x && x !== c);
                    if (on) list.push(c); this.className = list.join(' ');
                }
            };
        }
        append(...children) { children.forEach(c => { c.parent = this; this.children.push(c); }); }
        prepend(...children) { children.forEach(c => { c.parent = this; }); this.children.unshift(...children); }
        before(el) { el.parent = this.parent; this.parent.children.splice(this.parent.children.indexOf(this), 0, el); }
        after(el) { el.parent = this.parent; this.parent.children.splice(this.parent.children.indexOf(this) + 1, 0, el); }
        setAttribute(k, v) { this.attrs[k] = String(v); }
        removeAttribute(k) { delete this.attrs[k]; }
        addEventListener(k, f) { (this.events[k] ??= []).push(f); }
        emit(k, event = {}) { for (const f of this.events[k] || []) f({ target: this, ...event }); }
        dispatchEvent(event) { this.emit(event.type, event); }
        focus() { doc.activeElement = this; }
        contains(el) { return el === this || this.children.some(c => c.contains(el)); }
        getClientRects() { return this.hidden ? [] : [{}]; }
        matches(sel) {
            if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
            if (sel.startsWith('#')) return this.id === sel.slice(1);
            if (sel === 'label') return this.tagName === 'label';
            if (sel === 'a.active') return this.tagName === 'a' && this.classList.contains('active');
            if (sel === 'a[href]') return this.tagName === 'a' && this.attrs.href;
            if (sel === 'button:not(:disabled)') return this.tagName === 'button' && !this.disabled;
            return false;
        }
        querySelectorAll(sel) {
            const selectors = sel.split(',').map(s => s.trim());
            const all = this.children.flatMap(c => [c, ...c.descendants()]);
            return all.filter(el => selectors.some(s => el.matches(s)));
        }
        descendants() { return this.children.flatMap(c => [c, ...c.descendants()]); }
        querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
        closest(sel) { return this.matches(sel) ? this : this.parent?.closest(sel); }
    }
    const root = new Element(), header = new Element('header', 'nt-top');
    root.id = 'nt-portal'; root.hidden = hidden;
    const brand = new Element('div', 'nt-brand'), nav = new Element('nav', 'nt-side');
    const main = new Element('main', 'nt-main'), footer = new Element('footer', 'nt-app-footer');
    const dashboard = new Element('a', 'nt-nav active'), reports = new Element('a', 'nt-nav'), users = new Element('a', 'nt-nav');
    [dashboard, reports, users].forEach(el => el.setAttribute('href', 'page.html'));
    users.hidden = true; nav.append(dashboard, reports, users);
    header.append(brand);
    let divisionSelect = null, divisionStore = { saved: 'all' };
    if (division && !login) {
        const wrapper = new Element('div', 'wt-header'), label = new Element('label');
        divisionSelect = new Element('select'); divisionSelect.id = 'wt-current-division';
        divisionSelect.options = ['ALL', 'กรุงเทพและปริมณฑล', 'ภาคกลาง', 'ภาคตะวันออก', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคใต้']
            .map((textContent, i) => ({ textContent, value: ['all', 'bangkok-metro', 'central', 'east', 'north', 'northeast', 'south'][i] }));
        divisionSelect.value = 'all';
        Object.defineProperty(divisionSelect, 'selectedOptions', { get: () => divisionSelect.options.filter(opt => opt.value === divisionSelect.value) });
        divisionSelect.addEventListener('change', () => { divisionStore.saved = divisionSelect.value; });
        label.append(divisionSelect); wrapper.append(label); header.append(wrapper);
    }
    if (login) root.append(main); else root.append(header, nav, main, footer);
    const table = new Element('div', 'nt-table-wrap'); main.append(table);
    const events = {}, media = { matches: mobile, addEventListener: (k, f) => { media.change = f; } };
    doc = {
        body: { style: { overflow: 'auto' } }, activeElement: main,
        createElement: tag => new Element(tag),
        getElementById: id => [root, ...root.descendants()].find(el => el.id === id) || null,
        addEventListener: (k, f) => { (events[k] ??= []).push(f); }
    };
    const ctx = { document: doc, window: { matchMedia: () => media }, Event: class { constructor(type, options) { this.type = type; Object.assign(this, options); } } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/mobile.js'), 'utf8'), ctx);
    return {
        root, header, nav, main, footer, table, dashboard, reports, users, doc,
        divisionSelect, divisionStore,
        outside: target => (events.click || []).forEach(fn => fn({ target })),
        toggle: doc.getElementById('wt-menu-toggle'), close: doc.getElementById('wt-menu-close'),
        resize: value => { media.matches = value; media.change(); },
        key: (key, shiftKey = false) => { let prevented = false; (events.keydown || []).forEach(fn => fn({ key, shiftKey, preventDefault() { prevented = true; } })); return prevented; }
    };
}

test('Mobile menu opens accessibly, closes via Escape, backdrop and navigation, and restores scrolling', () => {
    const x = setup();
    assert.equal(x.nav.inert, true);
    assert.equal(x.dashboard.attrs['aria-current'], 'page');
    x.toggle.emit('click');
    assert.equal(x.toggle.attrs['aria-expanded'], 'true');
    assert.equal(x.nav.attrs['aria-modal'], 'true');
    assert.equal(x.header.inert, true);
    assert.equal(x.main.inert, true);
    assert.equal(x.doc.body.style.overflow, 'hidden');
    assert.equal(x.doc.activeElement, x.close);
    assert.equal(x.key('Escape'), true);
    assert.equal(x.nav.inert, true);
    assert.equal(x.toggle.attrs['aria-expanded'], 'false');
    assert.equal(x.header.inert, false);
    assert.equal(x.doc.body.style.overflow, 'auto');
    assert.equal(x.doc.activeElement, x.toggle);
    x.toggle.emit('click'); x.root.querySelector('.wt-menu-backdrop').emit('click');
    assert.equal(x.main.inert, false);
    x.toggle.emit('click'); x.nav.emit('click', { target: x.reports });
    assert.equal(x.nav.inert, true);
    assert.equal(x.doc.activeElement, x.toggle);
});

test('Keyboard focus stays in the drawer and ignores a role-hidden User link', () => {
    const x = setup(); x.toggle.emit('click');
    assert.equal(x.key('Tab', true), true);
    assert.equal(x.doc.activeElement, x.reports);
    assert.equal(x.key('Tab'), true);
    assert.equal(x.doc.activeElement, x.close);
    assert.equal(x.users.hidden, true);
    x.main.focus(); x.key('Tab');
    assert.equal(x.doc.activeElement, x.close);
});

test('Switching between mobile and desktop releases the drawer without leaving focus hidden', () => {
    const x = setup(); x.toggle.emit('click'); x.resize(false);
    assert.equal(x.nav.inert, false);
    assert.equal(x.main.inert, false);
    assert.equal(x.nav.attrs['aria-modal'], undefined);
    assert.equal(x.doc.activeElement, x.dashboard);
    x.resize(true);
    assert.equal(x.nav.inert, true);
    assert.equal(x.doc.activeElement, x.toggle);
    x.resize(false); x.toggle.emit('click');
    assert.equal(x.toggle.attrs['aria-expanded'], 'false');
    assert.equal(x.nav.inert, false);
});

test('Login and unauthenticated pages do not get a navigation drawer; tables get a keyboard scroll region', () => {
    const login = setup({ login: true }); assert.equal(login.toggle, null);
    assert.equal(login.table.tabIndex, 0); assert.equal(login.table.attrs.role, 'region');
    const hidden = setup({ hidden: true }); assert.equal(hidden.toggle, null);
});


test('Mobile division picker supports touch-style button selection and reuses the original change handler', () => {
    const x = setup({ division: true });
    const trigger = x.doc.getElementById('wt-division-mobile-trigger');
    const choices = x.doc.getElementById('wt-division-mobile-choices');
    assert.ok(trigger);
    assert.equal(trigger.textContent, 'ALL');
    assert.equal(trigger.attrs['aria-expanded'], 'false');
    assert.equal(choices.children.length, 7);
    trigger.emit('click');
    assert.equal(choices.hidden, false);
    assert.equal(trigger.attrs['aria-expanded'], 'true');
    choices.children.find(button => button.dataset.division === 'northeast').emit('click');
    assert.equal(x.divisionSelect.value, 'northeast');
    assert.equal(x.divisionStore.saved, 'northeast');
    assert.equal(trigger.textContent, 'ภาคตะวันออกเฉียงเหนือ');
    assert.equal(trigger.attrs['aria-expanded'], 'false');
    assert.equal(x.doc.activeElement, trigger);
    assert.equal(choices.children.find(button => button.dataset.division === 'northeast').attrs['aria-pressed'], 'true');
});

test('Mobile division picker closes on outside click, Escape, navigation drawer and desktop resize', () => {
    const x = setup({ division: true });
    const trigger = x.doc.getElementById('wt-division-mobile-trigger');
    const choices = x.doc.getElementById('wt-division-mobile-choices');
    trigger.emit('click'); x.outside(x.main);
    assert.equal(choices.hidden, true);
    trigger.emit('click'); assert.equal(x.key('Escape'), true);
    assert.equal(choices.hidden, true);
    trigger.emit('click'); x.toggle.emit('click');
    assert.equal(choices.hidden, true);
    x.close.emit('click'); x.resize(false);
    trigger.emit('click');
    assert.equal(choices.hidden, true, 'desktop keeps native select and disables mobile picker');
});

test('Desktop preserves native select and synchronizes values if changed programmatically', () => {
    const x = setup({ mobile: false, division: true });
    const trigger = x.doc.getElementById('wt-division-mobile-trigger');
    x.divisionSelect.value = 'south';
    x.divisionSelect.emit('change');
    assert.equal(trigger.textContent, 'ภาคใต้');
    assert.equal(x.divisionStore.saved, 'south');
    assert.equal(x.divisionSelect.options.length, 7);
});
