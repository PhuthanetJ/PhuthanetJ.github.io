'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), B = require('../js/banner-model.js');
const image = { id: 'photo', type: 'image', name: 'Promotion', fileName: 'promo.png', src: 'data:image/png;base64,AQID', link: 'https://example.com/offer', enabled: true };
const video = { id: 'movie', type: 'video', name: 'Welcome video', fileName: 'welcome.mp4', src: 'data:video/mp4;base64,AQID', link: '', enabled: false };
test('Multiple banners keep media type, order, link and independent enabled state', () => {
    const result = B.parse([video, image]); assert.deepEqual(result.map(({area, clickable, action, questionnaireIds, ...original}) => original), [video, image]);
    assert.equal(result[0].area, 'b01'); assert.equal(result[0].clickable, false); assert.equal(result[1].clickable, true);
    result[1].enabled = false; assert.equal(image.enabled, true);
    assert.deepEqual(B.parse(JSON.parse(JSON.stringify(result))), result);
});
test('Legacy single image becomes a banner without reviving intentionally deleted items', () => {
    const migrated = B.fromAssets({ banner: image.src }); assert.equal(migrated.length, 1); assert.equal(migrated[0].src, image.src);
    assert.equal(migrated[0].enabled, true); assert.deepEqual(B.fromAssets({ banner: image.src, banners: [] }), []);
});
test('Banner hyperlinks reject active content, unsafe schemes and embedded credentials', () => {
    for (const link of ['javascript:alert(1)', 'data:text/html,test', 'file:///private', '//example.com', 'https://user:password@example.com', 'https://exam\nple.com']) assert.throws(() => B.parse([{ ...image, link }]));
    assert.equal(B.link(' https://example.com/hello?q=ไทย '), 'https://example.com/hello?q=%E0%B9%84%E0%B8%97%E0%B8%A2'); assert.equal(B.link(''), '');
});
test('Media validation rejects type mismatch, malformed base64 and oversized files', () => {
    for (const src of ['data:image/svg+xml;base64,AQID', 'data:text/html;base64,AQID', 'data:video/mp4;base64,AQID', 'data:image/png;base64,abc', 'data:image/png;base64,@@==']) assert.throws(() => B.parse([{ ...image, src }]));
    assert.throws(() => B.fileType({ name: 'large.mp4', type: 'video/mp4', size: B.limits.video + 1 }));
    assert.throws(() => B.fileType({ name: 'zero.png', type: 'image/png', size: 0 }));
    assert.equal(B.fileType({ name: 'clip.webm', type: '', size: 200 }).type, 'video');
    const big = { ...image, src: 'data:image/png;base64,' + Buffer.alloc(B.limits.image + 1).toString('base64') }; assert.throws(() => B.parse([big]));
});
test('Reject duplicate IDs, excess item count and aggregate media above 30 MB', () => {
    assert.throws(() => B.parse([image, image])); assert.throws(() => B.parse(Array.from({ length: 21 }, (_, i) => ({ ...image, id: 'b' + i }))));
    const src = 'data:video/mp4;base64,' + Buffer.alloc(15 * 1024 * 1024).toString('base64');
    assert.throws(() => B.parse([{ ...video, src, id: 'v1' }, { ...video, src, id: 'v2' }, image]), /รวมต่อ Site/);
});

test('Area and video multi-question settings survive serialization; explicit Clickable off stays off', () => {
    for (const area of Object.keys(B.areas)) {
        const banner = {...video, enabled:true, area, clickable:true, action:'questionnaires', questionnaireIds:['age','quiz']};
        assert.deepEqual(B.parse([banner])[0], banner);
        assert.deepEqual(B.parse(JSON.parse(JSON.stringify([banner])))[0], banner);
    }
    assert.equal(B.parse([{...image,clickable:false}])[0].clickable,false);
    for (const extra of [{area:'unknown'},{clickable:'true'},{action:'script'},{questionnaireIds:['q','q']}]) assert.throws(()=>B.parse([{...video,...extra}]));
    assert.throws(()=>B.parse([{...image,action:'questionnaires',questionnaireIds:['q']}]));
});
test('Questionnaire validation, reference checking and quiz grading', () => {
    const questions = B.parseQuestions([
        {id:'age',name:'Age',question:'Age?',type:'survey',answers:['18–29','30–39'],correctAnswer:''},
        {id:'quiz',name:'Quiz',question:'1 + 1?',type:'quiz',answers:['2','3'],correctAnswer:'2'}
    ]);
    assert.equal(B.grade(questions,{age:'18–29',quiz:'2'}).ok,true);
    assert.deepEqual(B.grade(questions,{age:'18–29',quiz:'3'}).incorrect,['quiz']);
    assert.deepEqual(B.grade(questions,{age:'forged',quiz:'2'}).missing,['age']);
    const banner=B.parse([{...video,enabled:true,clickable:true,action:'questionnaires',questionnaireIds:['age','quiz']}])[0];
    assert.deepEqual(B.bindingIssues([banner],questions),[]);
    assert.match(B.bindingIssues([{...banner,questionnaireIds:[]}],questions)[0],/อย่างน้อย 1/);
    assert.match(B.bindingIssues([{...banner,questionnaireIds:['deleted']}],questions)[0],/ไม่พบ/);
    assert.deepEqual(B.bindingIssues([{...banner,clickable:false,questionnaireIds:[]}],questions),[]);
    for (const patch of [{answers:['2','2']},{answers:['2']},{correctAnswer:'4'},{type:'html'}]) assert.throws(()=>B.parseQuestions([{...questions[1],...patch}]));
});
