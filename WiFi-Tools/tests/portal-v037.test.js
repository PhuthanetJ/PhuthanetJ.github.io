'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = path.join(__dirname, '..'), html = fs.readFileSync(path.join(base, 'html/portal-config.html'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(base, 'data/config.json'), 'utf8'));
const B = require('../js/banner-model.js');

test('V037 replaces Facebook Login with thaiD Login', () => {
  assert.match(html, /data-bind="thaid">thaiD Login/);
  assert.doesNotMatch(html, /Facebook Login/);
  assert.equal(config.state.thaid, false);
  assert.equal(Object.hasOwn(config.state, 'facebook'), false);
});

test('V037 supports Thai, English, Chinese and Japanese portal copy and Terms dropdown', () => {
  for (const lang of ['th','en','zh','ja']) assert.ok(config.copy[lang]);
  assert.match(html, /id="nt-edit-language"[\s\S]*?value="zh">Chinese[\s\S]*?value="ja">Japanese/);
  assert.match(html, /id="wt-terms-language"[\s\S]*?value="zh">Chinese[\s\S]*?value="ja">Japanese/);
  for (const key of ['termsZh','termsJa','termsBodyZh','termsBodyJa']) assert.equal(typeof config.state[key], 'string');
});

test('V037 Questionnaire language accepts four supported languages and rejects invalid language', () => {
  const baseQuestion = { id:'q-lang', name:'Language', type:'survey', question:'Question?', answers:['A','B'], correctAnswer:'' };
  for (const language of ['th','en','zh','ja']) assert.equal(B.parseQuestions([{...baseQuestion, language}])[0].language, language);
  assert.equal(B.parseQuestions([baseQuestion])[0].language, 'th');
  assert.throws(() => B.parseQuestions([{...baseQuestion, language:'xx'}]), /ภาษา Questionnaire/);
  assert.match(html, /id="wt-question-language"/);
});

test('V037 Video Ads is bound to a Video Banner and gated by watch seconds', () => {
  assert.match(html, /id="wt-video-ad-banner"/);
  assert.match(html, /data-bind="videoSeconds"/);
  assert.match(html, /id="wt-video-ad-continue" hidden>ดำเนินการต่อ/);
  assert.equal(config.state.videoBannerId, '');
  assert.equal(config.schemaVersion, 8);
});
