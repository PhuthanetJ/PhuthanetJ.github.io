# สเปก GUI สำหรับ NT WiFi Portal Management

ฉบับออกแบบเพื่อทบทวนร่วมกับ Dev และทีม Network วันที่ 17 กันยายน 2569

เอกสารนี้รวมรายการที่ J ระบุ ภาพตัวอย่างหน้า Portal Configuration และเนื้อหาจาก MA NT Wi-Fi 2027-spec - Copy.docx เพื่อกำหนดหน้าจอและพฤติกรรมของระบบ ข้อเสนอทั้งหมดเป็นแบบออกแบบ ยังไม่ใช่หลักฐานว่าระบบปัจจุบันรองรับหรือผ่านการทดสอบแล้ว

แนวทางหลักคือใช้เว็บจัดการส่วนกลาง มี Portal Preview และแก้ Config ชุดเดียวกันได้ทั้ง Manual และ AI การรองรับอุปกรณ์ต้องรับรองตามยี่ห้อ รุ่น Firmware และวิธีเชื่อมต่อ ส่วนสิทธิ์ใช้งานจริงต้องบังคับที่ NAS หรือ Controller ตามความสามารถที่ตรวจสอบแล้ว

## 1 โครงสร้างหน้าจอ

| เมนู | หน้าจอและหน้าที่ |
| --- | --- |
| Dashboard | สรุป Session, Authentication, AP, Incident และช่วงเวลาของข้อมูล |
| Sites and Portals | องค์กร สาขา SSID Portal Path Template และรุ่นที่เผยแพร่ |
| Portal Builder | ตั้งค่าภาพ สี ข้อความ ภาษา Login Questionnaire Quiz Video และ Terms พร้อม Preview |
| RADIUS and Policy | ผู้ใช้ กลุ่มสิทธิ์ เวลา ความเร็ว โควตา จำนวนอุปกรณ์ พื้นที่ใช้งาน และ Session |
| AP and Network | Vendor Adapter, Compatibility, Walled Garden และ Bypassed MAC |
| Free WiFi and Coupon | สิทธิ์ฟรีรายชั่วโมง รหัสคูปอง QR การแจก การใช้สิทธิ์ และการเพิกถอน |
| Monitor and Logs | สถานะใกล้เวลาจริง Portal Log Auth Log Accounting และ Audit |
| Reports | Login Register Traffic Peak Time ช่องทาง Login Quiz Video และรายงานผู้บริหาร |
| Alerts | กฎแจ้งเตือน ช่องทาง ผู้รับ การรับทราบ และการแจ้งระบบกลับมาปกติ |
| Administration | ผู้ดูแล RBAC Tenant Integration Credentials Backup และประวัติ Config |

หน้า Portal Builder ใช้พื้นที่ซ้ายเป็นเครื่องมือตั้งค่าและพื้นที่ขวาเป็น Preview แยกแท็บตามงานเพื่อลดความแน่นของหน้าจอ เมนูส่วนกลางไม่ต้องแสดงฟอร์มทุกโมดูลพร้อมกัน

## 2 ฟังก์ชันที่ต้องรองรับ

