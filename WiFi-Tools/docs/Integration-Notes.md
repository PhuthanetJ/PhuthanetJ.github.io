# จุดเชื่อมระบบจริง

ไฟล์ชุดนี้เป็น Frontend Offline Prototype ไม่มี Backend หรือ Worker

| ส่วน | สิ่งที่ต้องมีเพื่อเชื่อมจริง |
|---|---|
| Login/User | Backend Authentication, Session และตรวจ Role/Site ทุกการอ่าน แก้ไข Export และ Job |
| RADIUS Package | เวอร์ชัน RADIUS Manager, API หรือ View ที่ได้รับอนุญาต, Mapping ฟิลด์ หน่วยและ Site; อ่านอย่างเดียว |
| AP Inventory | API/Telemetry จาก Controller และ Adapter ตาม Vendor/รุ่น/Firmware |
| Notifications | Provider Credentials ที่เก็บฝั่ง Server และ Worker ส่ง/ติดตามผล |
| รายงาน | Query ข้อมูลจริงและนิยามเหตุการณ์ที่นับตรงกับต้นทาง |
| PDF | Browser Save as PDF ใช้ในต้นแบบ; งานส่งอัตโนมัติต้องมี Server-side renderer รองรับภาษาไทย |
| รายเดือน | Scheduler ที่ทำงานแม้ปิด Browser, SMTP, PDF/CSV renderer และประวัติการส่ง |

`data/radius-packages.json` เป็นตัวอย่างสัญญาข้อมูลของ Frontend ไม่ใช่ชื่อ Column/API ที่ยืนยันแล้วของ RADIUS Manager

รายเดือนเก็บ ownerId, Site IDs, ประเภทรายงาน, ผู้รับ, วัน/เวลา Asia/Bangkok, ไฟล์ PDF/CSV และหน้าปก สถานะ `backend_not_connected` หมายถึงยังไม่สร้างงานหรือส่ง Email จริง Backend ต้องตรวจสิทธิ์เจ้าของ Job ใหม่ขณะทำงานและป้องกันการส่งซ้ำของรอบเดียวกัน

Token/Password ต้องเก็บที่ Backend เมื่อต่อระบบจริง และไม่คืนค่า Secret ผ่าน API อ่าน Config หรือไฟล์ Export
