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


## RADIUS Manager Site / Allow Package (Config schema 5)

`data/radius-sites.json` เป็น Snapshot กลางของ Site และ Allow Package โดยแต่ละ Site มี `id`, `name`, `vlanId`, `location`, `concurrent`, `description`, `allowPackages[]` แต่ละรายการ Allow Package มี `packageId`, `prefix`, `limit` และอ้างอิง `id` ใน `data/radius-packages.json`

ชื่อฟิลด์ JSON ข้างต้นเป็นสัญญาข้อมูลภายในต้นแบบ ไม่ใช่การยืนยันชื่อ API/ตารางของ RADIUS Manager รุ่นจริง ภาพอ้างอิงยืนยันรายการ Site: Name, VLAN ID, Location, Concurrent, Description และ Allow Package: Name, Prefix, Limit แต่ไม่ได้ยืนยัน Site ID ของรายการ Allow Package ในภาพ จึงใช้ข้อมูล Demo เดิมเพื่อไม่เดาความสัมพันธ์จากภาพ

Portal เลือกได้เฉพาะ Site รายชื่อ Package ต้องคำนวณจาก Allow Package ของ Site นั้นโดยตรง ไม่อ่านจากค่าที่เคยเลือกเอง ไม่ใช้ผลรวมของหลาย Site เป็นการอนุญาตทุก Package ให้ทุก Site และไม่อนุมานจาก service-area field เดิมของ Package

การนำเข้า Config รุ่น 1–4 จะย้ายการผูก Site เดิมมาใช้และคำนวณ Package ใหม่จาก Snapshot ปัจจุบัน ส่วน `bindings.packageIds` ในไฟล์ schema 5 เป็นค่าที่คำนวณได้เท่านั้น เมื่อโหลดกลับต้องคำนวณใหม่จากต้นทาง

ก่อนเชื่อมระบบจริง ต้องยืนยัน RADIUS Manager รุ่น/API, Site ID, Package ID และความสัมพันธ์ Allow Package รวมถึงความหมายของ Prefix/Limit ค่า Limit ว่างในต้นแบบแสดงเป็น — โดยไม่อนุมานว่าไม่จำกัด Backend ต้องตรวจ Role/Site scope และข้อมูล Allow Package/Status ปัจจุบันก่อน Publish หรือ Authentication จริง การเชื่อมต่อ RADIUS Manager ยังไม่ได้ทำในต้นแบบออฟไลน์นี้
