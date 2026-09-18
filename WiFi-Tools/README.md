# Wi-Fi Tools — Offline Prototype v2

## เริ่มใช้งาน

แตก ZIP ทั้งหมด แล้วเปิด `index.html` ด้วย Chrome หรือ Edge ไม่ต้องติดตั้ง Node.js หรือ Web Server

เข้าสู่ระบบด้วย `admin` / `Demo1234!` รหัสนี้เป็นรหัสทดสอบของทุกบัญชี รวมถึงบัญชีที่สร้างเพิ่มในต้นแบบ

| Username | Role | Site | Gen Report | Export |
|---|---|---|---|---|
| admin | System Admin | ทุก Site | ได้ | ได้ |
| siteadmin | Site Admin | A | ได้ | ได้ |
| viewer | Site Viewer | B | ไม่ได้ | ไม่ได้ |
| reporter | Site Viewer | A และ C | ได้ | ได้ |

Login และสิทธิ์เป็นการจำลองบน Browser ไม่ใช่ระบบป้องกันข้อมูลสำหรับ Production ผู้ที่มีไฟล์อ่านข้อมูล JSON ตัวอย่างได้ การใช้งานจริงต้องตรวจ Session, Role และ Site ที่ Backend

## สิ่งที่เพิ่มและแก้ไข

- เปลี่ยนชื่อเป็น Wi-Fi Tools
- ย้ายโหลด Config, ดาวน์โหลด JSON, โหลดค่าตั้งต้น และวิธีใช้งานไปเมนู **ตั้งค่าและไฟล์ Config** ไม่มีแถบ Offline แบบเดิมบนทุกหน้า
- Login/Logout และเมนู User: เพิ่ม/แก้ผู้ใช้ Role, Site, Status และสิทธิ์ Export/Gen Report
- System Admin จัดการทั้งหมด; Site Admin จัดการเฉพาะ Site ที่มอบหมาย; Site Viewer ดูเฉพาะ Site ที่มอบหมาย
- Site Admin ไม่สามารถแต่งตั้ง System Admin หรือขยายสิทธิ์ไป Site อื่น และไม่สามารถเพิ่มสิทธิ์ Export/Gen Report ที่ตนเองไม่ได้รับ
- Config, คูปอง และค่าช่องทางแจ้งเตือนแยกตาม Site
- Dashboard กด Site เพื่อดู AP → ยี่ห้อ → รุ่น พร้อม IP, MAC, Firmware, Status, Clients และ Last seen
- Free WiFi & Coupon มี Site Name ให้เลือก และคูปองตัวอย่างผูกกับ Site
- RADIUS & Policy มี dropdown ชื่อ Package และแสดงข้อมูลอ่านอย่างเดียว พร้อม Site ที่ใช้ Package ภายในขอบเขตสิทธิ์
- การแจ้งเตือนมีค่าตั้งแยก In-app, Telegram, LINE Messaging API, Email/SMTP และ Webhook พร้อมช่อง ID/Token ที่เกี่ยวข้อง
- Report กรองช่วงวันที่ แล้วสรุปรวมรายวันหรือรายวันแยก Site พร้อมกราฟและตาราง
- Export CSV ดาวน์โหลดโดยตรง; PDF เปิดหน้า Report Preview แล้วกด **พิมพ์ / บันทึก PDF** เลือก **Save as PDF** ใน Browser
- หน้าปก PDF มีมาตรฐาน ผู้บริหาร และรูปภาพ ปรับชื่อรายงาน หัวข้อรอง หน่วยงาน สี Logo และรูปหน้าปกได้
- ตั้งรายงานรายเดือน: Site, วัน 1–28, เวลา Asia/Bangkok, Email ผู้รับหลายคน, PDF/CSV และหน้าปก แก้ไขหรือเปิด/ปิดรายการได้
- รายเดือนใช้ข้อมูลเดือนปฏิทินก่อนหน้าและแสดงกำหนดส่งครั้งถัดไปตามค่าตั้ง

## Site และ Allow Package จาก RADIUS Manager

