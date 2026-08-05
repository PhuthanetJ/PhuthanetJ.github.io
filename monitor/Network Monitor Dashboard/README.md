# Network Monitor Dashboard — Refresh Only Create By James Phuthanet

เวอร์ชันนี้แสดงเฉพาะตัวนับรีเฟรชอัตโนมัติที่มุมล่างของ Map

```text
รีเฟรชใน 04:59
```

## สิ่งที่แก้ไข

- ถอด Map Size ออกจาก Footer
- ถอด Scale ออกจาก Footer
- ถอด Divider ที่ไม่ใช้งาน
- ป้องกัน JavaScript Error จาก `mapSizeText` และ `scaleText` ที่ไม่มีใน HTML
- ยังคงรีเฟรช Map อัตโนมัติทุก 5 นาที
- ยังคงรีเซ็ตตัวนับเมื่อกด Refresh, Retry หรือเปลี่ยน Map

## ปรับระยะเวลา

แก้ใน `app.js`:

```javascript
const AUTO_REFRESH_MS = 5 * 60 * 1000;
```

## แก้ไข Dropdown ใช้งานไม่ได้

สาเหตุอยู่ใน `app.js` ภายในฟังก์ชัน `changeSelectedMap()`:

```javascript
if (!PRTG_MAPS[selectedKey]) {
```

แต่ Object รายการ Map ที่ประกาศจริงชื่อ:

```javascript
const Monitor_MAPS = {
```

เมื่อเปลี่ยน Dropdown จึงเกิด Runtime Error:

```text
ReferenceError: PRTG_MAPS is not defined
```

แก้เป็น:

```javascript
if (!Monitor_MAPS[selectedKey]) {
```

หลังแก้แล้ว Dropdown จะเปลี่ยน `activeMapKey`, URL ใน iframe, ชื่อ Map,
ปุ่มเปิด Map และตัวนับรีเฟรชตามรายการที่เลือกได้ตามปกติ

