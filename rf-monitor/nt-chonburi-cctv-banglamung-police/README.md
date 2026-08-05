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