- **RADIUS & Policy → Site** แสดง Name, VLAN ID, Location, Concurrent และ Description แบบอ่านอย่างเดียวตามโครงสร้างในภาพอ้างอิง
- กด **ดู Allow Package** ของ Site เพื่อแสดง Name, Prefix และ Limit กดชื่อ Package เพื่อดูรายละเอียดในแท็บ Package
- **Portal Configuration → ทั่วไป & Path** เลือก Site ได้หลายรายการ แล้วแสดงเฉพาะชื่อ Policy / Package จาก Allow Package ของแต่ละ Site อัตโนมัติ ไม่มีช่องเลือก Package เอง
- ชื่อ Package ในหน้า Portal ไม่แสดง Prefix, Limit หรือค่ารายละเอียด Package ส่วนข้อมูลเหล่านี้ยังดูได้ใน RADIUS & Policy
- แหล่งข้อมูล Site และความสัมพันธ์ Allow Package คือ `data/radius-sites.json` ส่วนชื่อและรายละเอียด Package คือ `data/radius-packages.json`
- `data/sites.json` เป็นรายการ ID/Name สำหรับรองรับโค้ดเดิม สคริปต์ build จะสร้างจาก `radius-sites.json` ทุกครั้ง ไม่ใช้เป็นแหล่งข้อมูล Site อีกชุด
- Config schemaVersion 5 เก็บ `bindings.siteIds` และระบุ `packageSource: radius-manager-allow-package`; `packageIds` เป็นค่าที่คำนวณจาก Allow Package
- โหลด Draft / Config รุ่นเดิมได้ รายการ Package ที่เคยเลือกเองจะถูกแทนด้วย Allow Package ปัจจุบันของ Site การแก้ Package IDs ในไฟล์นำเข้าไม่สามารถเปลี่ยนความสัมพันธ์นี้ได้
- Site ที่ไม่มี Allow Package จะแสดงว่าไม่มีรายการ ส่วน Site ที่ยังไม่มีข้อมูลจะแสดงว่ายังไม่มีข้อมูล ไม่ดึง Package จากรายชื่อรวมมาทดแทน
- รายชื่อ Package ที่อ่านได้เป็นข้อมูลการกำหนด Allow Package ไม่ใช่การยืนยันว่า Package Active หรือใช้งานอินเทอร์เน็ตได้ การตรวจสิทธิ์จริงยังเป็นหน้าที่ของ RADIUS Manager / Backend
- **ตั้งค่าและไฟล์ Config** เปิด Portal ชุดเดียวกันผ่านทุก Site ที่ผูกไว้ได้ การแก้ไข / Export Config ร่วมต้องมีสิทธิ์ครบทุก Site
- Site เจ้าของ Config ต้องอยู่ในรายการเสมอ หากต้องการนำ Site ที่กำลังเปิดออก ให้เปิด Config จาก Site เจ้าของก่อน

ข้อมูล Site / Allow Package / Package ที่แถมมาเป็น Snapshot ตัวอย่าง โครงสร้างอ้างอิงภาพที่ผู้ใช้ส่งมา ยังไม่ได้เชื่อม API ของ RADIUS Manager และไม่ได้สมมติว่า Site ในภาพใดเป็นเจ้าของรายการ Package ในอีกภาพ

## Banner หลายรายการ

- ไปที่ **Portal Configuration → ดีไซน์ → Banner** กด **เพิ่มรูปภาพ / วิดีโอ** เลือกได้หลายไฟล์
- รองรับรูป PNG / JPG / WebP (ไม่เกิน 3 MB ต่อไฟล์) และวิดีโอ MP4 / WebM (ไม่เกิน 15 MB ต่อไฟล์) รวมไม่เกิน 30 MB และ 20 รายการต่อ Site
- แต่ละรายการมีชื่อ, ลิงก์ปลายทาง HTTP/HTTPS, เปิด–ปิด, เปลี่ยนไฟล์, ลบ และเลื่อนลำดับ
- Preview แสดงเฉพาะรายการที่เปิด มีปุ่มก่อนหน้า/ถัดไป รูปภาพกดเปิดลิงก์ได้ ส่วนวิดีโอมีปุ่มเล่นและควบคุมเสียง พร้อมลิงก์แยกที่ไม่ทับปุ่มควบคุม
- สื่อทุกไฟล์ฝังใน Config JSON จึงเปิดได้ออฟไลน์ ส่วนลิงก์ปลายทางต้องใช้การเชื่อมต่อตามเว็บไซต์นั้น วิดีโอต้องใช้ Codec ที่ Browser รองรับ
- Banner วิดีโอไม่บังคับให้ดูจบก่อนรับสิทธิ์ ตัวเลือก Video Ads ก่อนรับสิทธิ์ยังเป็นต้นแบบเดิม
- Config รุ่นใหม่ใช้ schemaVersion 5; Config / Draft รุ่นเดิมที่มี Banner เดียวจะย้ายมาเป็นรายการแรกให้โดยอัตโนมัติ
- ไฟล์สื่อขนาดใหญ่อาจเกินพื้นที่เก็บของ Browser ระบบจะแจ้งเมื่อบันทึก Draft ถาวรไม่ได้ ให้ดาวน์โหลด Config JSON ก่อนปิดแท็บ แล้วโหลดกลับผ่านเมนูตั้งค่า (ไฟล์ Config ไม่เกิน 60 MB)

