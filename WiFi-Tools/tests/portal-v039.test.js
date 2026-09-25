'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'html/portal-config.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'js/pages/portal-config.js'), 'utf8');
const qjs = fs.readFileSync(path.join(base, 'js/pages/portal-questionnaires.js'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(base, 'data/config.json'), 'utf8'));
const provinces = JSON.parse(fs.readFileSync(path.join(base, 'data/thailand-provinces.json'), 'utf8'));

test('V049 Free Trial and Register identity use independent field sets', () => {
  assert.match(html, /id="wt-free-trial-fields"/);
  assert.match(html, /id="wt-identity-fields"/);
  for (const prefix of ['freeTrial','identity']) {
    for (const suffix of ['Name','Gender','ThaiCitizenId','Passport','Birthday','Mobile','Email','Province']) {
      const key = prefix + suffix + 'Enabled';
      assert.match(html, new RegExp('data-bind="' + key + '"'));
      assert.equal(config.state[key], true);
    }
  }
  assert.match(js, /fieldEnabled\(context, 'Name'\)/);
  assert.match(js, /previewRegistrationMarkup\(registerContext\)/);
});

test('Province dropdown data contains 77 unique provinces across seven geographic groups', () => {
  assert.equal(provinces.regions.length, 7);
  const names = provinces.regions.flatMap(region => region.provinces);
  assert.equal(names.length, 77);
  assert.equal(new Set(names).size, 77);
  assert.match(js, /provinceOptions\(\)/);
});

test('V039 Questionnaire editor uses a Terms-style language dropdown', () => {
  assert.match(html, /id="wt-questionnaire-language"[\s\S]*value="th">ไทย[\s\S]*value="en">English[\s\S]*value="zh">Chinese[\s\S]*value="ja">Japanese/);
  assert.match(qjs, /questionnaireLanguage/);
  assert.match(qjs, /languageItems\(\)/);
  assert.doesNotMatch(html, /id="wt-question-language"/);
});

test('V049 uses schema 11 for split Free Trial and Register field sets', () => {
  assert.equal(config.schemaVersion, 11);
});