| กลุ่ม | สิ่งที่ผู้ดูแลทำได้ด้วย GUI | การทำงานของ Backend หรืออุปกรณ์ |
| --- | --- | --- |
| Logo Banner Background | อัปโหลด เปลี่ยน ลบ ตั้งตำแหน่งและขนาด ดู Preview | ตรวจชนิดและขนาดไฟล์ เก็บ Asset Version และส่งไฟล์ให้ Client ก่อน Login ได้ |
| สีและรูปแบบปุ่ม | เปลี่ยนสีพื้น สีข้อความ มุมปุ่ม และข้อความปุ่ม | ตรวจความอ่านง่าย ใช้ Design Token ที่ควบคุมได้ |
| ข้อความและ Error | แก้ข้อความทุกส่วน แยกข้อความผู้ใช้กับรายละเอียดผู้ดูแล | Error Code คงที่ ผูก Request ID ปิดบังข้อมูลอ่อนไหวและ Stack Trace |
| Language | เพิ่มคำแปล เลือกภาษาเริ่มต้น ภาษาสำรอง และปุ่มสลับภาษา | ใช้ Translation Key ตรวจคำแปลที่ขาด และไม่เปลี่ยนภาษาที่ผู้ใช้เลือกเอง |
| Portal Path | สร้าง Path ผูก Site SSID และ Template คัดลอก URL | ตรวจ Path ซ้ำและ Reserved Path จำกัดสิทธิ์ตาม Tenant สร้าง Route จาก Config ไม่สร้างไฟล์ตาม Input โดยตรง |
| Template | สร้างจาก Template เดิม ทำสำเนา Preview เปรียบเทียบรุ่น และ Rollback | เก็บ Config Version และ Asset ที่แต่ละรุ่นใช้ แยก Draft จาก Published |
| SMS OTP | เปิดปิด Provider อายุ OTP เวลาส่งซ้ำ จำนวนครั้งผิด และข้อความ | ส่งผ่าน Server เก็บค่าตรวจสอบแบบปลอดภัย จำกัดการส่งและการลองรหัส ป้องกัน Replay และไม่บันทึก OTP ลง Log |
| Social Login | เปิดปิด LINE Google Facebook Apple และเลือก Login Profile | เชื่อม OAuth/OIDC ตามแต่ละ Provider ตรวจ state/nonce/PKCE ตาม Flow เก็บ Secret ฝั่ง Server และทดสอบ Captive Browser |
| Username Password | เลือกกลุ่มผู้ใช้และวิธี Authentication | ตรวจสอบผ่านระบบ AAA ที่กำหนด ไม่ให้หน้าเว็บเชื่อมฐานข้อมูลหรือรับ RADIUS Shared Secret |
| Questionnaire | สร้างคำถาม Text Single Choice Multiple Choice Rating กำหนดข้อบังคับและภาษา | เก็บคำตอบตาม Version ป้องกันการส่งข้ามเงื่อนไข และส่งออกรายงานได้ |
| Quiz | กำหนดคำตอบถูก คะแนนผ่าน และจำนวนครั้งที่ลองได้ | ตรวจคำตอบบน Server ไม่ส่งเฉลยใน Config สาธารณะ และไม่ใช้ Quiz เป็นหลักฐานยืนยันบุคคล |
| Terms Conditions | ตั้งเนื้อหา Version วันเริ่มใช้ และการยอมรับก่อนใช้งาน | เก็บ Policy Version เวลา Session และหลักฐานการยอมรับตามที่ออกแบบไว้ |
| Privacy Consent | แยก Privacy Notice และความยินยอมตามวัตถุประสงค์ออกจาก Terms | ไม่ติ๊ก Marketing Consent ล่วงหน้า ให้ผู้รับผิดชอบข้อกำหนดข้อมูลทบทวนเนื้อหาและอายุการเก็บ |
| Walled Garden | เพิ่ม Domain IP CIDR เหตุผล Scope และวันหมดอายุ | Validate ตาม Vendor Sync เฉพาะที่รองรับ แสดง Desired/Applied/Error และตรวจผลจากอุปกรณ์ |
| Bypassed MAC | เพิ่ม MAC เหตุผล Site วันหมดอายุ และเพิกถอน | ตรวจรูปแบบและรายการซ้ำ บังคับที่ NAS/Controller ไม่ถือ MAC เป็นตัวตนบุคคล และคำนึงถึง Private MAC |
| RADIUS Policy | เวลา Download Upload Data Quota Concurrent Device Service Area และช่วงเวลา | แปลง Policy เป็น Attribute หรือ Controller Profile ที่รุ่นนั้นรองรับ NAS เป็นผู้บังคับสิทธิ์ |
| Authentication Log | ค้นหา Accept Reject Timeout ตาม Site NAS User Session Request ID และเวลา | เชื่อมเหตุการณ์ Portal API Adapter และ RADIUS ปิดบัง Credential |
| Portal Server Log | ดู HTTP Status Route Latency Error และ Request ID | รับข้อมูลจาก Web/App Server จำกัดสิทธิ์ดูและ Export |
| Real time Monitor | ดู Session และ AP พร้อมเวลาอัปเดตและตัวกรอง Site | รับ Accounting/Controller Telemetry แสดง Stale/Unknown เมื่อข้อมูลขาด ไม่ตีความว่า Offline ทันที |
| การแจ้งเตือน | ตั้งเหตุการณ์ Threshold ช่วงเวลา ช่องทาง และผู้รับ | Deduplicate Cooldown Retry Recovery Alert และ Audit การส่ง |
| Free WiFi Coupon | กดรับสิทธิ์หรือแจกคูปอง/QR รายชั่วโมง กำหนดอายุและการใช้ซ้ำ | ออกสิทธิ์ชั่วคราวตรวจฝั่ง Server จำกัดเวลาและบันทึก Session การใช้คูปองต้อง Atomic |
| Manual and AI | ทุก Config ที่ AI เสนอ เปิดดูและแก้ใน GUI ได้ | ใช้ Schema Validation RBAC Versioning และ Deployment Pipeline เดียวกัน |

