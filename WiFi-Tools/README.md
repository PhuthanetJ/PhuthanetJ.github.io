# NT WiFi Tools — Offline Source

ต้นแบบสำหรับปรับ Portal พร้อม Dashboard และ Reports ธีมน้ำเงิน–ขาว ตัวอักษรขนาดอ่านง่าย แยก HTML, CSS, JavaScript และ JSON แล้ว

## เปิดใช้งาน

1. แตก ZIP ทั้งหมดก่อนเปิด ห้ามเปิดเฉพาะ HTML จากภายใน ZIP
2. ดับเบิลคลิก `index.html` ด้วย Chrome หรือ Edge จะเข้าสู่ Dashboard
3. ใช้งานออฟไลน์ได้ ไม่ต้องติดตั้ง Node.js, npm หรือรัน Web Server
4. เลือกเมนูด้านซ้ายเพื่อเปิด HTML ของแต่ละหน้า

Dashboard, Reports, Logs, คูปอง, AI และการตรวจ Policy เป็นข้อมูลหรือการทำงานจำลอง ไม่มีการเชื่อม AP, Controller, RADIUS, SMS, Social Login หรือ API จริง และไม่สามารถปล่อยอินเทอร์เน็ตให้ผู้ใช้ได้

## ไฟล์ของแต่ละเมนู

| เมนู | HTML | CSS เฉพาะหน้า | JavaScript เฉพาะหน้า |
|---|---|---|---|
| Dashboard | html/dashboard.html | css/dashboard.css | js/pages/dashboard.js |
| Portal Configuration | html/portal-config.html | css/portal-config.css | js/pages/portal-config.js |
| Reports | html/reports.html | css/reports.css | js/pages/reports.js |
| RADIUS & Policy | html/radius-policy.html | css/radius-policy.css | js/pages/radius-policy.js |
| AP & Network | html/ap-network.html | css/ap-network.css | js/pages/ap-network.js |
| Free WiFi & Coupon | html/free-wifi-coupons.html | css/free-wifi-coupons.css | js/pages/free-wifi-coupons.js |
| Monitor & Logs | html/monitor-logs.html | css/monitor-logs.css | js/pages/monitor-logs.js |
| การแจ้งเตือน | html/alerts.html | css/alerts.css | js/pages/alerts.js |
| โมดูลตามสเปก | html/modules.html | css/modules.css | js/pages/modules.js |

`css/common.css` เก็บธีม ตัวอักษร Sidebar และ Component ที่ใช้ร่วมกัน ส่วน `js/core.js` จัดการ Config, Form Binding, Import/Export และส่งต่อ Draft ระหว่างเมนู

## JSON แยกจากโค้ด

| ไฟล์ | เนื้อหา |
|---|---|
| data/config.json | ค่าเริ่มต้นของ Portal, ข้อความไทย/อังกฤษ, ภาพ, RADIUS Policy, Walled Garden, MAC, Coupon และ Alert |
| data/dashboard.json | Site, Sessions, AP, Authentication, แนวโน้ม และเหตุการณ์จำลอง |
| data/reports.json | รายการรายวันและนิยาม Login/Register, Authentication, Traffic และ Coupon |
| data/logs.json | Portal / Authentication / Accounting / Audit logs ตัวอย่าง |
| data/modules.json | ขอบเขตโมดูลเพิ่มเติมและสถานะ |
| data/navigation.json | ชื่อเมนู คำอธิบาย และชื่อ HTML สำหรับอ้างอิงโครงสร้าง |

Browser ไม่สามารถโหลด JSON อัตโนมัติด้วย `fetch()` จาก `file://` ได้เหมือน Web Server จึงมี `js/offline-data.js` ซึ่งสร้างจาก JSON ทั้ง 6 ไฟล์ เพื่อให้ดับเบิลคลิกเปิดออฟไลน์ได้โดยไม่ลดข้อจำกัดความปลอดภัยของ Browser

เมื่อ Dev แก้ JSON ให้รันคำสั่งนี้จากโฟลเดอร์โปรเจกต์ โดยใช้ Node.js ที่ติดตั้งในเครื่อง:

```bash
node scripts/build-offline-data.js
```

ไม่ต้อง `npm install` จากนั้น Reload หน้าเว็บ ถ้าเคยแก้ Draft ให้กด **โหลดค่าตั้งต้น** เพื่อเริ่มใช้ `data/config.json` ฉบับใหม่ โดยดาวน์โหลด Draft เดิมเก็บไว้ก่อน