## เงื่อนไข Free WiFi และการเลือก Config

- ไปที่ **Portal Configuration → Quiz & เงื่อนไข** เพื่อแก้ข้อความลิงก์ยอมรับและเนื้อหาเงื่อนไขเต็ม แยกภาษาไทย/อังกฤษ
- ใน Preview กดข้อความยอมรับหรือช่องติ๊กเพื่อเปิดหน้าต่างอ่านเงื่อนไข จากนั้นกด **ยอมรับเงื่อนไข** จึงรับสิทธิ์ได้ การปิดหน้าต่างหรือกด Escape ยังไม่ถือว่ายอมรับ
- เนื้อหาแสดงเป็นข้อความธรรมดา รองรับหลายบรรทัด การเปลี่ยนข้อความหรือรุ่นเงื่อนไขทำให้ต้องยอมรับใหม่ใน Preview
- เมนู **ตั้งค่าและไฟล์ Config** เลือก Site และ Portal Path แล้วกด **เลือก Config นี้** ก่อนโหลด/ดาวน์โหลด ค่าที่แสดงดึงจาก Portal Configuration ของ Site นั้น และจำกัดตามสิทธิ์ผู้ใช้
- แต่ละ Site มี Config ตั้งต้นของตน และเลือก Portal ที่ผูกมาจาก Site อื่นได้ด้วย ชื่อและ Portal Path ของ Config ร่วมจะอ้างอิงชุดเดียวกัน เมื่อแก้ Path ตัวเลือกและชื่อไฟล์ดาวน์โหลดจะเปลี่ยนตาม
- โหลดค่าตั้งต้นจะคง Portal Path และ Site ที่ผูกไว้ และ JSON รวมเนื้อหาเงื่อนไขทั้งสองภาษา
- Draft และ JSON รุ่นเดิมที่ยังไม่มีเนื้อหาเงื่อนไขเต็มยังโหลดได้ โดยเติมเนื้อหาตัวอย่างให้แก้ไขต่อ

## Package ที่แสดง

ชื่อ Policy, User Prefix, Username format, Package Expired, Package Type, Upload, Download, Session Time, Session Limit, Idle Timeout, Time, Daily time, Weekly time, Monthly time, Expiration, Price, Description, Status และ Site ที่ใช้ Policy

Time/Daily/Weekly/Monthly เป็น hours:minutes โดยค่าศูนย์แสดงว่าไม่จำกัด ค่าอื่นเป็นตัวอย่าง ต้องตรวจ Mapping และหน่วยกับ RADIUS Manager รุ่นจริงก่อนเชื่อมต่อ

## ส่วนที่ยังเป็นต้นแบบ

- RADIUS Manager ยังไม่เชื่อม ใช้ `data/radius-packages.json` เป็น Snapshot ตัวอย่าง และไม่มีการแก้ Package จาก Tools
- AP, Dashboard, Logs และ Report เป็นข้อมูลตัวอย่าง รายงานมีข้อมูล 15–17 กันยายน 2569
- การแจ้งเตือนและรายงานรายเดือนบันทึกเฉพาะค่าตั้ง ยังไม่มี Scheduler/SMTP และยังไม่ส่งข้อความหรือ Email จริง
- Token/Password ในหน้าแจ้งเตือนอยู่ชั่วคราว ไม่บันทึกถาวรหรือรวมใน Config JSON ต้องกรอกใหม่เมื่อเปิดหน้าอีกครั้ง
- การบันทึก Draft เก็บใน Browser ไม่เขียนทับไฟล์ต้นฉบับ การย้ายโฟลเดอร์หรือเปลี่ยน Browser อาจไม่พบค่าเดิม
- JSON ในเมนูตั้งค่าเก็บเฉพาะ Portal, รูปภาพและค่าของ Site ปัจจุบัน ไม่รวมผู้ใช้ ช่องทางแจ้งเตือน หรือรายการรายเดือน ซึ่งเก็บใน Browser สำหรับต้นแบบ
- AI, OTP, Social Login และการรับสิทธิ์ Portal ยังคงเป็นการจำลอง ไม่มีการปล่อยอินเทอร์เน็ตจริง

