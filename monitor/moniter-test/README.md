# Network Monitor Dashboard V3 — Direct Load

เวอร์ชันนี้โหลด PRTG Public Map เข้า iframe โดยตรงทันที

## สิ่งที่ถอดออก

- หน้าคั่น `HTTP Hosting Required`
- การตรวจว่า Dashboard เป็น HTTP หรือ HTTPS
- การตรวจ Mixed Content
- `fetch()` Connection Probe
- การตรวจ CORS/Certificate ก่อนโหลด
- Help Overlay ที่บังหน้า Map
- ปุ่ม Redirect Certificate และปุ่ม Retry ในหน้าคั่น

## สิ่งที่ยังทำงาน

- Dropdown เลือก Map
- โหลด URL HTTP ที่ PRTG Generate มาโดยตรง
- ปุ่ม Refresh
- ปุ่มเปิด Map
- Fullscreen
- ตัวนับและรีเฟรชอัตโนมัติทุก 2 นาที
- Responsive Desktop/Mobile

## URL ที่ใช้

```text
http://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2447&mapid=D85564DB-3F1D-4D10-8E21-99B0CA9B2D98
```

```text
http://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2506&mapid=26815356-D3C7-4522-91C0-80DB58E8FF69
```

## หมายเหตุ

โค้ดจะไม่ขวางการโหลดอีกต่อไป แต่ Browser ยังเป็นผู้ตัดสินขั้นสุดท้ายว่าอนุญาต
HTTP iframe ภายในหน้าปัจจุบันหรือไม่

เมื่อโหลดเกิน 20 วินาที ระบบจะไม่เปิดหน้าคั่น เพียงเปลี่ยน Badge เป็น
`Monitor Map Load Timeout` และแสดง Toast เท่านั้น
