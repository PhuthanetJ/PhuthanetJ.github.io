# CRUD & Storage Audit — V043

วันที่ตรวจ: 24 กันยายน 2026

V043 เน้นแก้ CRUD workflow และ Browser storage consistency ของแกนข้อมูลที่สัมพันธ์กัน โดยยังคงเป็น Offline Prototype และยังไม่เชื่อม Backend/RADIUS Manager จริง

## CRUD Matrix

| Module | Create | Read | Update | Delete | V043 result |
|---|---:|---:|---:|---:|---|
| RADIUS NAS | ✅ | ✅ | ✅ | ✅ | Full CRUD; Shared Store; Secret ไม่เข้า window.name |
| RADIUS Package | ✅ | ✅ | ✅ | ✅ | Full CRUD; Block Delete ถ้ายังมี Account |
| RADIUS Site | ✅ | ✅ | ✅ | ✅ | Full CRUD; Delete Impact + relation guards |
| RADIUS Account | ✅ | ✅ | ✅ | ✅ | Full CRUD; Edit Username/Package/Status/DISPATCH + Delete |
| Portal Path | ✅ | ✅ | ✅ | ✅ | Full CRUD; 0 Path valid; owner migration |
| Portal Banner | ✅ | ✅ | ✅ | ✅ | Full CRUD ตาม Feature ปัจจุบัน |
| Questionnaire / Quiz | ✅ | ✅ | ✅ | ✅ | Full CRUD ตาม Feature ปัจจุบัน |
| Administrator | ✅ | ✅ | ✅ | — | ใช้ Inactive แทน Delete ตาม UI ปัจจุบัน |
| Walled Garden | ✅ | ✅ | — | ✅ | Edit ยังไม่ได้กำหนด Requirement |
| Bypass MAC | ✅ | ✅ | — | ✅ | Edit ยังไม่ได้กำหนด Requirement |
| Notifications | ✅ | ✅ | ✅ | — | Delete/Reset channel ยังไม่ได้กำหนด Requirement |
| Free WiFi / Coupon | Generate | ✅ | — | — | Revoke/Update/Delete ยังไม่ได้กำหนด Requirement |
| Report Schedule | ✅ | ✅ | ✅ | — | Enable/Disable มี; Delete ยังไม่ได้กำหนด Requirement |

## Referential Integrity

- Site Delete ถูก Block ถ้ายังมี Account DISPATCH หรือ Portal Path ผูกอยู่
- Site Edit ถูก Block ถ้าพยายามเอา Package ออกขณะที่มี Account ของ Package นั้น DISPATCH มาที่ Site
- Package Delete ถูก Block ถ้ายังมี Account อ้าง Package
- Account Edit ตรวจ Package/Site relation ก่อน Commit
- Portal Path owner migrate ไป Site ที่ยังเหลือได้ และ 0 Portal Path เป็น state ที่ยอมรับได้

## Storage Consistency

- Main Source of Truth: `localStorage['wifi-tools:prototype:v3']`
- Site / Package / Account / NAS เขียนผ่าน Shared Store ใน `js/app.js`
- Legacy keys เป็น read-only migration source
- Account / NAS / Catalog page modules ไม่มี `localStorage.setItem()` แยกอีกต่อไป
- NAS Secret ไม่อยู่ใน `window.name`; NAS mutation ต้อง persist localStorage สำเร็จจึง Commit
- Stable key ไม่ผูกกับ folder path ช่วยลด Draft แตกเป็นคนละชุดเมื่อเปลี่ยน Version folderภายใต้ origin เดิม; `file://` ยังขึ้นกับพฤติกรรม Browser

## Save semantics

Portal Config ยังคง Auto Save Draft ตามพฤติกรรมเดิม แต่ UI เปลี่ยนข้อความให้ตรงพฤติกรรม: ปุ่ม `ตรวจสอบ / สร้าง Version` ทำ Validation และเพิ่ม Version reference ไม่ใช่เพิ่ง Commit Draft

## Test result

- Node automated / regression: **161 / 161 PASS**
- JavaScript syntax: ตรวจแยกใน build validation
- JSON validation: ตรวจแยกใน build validation
- Real Browser / Mobile E2E: **ยังไม่ได้ยืนยันใน environment นี้**