## 3 สิทธิ์ฟรีรายชั่วโมง

ตีความ “ไม่ต้อง Authen” ในด้านประสบการณ์ผู้ใช้เป็น ไม่ต้องกรอก Username Password หรือ OTP โดยยังมี Authorization และ Accounting เพื่อจำกัดเวลาใช้งาน

รองรับสองโหมดแยกกัน

1. กดรับสิทธิ์ทันที ผู้ใช้เปิด Portal ยอมรับเงื่อนไข และกดรับสิทธิ์ เช่น 1 ชั่วโมง ระบบสร้าง Guest Grant อายุจำกัด
2. คูปองหรือ QR พนักงานสร้างคูปอง ผู้ใช้กรอกรหัสหรือเปิดลิงก์สิทธิ์ ไม่ต้องใช้บัญชีหรือ OTP เพิ่ม การใช้ Token เป็นการตรวจสิทธิ์ของคูปอง ไม่ใช่การพิสูจน์บุคคล

ลำดับที่ออกแบบคือ Portal ตรวจเงื่อนไข → Backend สร้าง Grant → Adapter ส่งต่อการอนุญาตผ่าน NAS/RADIUS Flow หรือ Controller API ที่รองรับ → ตรวจผล Authorize → แสดงผลสำเร็จและติดตาม Accounting

