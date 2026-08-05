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