## โครงสร้าง

- `html/`: HTML แยกทุกหน้า รวม Login, User, ตั้งค่า, AP และหน้า Print
- `css/`: CSS กลางและแยกตามหน้า
- `js/app.js`: Session, Config ตาม Site, การบันทึกและ Import/Export
- `js/domain.js`: กฎสิทธิ์ การรวมรายงาน และวันส่งรายเดือน
- `js/portal-bindings.js`: การผูก Site, อ่าน Allow Package และการเลือก Config ร่วม
- `js/pages/portal-general.js`: ตัวเลือก Site และชื่อ Package อัตโนมัติในทั่วไป & Path
- `js/banner-model.js`: รูปแบบข้อมูล สื่อ ลิงก์ และข้อจำกัด Banner
- `js/pages/portal-banners.js`: ตัวจัดการ Banner และ Preview
- `js/pages/`: JavaScript เฉพาะแต่ละหน้า
- `data/`: JSON แยก Config, Sites, Users, Roles, Package, AP, Report, Logs และค่าช่องทาง
- `js/offline-data.js`: สร้างจาก JSON เพื่อเปิด `file://` ได้โดยไม่เรียก fetch
- `scripts/build-offline-data.js`: สร้างไฟล์ข้อมูลหลังแก้ JSON
- `tests/domain.test.js`: ทดสอบตรรกะหลัก

หลังแก้ JSON ให้รันจากโฟลเดอร์โปรเจกต์:

```bash
node scripts/build-offline-data.js
```

Node.js จำเป็นสำหรับ build/test เท่านั้น ถ้ามี Draft ของ Config เดิมใน Browser ให้เลือก Site แล้วกดโหลดค่าตั้งต้นเพื่อใช้ Config ใหม่ การทดลอง Users ชุดใหม่ให้เปิดใน Browser Profile ใหม่หรือโฟลเดอร์ใหม่เพื่อไม่ใช้ข้อมูลที่เคยเก็บไว้

## การตรวจสอบ

ใน RADIUS & Policy → Site กด **ดู Allow Package** เพื่อเปิดหน้าต่างรายการของ Site นั้น เช่น Demo Site A มี Free WiFi 1 Hour และ Staff Monthly ส่วน Demo Site B มี Free WiFi 1 Hour และ Visitor Daily กดชื่อ Package เพื่อดูรายละเอียดแบบอ่านอย่างเดียว ปิดหน้าต่างด้วยปุ่มปิดหรือ Escape ข้อมูลและความสัมพันธ์ทั้งหมดเป็นตัวอย่าง ไม่ใช่ข้อมูลที่ดึงจากระบบจริง

การแก้ปุ่ม Allow Package มี regression test เรียก event handler ของหน้าโดยใช้ DOM จำลอง ครอบคลุมการเปิดซ้ำ การเปลี่ยน Site การปิด การเปิดรายละเอียด และขอบเขตสิทธิ์ ไม่ใช่การทดสอบบน Browser จริง

ตรวจ Syntax ของ JavaScript, JSON, HTML IDs, ไฟล์อ้างอิงและ Link พร้อมทดสอบตรรกะ ครอบคลุม Role/Site, Report, Login, การย้าย Draft รุ่นเดิม, เงื่อนไขใน JSON, การเลือก Config ตามสิทธิ์, Banner หลายชนิด, ลิงก์, การย้าย Banner เดิม และการแจ้งพื้นที่เก็บ Draft ไม่พอ

```bash
node --test tests/*.test.js
```

ยังไม่ได้เปิดทดสอบการแสดงผล การกดครบทุกหน้า หรือ PDF ที่ Browser สร้างจริงในสภาพแวดล้อมนี้