ใน Flow ที่ใช้ RADIUS ให้ส่ง Session-Timeout ตามเวลาที่เหลือจริง ตัวอย่าง 1 ชั่วโมงเท่ากับ 3,600 วินาที ต้องทดสอบ NAS ตัด Session และการกลับมา Login ไม่ทำให้อายุสิทธิ์เดิมเริ่มใหม่โดยไม่ตั้งใจ อ้างอิงความหมาย Attribute จาก [RFC 2865 Section 5.27](https://www.rfc-editor.org/rfc/rfc2865.html#section-5.27)

กำหนดจำนวนอุปกรณ์ การใช้ซ้ำ พื้นที่ใช้สิทธิ์ ความเร็ว และเวลาเริ่มนับได้ เมื่อใช้คูปองเดียวกันพร้อมกันสองอุปกรณ์ต้องมีธุรกรรมป้องกันการใช้เกินสิทธิ์ คูปองจริงควรมี Token เดายาก มีวันหมดอายุ และแสดง Secret เท่าที่จำเป็น

การจำกัดต่อ MAC ช่วยควบคุมระดับอุปกรณ์ได้บางส่วน แต่ป้องกันการเปลี่ยนหรือปลอม MAC ไม่ได้ทั้งหมด หากต้องการ WiFi แบบ Open ที่ไม่มี Portal หรือ Session เลย ให้แยกเป็นอีกโหมด เพราะไม่เท่ากับระบบคูปองรายชั่วโมงนี้

## 4 การรองรับ AP หลายยี่ห้อ

เป้าหมายคือเพิ่ม Vendor Adapter ได้ ไม่กำหนดในสเปกว่า AP ทุกตัวในตลาดใช้งานได้ทันที เพียงรองรับ RADIUS ยังไม่รับประกัน External Portal URL, Authorize API, Walled Garden หรือการจัดการ MAC

แต่ละ Compatibility Record ต้องมี Vendor รุ่น Firmware Controller Version และโหมด Cloud/Controller/Standalone พร้อมผลทดสอบแยกความสามารถ

| ความสามารถ | หลักฐานรับรอง |
| --- | --- |
| Redirect | อุปกรณ์ส่ง Client/NAS Context ได้ครบ ตรวจความน่าเชื่อถือของข้อมูล และเปิด Portal ได้ |
| Authorize | ระบุ Flow ที่ใช้จริง และตรวจว่า Client ออกอินเทอร์เน็ตได้หลังได้รับสิทธิ์ |
| RADIUS | Access Request Accept Reject และ Policy ที่จำเป็นทำงานได้ |
| Accounting | Start Interim Stop เชื่อม Session ได้ และจัดการ Duplicate/Late Event |
| Expiration | หมดเวลาแล้วถูกยุติสิทธิ์จริง รวมถึงกรณีตัดการเชื่อมต่อและกลับมาใหม่ |
| Rate and Quota | Attribute หรือ Profile ที่อุปกรณ์รองรับ พร้อมผลทดสอบการบังคับใช้ |
| Walled Garden | ชนิด Domain/IP/CIDR ที่รองรับ การ Sync และผลที่อุปกรณ์รายงาน |
| MAC Bypass | เพิ่ม ลบ หมดอายุ และขอบเขตที่อุปกรณ์บังคับ |
| CoA Disconnect | ความสามารถที่รองรับจริง ผล ACK/NAK และการตรวจสถานะ Session หลังสั่ง |

ให้สถานะเป็น ผ่านทดสอบ / รองรับบางส่วน / ยังไม่ทดสอบ / ไม่รองรับ แยกแต่ละความสามารถ ไม่ใช้เครื่องหมายรองรับเหมารวมทั้ง Vendor

AP ที่ไม่มี External Portal อาจใช้ Gateway กลางเป็นจุดควบคุมได้ หากออกแบบให้ Traffic ผ่าน Gateway นั้นจริง จึงต้องตรวจ Topology VLAN และโหมด Bridge/Routing ก่อนเลือกวิธีนี้

NAS ทำหน้าที่ใช้ผลตอบกลับจาก RADIUS เพื่อให้บริการตามที่รองรับ ไม่ควรถือว่ารองรับ Attribute ทุกชนิดเหมือนกัน ตามโมเดลใน [RFC 2865](https://www.rfc-editor.org/rfc/rfc2865.html)

CoA เป็นกลไกเปลี่ยน Authorization ของ Session และ Disconnect ใช้ยุติ Session จึงไม่ควรใช้คำว่า “ส่ง CoA แล้วสร้าง Session ใหม่ได้ทุกค่าย” ให้เลือก Initial Authorization Flow ของ Adapter นั้น อ้างอิง [RFC 5176](https://www.rfc-editor.org/rfc/rfc5176.html)

## 5 Manual และ AI

ทุกโมดูลที่แก้ค่าได้ต้องมีช่องทาง Manual และสามารถให้ AI ช่วยร่างได้ผ่าน Contract เดียวกัน โดยมีหลักดังนี้

- Manual ใช้แบบฟอร์ม ตัวเลือก และตัวตรวจสอบข้อมูลครบถ้วน ระบบตั้งค่าพื้นฐานต้องทำงานได้เมื่อบริการ AI ขัดข้อง
- AI เสนอ Config ที่มีโครงสร้าง ใช้ Components และ Template ที่ระบบอนุญาต แก้ข้อความ คำแปล สื่อ Quiz Policy กฎแจ้งเตือน และรูปแบบรายงานได้ตาม Schema
- AI แสดงสิ่งที่จะเปลี่ยน เป้าหมาย Site รุ่น Config ต้นทาง และค่าก่อนหลัง ผู้ดูแลแก้ข้อเสนอต่อใน Manual ได้
- Secret เป็น Reference ไปยัง Credential Store ไม่อยู่ใน Prompt, Public Config, Browser, Log หรือไฟล์ Export ทั่วไป
- ตรวจ Schema Policy และสิทธิ์ผู้ดำเนินการก่อนสร้าง Draft จากนั้น Preview Test Publish และเก็บ Audit/Rollback
- การสร้าง AP CLI ต้องผูกกับรุ่นและเอกสารที่ตรวจสอบแล้ว การส่ง API ใช้ Connector ที่ผ่านการทดสอบ ไม่มีการรันคำสั่งที่ AI สร้างอย่างอิสระใน Production
- AI วิเคราะห์ Log ต้องแสดงหลักฐานที่พบ สมมติฐาน และสิ่งที่ต้องตรวจเพิ่ม ไม่สรุปว่า Shared Secret ผิดจาก Timeout เพียงอย่างเดียว
- AI ไม่สามารถสร้าง Credential จริง สิทธิ์เชื่อม ThaiD การอนุมัติ Provider หรือความสามารถที่อุปกรณ์ไม่มีได้

วงจรการทำงานที่เสนอคือ Draft → Validate → Preview/Test → Publish ตามสิทธิ์ → Verify → Rollback เมื่อจำเป็น การ Apply แบบหลาย Site ต้องแสดงผลราย Site และรองรับ Partial Failure

## 6 โครงสร้างระบบที่เสนอ

แยก Admin Web และ Public Portal Runtime ออกจากกัน ใช้ Config Version เดียวกันผ่าน API ที่กรองเฉพาะข้อมูลสาธารณะ

| ส่วน | หน้าที่ |
| --- | --- |
| Admin GUI | จัดการ Config Preview Permission และรายงาน |
| Management API | ตรวจ RBAC/Tenant Validate บันทึก Version และควบคุม Publish |
| Public Portal Runtime | แสดง Template รับข้อมูล Login และแสดงผล Session |
| Authentication and Grant Service | OTP Social Guest Coupon การตรวจเงื่อนไข และออก Grant |
| Policy Service | กำหนดสิทธิ์กลาง ตรวจ Service Area และทำ Mapping |
| Vendor Adapters | Normalize Redirect Context, Authorize, ตรวจ Session และ Sync Config ตามความสามารถ |
| RADIUS | AAA และรับ/ส่ง Attribute ตาม Flow ที่กำหนด |
| Config and Identity Store | เก็บ Version User Grant Coupon Question Consent และ Integration Reference |
| Asset Store | เก็บภาพ วิดีโอ และ Version ของสื่อ |
| Logging and Monitoring | รับ Log/Accounting/Telemetry แสดงเวลาอัปเดต และเชื่อมเหตุการณ์ |
| Jobs and Notifications | งาน Sync Export แจ้งเตือน Retry และ Backup |
| AI Service | สร้างข้อเสนอและวิเคราะห์จากข้อมูลที่ได้รับสิทธิ์ โดยเรียก API ตาม Contract |

โครงสร้างนี้เป็นการแยกความรับผิดชอบเชิงตรรกะ ยังไม่กำหนดว่าต้องแยกทุกส่วนเป็น Microservice การเลือกจำนวนบริการและฐานข้อมูลต้องตรวจระบบเดิมและโหลดจริง ไม่ควรสรุปจากเอกสารว่าจะต้องย้ายฐานข้อมูลหรือเปลี่ยน FreeRADIUS ทันที

Schema หลักควรแยก metadata, design, translations, authentication, engagement, terms, policyRef, vendorBinding, networkRules และ integrationRefs มี schemaVersion/configVersion ใช้ป้องกันการแก้ทับรุ่นที่ใหม่กว่า

ความลับของ Quiz, Provider และ RADIUS ต้องไม่รวมอยู่ใน Public Portal Config

## 7 Monitor Log และการแจ้งเตือน

Real time ต้องระบุที่มาและความสดของข้อมูล เช่น Accounting อัปเดตตาม Interim Interval ส่วนสถานะ RF และ AP ใช้ Controller Telemetry ค่า CPU, RSSI, Noise, ช่องสัญญาณ หรือประเภท Application ไม่สามารถอนุมานจาก RADIUS Accounting ได้ครบ

MAC Active/Inactive ควรแยกอย่างน้อย Active, Stale, Closed, Unknown พร้อม Last Seen การไม่มี Stop ไม่ยืนยันว่า Session ยังใช้งานจริง และการ Clear Session Record ไม่เท่ากับ Disconnect อุปกรณ์

Log ควรมีเวลาและ Timezone, Tenant/Site, Request ID, Session ID, NAS, ผลลัพธ์และ Error Code โดยจำกัดการเข้าถึงข้อมูลผู้ใช้แยกตามบทบาท กำหนดอายุเก็บ การสำรอง ความถูกต้องของเวลา และการตรวจการเข้าถึง การมี Accounting อย่างเดียวไม่ใช่หลักฐานว่าครบข้อกำหนดกฎหมายทุกข้อ

กฎแจ้งเตือนเริ่มจาก Portal 5xx, RADIUS Timeout, Reject สูง, AP Offline จาก Controller, Storage และ Backup แต่ต้องปรับ Threshold ตามข้อมูลจริง ช่องทางเสนอเป็น In-app, Telegram, Email, Webhook หรือ LINE Messaging API

เอกสารต้นทางมี LINE Notify ซึ่งยุติบริการวันที่ 31 มีนาคม 2025 จึงต้องเปลี่ยนตัวเลือกนี้ อ้างอิง [ประกาศ LINE Notify](https://developers.line.biz/en/news/2024/10/07/line-notify-will-be-discontinued/) และ [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/overview/)

## 8 ฟังก์ชันเพิ่มเติมจากเอกสาร

| ฟังก์ชัน | ขอบเขตที่นำมารวม | เงื่อนไขก่อนใช้จริง |
| --- | --- | --- |
| ThaiD | Login Connector และผลการยืนยัน | ตรวจช่องทางเชื่อมต่อ สิทธิ์ ข้อมูลที่ได้ และข้อตกลงของบริการจริง ไม่ถือว่า ThaiD กับ NDID คือ Integration เดียวกัน |
| Email และ AD/LDAP | ช่องทาง Login เพิ่มเติม | ระบุแหล่งข้อมูลและ Flow ที่รองรับ |
| Video Ads | สื่อ เงื่อนไขระยะเวลา และ Completion Report | ทดสอบ Autoplay/Captive Browser และตรวจ Grant ฝั่ง Server การดูจริงไม่ควรสรุปจาก Timer หน้าเว็บอย่างเดียว |
| รายงาน | Usage Peak Time Login/Register Auth Method Traffic Quiz Video Top Clients | นิยามตัวชี้วัดและข้อมูลต้นทางก่อนคำนวณ |
| AI Dashboard | สร้างมุมมองและสรุปจากข้อมูลที่ผู้ใช้มีสิทธิ์ | คำนวณตัวเลขด้วย Query/Metric ที่ตรวจสอบได้ AI ใช้ช่วยอธิบาย |
| Scheduled Report | ตั้งรอบ PDF XLSX CSV PPTX และผู้รับ | Timezone RBAC ขอบเขตข้อมูลและประวัติการส่ง |
| Multi tenant และ Reseller | แยกองค์กร Site Template และข้อมูล | ตรวจ Isolation ทุก API, Query, Export และ AI Retrieval |
| Helpdesk Front Desk | แจกคูปอง ค้นหาเคส และช่วยผู้ใช้ | จำกัดสิทธิ์การดูข้อมูลและการเปลี่ยน Session |
| AP Auto Config | Generate CLI หรือ Push API | Adapter รุ่นที่รับรอง Credential และแผนตรวจผล/ย้อนกลับ |
| AI RCA | สรุปสาเหตุที่เป็นไปได้และแนวทางตรวจ | ต้องมีหลักฐานจากแหล่งที่วัดสิ่งนั้นได้ ไม่ฟันธงจากอาการเดียว |
| Heatmap Footfall | แสดงพื้นที่และรูปแบบการใช้งาน | ต้องมีตำแหน่งและ Telemetry จำนวนอุปกรณ์ไม่เท่ากับจำนวนบุคคล |
| Traffic Filtering QoS | เลือก Policy ของอุปกรณ์บังคับใช้ | ต้องมี Gateway/Firewall ที่รองรับ ไม่ใช่หน้าที่ RADIUS เพียงตัวเดียว |
| Payment Billing | แพ็กเกจ QR/บัตร และจัดการ Transaction | Provider จริง Webhook Verification Idempotency Reconciliation และแยก Paid ออกจาก Provisioned |
| Backup Restore | สำรอง Config DB Asset Credential Reference และ Log ตามนโยบาย | ทดสอบ Restore กำหนด RPO RTO และสิทธิ์เข้าถึง |
| HA Multi region | ความต่อเนื่องของ Portal AAA และข้อมูล | ประเมิน Session Store DB Consistency Failover และโหลดจริงก่อนรับรอง Zero Downtime |

Social Login ต้องทดสอบบน Captive Browser และมีทางเลือกเปิด Browser ปกติหรือใช้วิธี Login อื่น Google กำหนดข้อจำกัดต่อ Embedded User Agent และกำหนด Secure Redirect URI จึงไม่ควรถือว่าติดปุ่มแล้วใช้ได้ทุกอุปกรณ์ อ้างอิง [Google OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)

## 9 เกณฑ์รับงานหลัก

1. เปลี่ยน Logo Banner Background สีและข้อความแล้ว Preview ตรงกับรุ่นที่นำไปแสดงจริง
2. TH/EN สลับได้ทั้ง Login Error Terms และ Questionnaire พร้อมตรวจคำแปลที่ขาด
3. Path ซ้ำ Path สงวน และข้อมูลไม่ถูกต้องถูกปฏิเสธก่อนเผยแพร่
4. Manual และ AI แก้ Config ชุดเดียวกัน เกิด Diff ตรวจสอบได้ และ Rollback ไป Version เดิมได้
5. OTP หมดอายุ ส่งซ้ำ ลองผิด และ Provider ล่มมีพฤติกรรมที่กำหนดไว้
6. Social Callback ผิด ยกเลิก Login และ Captive Browser ที่ไม่รองรับมีทางออก
7. Guest/Coupon ไม่ต้องกรอกบัญชีหรือ OTP แต่ระบบอนุญาตสิทธิ์และหมดอายุตาม Policy จริง
8. คูปองใช้ซ้ำพร้อมกันไม่ทำให้ได้สิทธิ์เกินจำนวนที่กำหนด และ Retry ไม่สร้างสิทธิ์ซ้ำ
9. การไม่ยอมรับ Terms หรือส่ง Quiz ข้ามหน้าเว็บไม่ทำให้ได้สิทธิ์
10. Walled Garden และ MAC Bypass แสดงสถานะ Sync จริง ความล้มเหลวไม่ถูกแสดงว่า Apply สำเร็จ
11. การรับรอง Vendor มีหลักฐานตามรุ่นและ Firmware โดยแยกทุกความสามารถที่สัญญาว่ารองรับ
12. Auth Success ไม่ถูกแสดงเป็น Internet Available หากยังไม่ได้ตรวจ Authorization/Session ตาม Flow
13. Monitor แสดง Last Updated และ Stale เมื่อข้อมูลขาด แยก Active Session ออกจาก Device/Person Count
14. RBAC/Tenant Isolation ครอบคลุม UI API Export Log และ AI ไม่มี Secret ใน Public Config
15. Log เชื่อม Portal ถึง NAS/RADIUS ได้ด้วย Identifier ที่ออกแบบไว้ และไม่เก็บ Password/OTP/Token ลับ
16. Publish/Sync ล้มเหลวบาง Site แสดงผลราย Site พร้อมวิธี Retry และ Rollback
17. Alerts ไม่ยิงซ้ำอย่างไร้ขีดจำกัด มี Recovery และบันทึกผลส่ง
18. Backup สามารถ Restore ได้จริงตามชุดข้อมูลที่กำหนดก่อนรับรองพร้อม Production

## 10 ลำดับพัฒนาที่เสนอ

เริ่มจากตรวจ Config/API/DB/Template เดิมและเลือกอุปกรณ์นำร่องที่ระบุรุ่นชัดเจน จากนั้นทำ Portal Builder, Versioning, Path, ข้อความและภาษาให้ครบ แล้วต่อ AAA/Guest/Coupon/Log กับอุปกรณ์นำร่อง ก่อนขยาย Vendor Adapter และเพิ่ม OTP/Social/Quiz/Notification

AI ให้เริ่มจากการสร้าง Draft และสรุปข้อมูลด้วย Contract เดียวกับ Manual แล้วจึงเพิ่ม AP Config, Policy และงานหลาย Site เมื่อมี Validator และการตรวจผลรองรับ ส่วน ThaiD, Payment, RF Analytics และ Multi-region ให้ใช้ข้อมูล Integration/Infrastructure จริงกำหนดขอบเขตก่อนลงมือ ไม่กำหนดวันส่งหรือเปอร์เซ็นต์สำเร็จจากสเปกเพียงอย่างเดียว

## 11 ขอบเขตต้นแบบที่แนบกับการออกแบบนี้

ต้นแบบแสดง Portal Builder ที่แก้สี รูป ข้อความ TH/EN, Login Toggles, Quiz/Terms และ Preview ได้ รวมถึงฟอร์ม Policy, AP, Walled Garden, MAC, Coupon, Log Filter และ Alert Preview

AI ในต้นแบบเป็นการจำลองข้อเสนอจากสี ชั่วโมง และการเปิด OTP เพื่อแสดงการตรวจ Diff และส่งต่อให้ Manual ไม่ได้เรียก AI Provider จริง ข้อมูลบันทึกอยู่ในหน่วยความจำของต้นแบบและหายเมื่อโหลดใหม่ รูปแบบและรายการตรวจสอบในต้นแบบเป็นตัวอย่าง GUI ไม่ใช่ Validator สำหรับ Production

ยังไม่มี Backend, ฐานข้อมูล, ระบบสิทธิ์ผู้ดูแล, SMS, Social Callback, ThaiD, RADIUS Packet, Vendor API, Network Session หรือการ Deploy จริง Template01–05 เป็นตัวเลือกโครงสร้าง ยังไม่ได้ Import ไฟล์ Template ปัจจุบัน และคูปอง DEMO ใช้กับเครือข่ายจริงไม่ได้

ข้อมูลที่ต้องยืนยันก่อนเชื่อม Production คือรายการรุ่น/Firmware/Controller, Config และ API เดิม, การ Mapping Site/NAS/Policy, วิธีใช้คูปอง, Provider Credentials และกติกาการเก็บข้อมูล ข้อมูลเหล่านี้ไม่ขัดขวางการรีวิว GUI และขอบเขตงานในขั้นนี้
