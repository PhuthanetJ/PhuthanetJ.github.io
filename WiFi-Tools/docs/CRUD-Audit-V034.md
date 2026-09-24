# CRUD Audit — Wi-Fi Tools V034

วันที่ตรวจ: 23 กันยายน 2569 / 2026-09-23

## สรุป

ตรวจจาก Source Code V033 แล้วพบ Bug จริงในเส้นทาง **RADIUS & Policy > Site > Delete**: เมื่อ Site ที่ถูกลบยังเป็น owner หรืออยู่ใน `bindings.siteIds` ของ Portal Config, Draft Portal เดิมยังอ้าง Site ID ที่หายไป ทำให้ `WiFiPortalBindings.normalize()` throw ระหว่างโหลด `app.js`. ผลที่เห็นใน UI คือหน้า Portal Configuration/ข้อมูลที่พึ่งพา app initialization ดูเหมือนหายหรือโหลดไม่ครบ.

V034 แก้ด้วย Referential Integrity Reconciliation และเพิ่ม Regression Test ครอบคลุมกรณีนี้โดยตรง.

## CRUD / Mutable Feature Matrix

| Module | Create | Read | Update | Delete | V034 Audit |
|---|---:|---:|---:|---:|---|
| RADIUS NAS | Yes | Yes | Yes | Yes | PASS |
| RADIUS Package | Yes | Yes | Yes | Yes* | PASS; *Delete เฉพาะ Package ที่ไม่มี Account อ้างอยู่ |
| RADIUS Site | Yes | Yes | Yes | Yes* | PASS; *ห้ามลบ Site สุดท้าย/ห้ามลบถ้ามี Account DISPATCH |
| RADIUS Account | CREATE/GENERATE/IMPORT | Yes | Status/DISPATCH | No | PASS ตาม Requirement ปัจจุบัน; ยังไม่ใช่ Full CRUD |
| Portal Path | Yes | Yes | Yes | Yes | PASS |
| Portal Config/Banner/Questionnaire | Yes | Yes | Yes | Yes ตามแต่ละรายการ | Existing tests PASS |
| Administrator | Yes | Yes | Yes | No | Validation tests PASS; Delete ยังไม่มีใน Requirement/UI |
| Walled Garden / Bypass MAC | Add | Yes | No | Yes | Existing Draft flow; ไม่ใช่ Full CRUD |
| Notifications | Save | Yes | Update | No | Partial CRUD by design |
| Free WiFi Coupon | Create | Yes | No | No | Partial CRUD by design |
| Report Schedule | Create | Yes | Update/Enable/Disable | No | Partial CRUD by design |

## Referential Integrity Rules เพิ่มใน V034

1. **Delete Site**
   - ต้องเหลือ Site อย่างน้อย 1 รายการ
   - ถ้ามี Account ที่ `DISPATCH` มายัง Site นี้ จะไม่อนุญาตให้ลบจนกว่าจะ Undispatch
   - Portal Path ที่มี Site อื่นเหลืออยู่จะคงไว้และย้าย owner หากจำเป็น
   - Portal Path ที่ไม่เหลือ Site จะถูกลบจาก Draft
   - `currentSite`, `portalSelections`, Notification channel, Coupon, Report Schedule และ User site scope ถูก reconcile กับ Site ที่ยังมีอยู่

2. **Delete Package**
   - ถ้ายังมี Account อ้าง `packageId` จะไม่อนุญาตให้ลบ เพื่อป้องกัน Account orphan
   - ถ้าไม่มี Account อ้างอยู่ การลบจะนำ Package ออกจาก `Allow Package` ของ Site ตามเดิม

3. **Startup Recovery**
   - V034 sanitize Portal Config ที่อ้าง Site ที่ไม่มีอยู่ก่อนเรียก `WiFiPortalBindings.normalize()`
   - ช่วยกู้ Browser Draft ที่เคยเสียจาก V031–V033 โดยไม่ให้หน้า Portal crash เพราะ stale Site binding

## Tests

- Node automated/integration tests: **124 / 124 PASS**
- JavaScript syntax check: PASS
- JSON parse check: PASS
- Regression ใหม่ครอบคลุม:
  - ลบ Current Site แล้ว reload Portal Configuration
  - ลบ Owner Site ของ Shared Portal Path แล้ว Portal Path ยังอยู่
  - Site-scoped Draft cleanup
  - ป้องกันลบ Site สุดท้าย
  - CRUD smoke: NAS / Package / Site / Account / Portal Path
  - Guard สำหรับ Site DISPATCH และ Package ที่ยังมี Account

## Browser Test Limitation

มีการพยายามรัน Headless Chromium กับ HTTP server ภายใน environment นี้ แต่ Chromium ถูก policy ของ environment block localhost ด้วย `ERR_BLOCKED_BY_ADMINISTRATOR`. ดังนั้นผล V034 ยืนยันจาก automated model/integration harness และ static syntax/data validation; ยังควรทดสอบ UI interaction บน Chrome/Edge จริงอีกครั้งก่อนถือว่า Browser QA complete.
