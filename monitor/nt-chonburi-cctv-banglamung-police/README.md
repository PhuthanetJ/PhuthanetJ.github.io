# V1.0.1
# PRTG Dashboard — Maximum Fit Create By James Phuthanet

เวอร์ชันนี้รักษาสัดส่วนเดิมของ PRTG Map และขยายให้ใหญ่ที่สุดเท่าที่พื้นที่หน้าจออนุญาต

## พฤติกรรม

- รักษาสัดส่วน 1024 × 768
- ไม่ยืดหรือบีบภาพแยกแกน
- ความสูงไม่เกินพื้นที่ Map Stage
- ความกว้างไม่เกินพื้นที่ Map Stage
- จัด Map อยู่กึ่งกลางทั้งแนวนอนและแนวตั้ง
- ไม่มี Scroll แนวตั้งหรือแนวนอน
- คำนวณใหม่เมื่อ Resize Browser หรือเข้า Fullscreen

## สูตรคำนวณ

```javascript
const scaleByWidth = availableWidth / 1024;
const scaleByHeight = availableHeight / 768;
const scale = Math.min(scaleByWidth, scaleByHeight);
```

การเลือกค่าที่น้อยกว่าทำให้ Map มีขนาดใหญ่ที่สุด โดยไม่ล้นขอบด้านใดด้านหนึ่ง

## ค่า PRTG Map

- Map Width: 1024
- Map Height: 768
- Automatic Scaling: Do not automatically scale map view


# V1.0.2
# Network Monitor Dashboard — LINE Browser Fix

เวอร์ชันนี้แก้กรณีเปิด Dashboard หรือ PRTG Map จาก LINE In-App Browser แล้วพบหน้าขาวหรือข้อความว่าเปิดหน้าไม่ได้

## การทำงานใน LINE

ระบบตรวจ User-Agent ของ LINE แล้ว:

- ไม่เรียก `fetch()` ไปยัง PRTG
- ไม่โหลด PRTG ใน `iframe`
- ไม่เริ่ม Auto Refresh
- แสดงหน้าแจ้งเตือนแทน
- มีปุ่ม `เปิด Dashboard ด้วย Chrome`
- มีปุ่ม `เปิด PRTG ด้วย Chrome`
- ปุ่ม `เปิด Map` บน Toolbar จะพยายามเปิด Chrome โดยตรง

## การทำงานใน Chrome/Browser ปกติ

ทำงานเหมือนเดิม:

- Dropdown เลือก Map
- ตรวจสอบ PRTG
- แสดง Map ใน iframe
- รีเฟรชอัตโนมัติ
- ตัวนับถอยหลัง
- Fullscreen

## หมายเหตุสำคัญ

ไฟล์นี้เป็น Workaround สำหรับ LINE Browser เท่านั้น

การแก้ถาวรยังต้องติดตั้ง SSL Certificate ที่เชื่อถือได้ให้:

```text
rfcctv.fortiddns.com
```

เพราะ JavaScript ไม่สามารถข้าม `NET::ERR_CERT_AUTHORITY_INVALID` แทนผู้ใช้ได้

