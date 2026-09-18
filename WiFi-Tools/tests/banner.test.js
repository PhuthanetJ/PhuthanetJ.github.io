'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), B = require('../js/banner-model.js');
const image = { id: 'photo', type: 'image', name: 'Promotion', fileName: 'promo.png', src: 'data:image/png;base64,AQID', link: 'https://example.com/offer', enabled: true };
const video = { id: 'movie', type: 'video', name: 'Welcome video', fileName: 'welcome.mp4', src: 'data:video/mp4;base64,AQID', link: '', enabled: false };
test('Multiple banners keep media type, order, link and independent enabled state', () => {
    const result = B.parse([video, image]); assert.deepEqual(result, [video, image]);
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