`js/offline-data.js` เป็นไฟล์ที่สร้างอัตโนมัติ ไม่ควรแก้ด้วยมือ การแก้ชื่อเมนูใน `navigation.json` เป็นการแก้ข้อมูลอ้างอิงเท่านั้น ต้องแก้ชื่อหรือ Link ใน HTML ให้ตรงกันด้วย โครงสร้าง HTML แต่ละหน้าเป็นไฟล์จริง ไม่ถูกสร้างจาก JavaScript ขณะเปิดหน้า

## บันทึกและโหลด Config

- กด **ดาวน์โหลด Config JSON** เพื่อเก็บค่ารวมถึงภาพที่อัปโหลดลงเครื่อง
- กด **โหลด Config JSON** บนเมนูใดก็ได้ เพื่อใช้ค่าร่วมกันทุกหน้า รองรับรูปแบบ JSON จากต้นแบบ Offline เดิม
- ค่า Draft ใช้ Browser Storage พร้อมส่งต่อค่าเมื่อคลิกลิงก์ภายในโปรเจกต์ การย้ายโฟลเดอร์ เปิดต่าง Browser หรือใช้งาน Private Mode อาจไม่พบ Draft เดิม ควรใช้ JSON เป็นไฟล์บันทึกหลัก
- การกดบันทึกจาก GUI เป็นการดาวน์โหลด ไม่เขียนทับ `data/config.json` หรือไฟล์ HTML อัตโนมัติ
- หากต้องการให้ Config ที่ดาวน์โหลดเป็นค่าเริ่มต้น ให้แทนที่ `data/config.json` ด้วยไฟล์นั้น แล้วรันสคริปต์สร้างข้อมูลอีกครั้ง
- รูปที่อัปโหลดรองรับ PNG/JPG/WebP ไม่เกิน 3 MB ต่อรูป ฝังเป็น Data URL ใน Config จึงไม่เรียกรูปจากอินเทอร์เน็ต

## สิ่งที่ลองใช้งานได้

- Portal: เปลี่ยน Logo/Banner/Background, สี, ข้อความ, ภาษา และสลับ Desktop/Mobile Preview
- Login: เปิดตัวเลือก Guest/Member/OTP/Social และทดลองข้อความ Error, Terms, Questionnaire/Quiz
- AI: อ่านเฉพาะคำสั่งตัวอย่างเรื่องสี ชั่วโมง และ OTP เพื่อเสนอค่าให้ตรวจ แล้วนำเข้า Draft; ไม่ใช่ AI จริง
- RADIUS: แสดง Policy ที่เสนอ ยังไม่มีการ Apply
- AP & Network: เลือก Vendor/รุ่น/Firmware เพิ่มและลบรายการ Walled Garden/MAC ใน Draft
- Coupons: สร้างรหัส DEMO-01 ถึง DEMO-10 ตามจำนวนที่เลือก ใช้กับเครือข่ายจริงไม่ได้
- Reports: กรอง Site/วันที่/ประเภท แสดงกราฟ ตาราง และดาวน์โหลด CSV ข้อมูลตัวอย่าง
- Logs: ค้นหาและกรองเหตุการณ์ตัวอย่าง; Alerts: แสดงข้อความแจ้งเตือนตัวอย่างโดยไม่ส่งจริง

ข้อมูลรายงานตัวอย่างครอบคลุม 15–17 กันยายน 2569 โดยข้อมูลวันที่ 17 เป็น Snapshot ถึง 21:00 น. Asia/Bangkok

## การตรวจสอบชุดไฟล์

ตรวจ JavaScript Syntax, การอ่าน JSON, ID ขององค์ประกอบ, Link และไฟล์อ้างอิงของทุกหน้า รวมถึงตรวจว่าไม่มี CDN, Remote Asset หรือคำสั่งเชื่อมต่อเครือข่ายในโค้ดที่ใช้งาน

สภาพแวดล้อมจัดทำไฟล์ครั้งนี้ไม่มี Browser ที่เปิดทดสอบได้ จึงยังไม่ได้ยืนยันการแสดงผลและการคลิกครบทุกหน้าใน Chrome/Edge จริง ควรเปิด `index.html` ตรวจบนเครื่องก่อนใช้เป็นฐานพัฒนา

รายละเอียดขอบเขตระบบเดิมอยู่ที่ `docs/NT-WiFi-Portal-GUI-Spec.md`
