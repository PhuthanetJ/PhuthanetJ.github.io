'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../html/portal-config.html'), 'utf8');

test('Portal Configuration: General & Path is first and initially selected', () => {
    const tabs = html.match(/<div class="nt-tabs"[\s\S]*?<\/div>/)[0];
    const labels = [...tabs.matchAll(/data-tab="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(labels, ['general', 'auth', 'design', 'copy', 'engage']);
    assert.match(tabs, /class="nt-tab active"[^>]*id="nt-tab-general" aria-selected="true"/);
    assert.match(tabs, /class="nt-tab"[^>]*id="nt-tab-auth" aria-selected="false"/);
});

test('Portal Configuration: General panel shown, Design hidden, others unchanged', () => {
    const panels = [...html.matchAll(/<section class="nt-panel nt-form"[^>]+>/g)].map(match => match[0]);
    assert.deepEqual(panels.map(tag => /id="nt-form-([^"]+)"/.exec(tag)[1]), ['general', 'design', 'copy', 'auth', 'engage']);
    assert.doesNotMatch(panels[0], /\bhidden\b/);
    assert.match(panels[1], /\bhidden\b/);
    for (const panel of panels.slice(2)) assert.match(panel, /\bhidden\b/);
});


test('Portal Configuration: quick function labels use requested wording', () => {
    assert.match(html, /ฟังก์ชั่น Register/);
    assert.match(html, /ฟังก์ชั่น Free Trial/);
    assert.match(html, /รับ Account ผ่าน SMS/);
    assert.match(html, /รับ Account ผ่าน E-mail/);
    assert.doesNotMatch(html.match(/<h3>ฟังก์ชันการทำงาน<\/h3>[\s\S]*?<\/div>/)[0], /LINE Login|Questionnaire|Terms &amp; Conditions|Free WiFi/);
});
