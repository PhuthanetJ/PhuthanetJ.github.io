(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.WiFiBanners = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const MiB = 1024 * 1024, limits = { count: 20, image: 3 * MiB, video: 15 * MiB, total: 30 * MiB, config: 60 * MiB };
    const kinds = { 'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'video/mp4': 'video', 'video/webm': 'video' };
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
            return { id: item.id, type: item.type, name: item.name.trim(), fileName: item.fileName, src: item.src, link: link(item.link), enabled: item.enabled };
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
    return { limits, link, media, parse, fromAssets, fileType };
});
