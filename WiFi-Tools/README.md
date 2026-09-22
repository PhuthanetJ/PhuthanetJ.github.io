# Wi-Fi Tools — Desktop & Mobile Offline Prototype

## รุ่น Desktop / Mobile (18 กันยายน 2569)

หน้าเว็บชุดเดียวปรับตามความกว้างจออัตโนมัติ ธีมน้ำเงินเข้ม–ขาวตามภาพอ้างอิง หน้าจอไม่เกิน 780px ใช้ปุ่ม ☰ เปิดเมนูด้านซ้าย ปิดด้วยปุ่มปิด แตะพื้นหลัง หรือ Escape ส่วน Desktop แสดงแถบเมนูตลอดเวลา

- Dashboard: การ์ดสรุป 2 คอลัมน์สำหรับจอ 341–780px ส่วนกราฟ สถานะบริการ ช่องทางรับสิทธิ์ คูปอง และเหตุการณ์เรียงลงมา ตัวอักษรและปุ่มยังมีขนาดอ่านและกดได้
- Login, AP, Portal Configuration, RADIUS, Reports, User, การแจ้งเตือน, Config และแผน VM ใช้โครงสร้างมือถือร่วมกัน
- ตารางกว้างเลื่อนซ้าย–ขวาภายในกรอบ ไม่ย่อทั้งหน้าให้ตัวอักษรเล็ก
- ฟอร์มมือถือเรียงคอลัมน์เดียว ส่วน Portal Preview อยู่ถัดจากฟอร์ม การเลือก Desktop / Mobile ใน Preview เป็นการเลือกหน้าตาของ Portal แยกจากการปรับหน้าจัดการตามขนาดจอ
- ไฟล์ที่เพิ่ม: `css/mobile.css`, `js/mobile.js` โหลดหลังไฟล์แต่ละเมนู ไม่มี CDN หรือการดึงข้อมูลจากภายนอก
- รูปแบบเดิมและข้อมูลล่าสุดทั้งหมดรวมอยู่ด้วย: Banner / Video Quiz, Questionnaire ที่แก้ไขได้, Config ตาม Portal Path, Site / Allow Package และ Separate Servers

ดาวน์โหลด ZIP แล้ว **แตกไฟล์ทั้งหมดก่อนเปิด** ให้ `index.html`, `html`, `css`, `js`, `data` อยู่ในโครงสร้างเดียวกัน ห้ามเปิดจากหน้าดูตัวอย่างภายใน ZIP หรือคัดลอกเฉพาะ HTML เพราะ Browser ต้องอ่านไฟล์ CSS/JS ข้างเคียงด้วย

บนมือถือ ต้องใช้ Browser/ตัวเปิดไฟล์ที่รัน JavaScript และเข้าถึงไฟล์ข้างเคียงได้ หากแอป Files เปิดเป็นหน้าดูตัวอย่างและปุ่มไม่ทำงาน ให้เปิดโฟลเดอร์นี้ผ่านเว็บเซิร์ฟเวอร์ใน LAN บน PC เช่น `python -m http.server 8080 --bind 0.0.0.0` (ต้องมี Python และใช้เครือข่ายที่เชื่อถือได้) แล้วเปิด `http://<IP-PC>:8080` ใน Browser มือถือ ไม่ต้องใช้อินเทอร์เน็ต แอปไฟล์บางชนิดบนมือถือไม่รองรับเว็บหลายไฟล์ จึงไม่รับรองการเปิด ZIP โดยตรงบนทุกอุปกรณ์

ตรวจโครงสร้างไฟล์และทดสอบตรรกะเมนูมือถือ รวมเปิด/ปิดเมนู, Escape, การวนโฟกัส, เปลี่ยนความกว้างจอ และ Role ที่ซ่อนเมนูด้วย DOM จำลอง ยังไม่ได้ทดสอบการแสดงผลด้วย Browser หรือมือถือจริงในสภาพแวดล้อมนี้

## V011 — ส่วนงาน (ตัวเลือกบน Header)

- เปลี่ยน Header จาก `Site ที่ตั้งค่า` เป็น **ส่วนงาน** ทุกหน้าที่มี Header รวมถึงหน้าตั้งค่า
- ตัวเลือก: `ALL` (ค่าเริ่มต้น), `กรุงเทพและปริมณฑล`, `ภาคกลาง`, `ภาคตะวันออก`, `ภาคเหนือ`, `ภาคตะวันออกเฉียงเหนือ`, `ภาคใต้`
- เก็บค่าที่เลือกใน Draft ของ Browser เพื่อให้เลือกค้างไว้เมื่อเปลี่ยนหน้า; ข้อมูล V010 เดิมที่ไม่มีค่าจะเริ่มต้น `ALL`
- **ขอบเขต:** เป็นตัวเลือกส่วนงานใน UI เท่านั้น เพราะข้อมูลตัวอย่าง `radius-sites.json` มีเพียง Demo Site A/B/C ไม่มีฟิลด์ระบุส่วนงาน/ภูมิภาค จึงยังไม่กรอง Dashboard, Reports, สิทธิ์ หรือ Config ตามภูมิภาค และไม่ได้เปลี่ยน Site ที่กำลังแก้ไข การกรองจริงต้องกำหนดความสัมพันธ์ระหว่าง Site กับส่วนงานและแหล่งข้อมูลจริงก่อน

## V013 — RADIUS & Policy → NAS (Offline CRUD)

- เพิ่มแท็บ **NAS** ต่อจาก Site และ Package; Site/Package ยังเป็น Snapshot อ่านอย่างเดียวตามเดิม
- ตาราง NAS แสดง **Name/Host, Shortname, Secret (แสดง •••••••• เท่านั้น), Server** พร้อมปุ่ม **แก้ไข/ลบ** และค้นหา
- ปุ่ม **เพิ่ม NAS** เปิดฟอร์มแปดพารามิเตอร์: Name/Host, Shortname, Type, Ports, Secret, Server, Community, Description
- ต้องกรอก Name/Host, Shortname, Secret สำหรับรายการใหม่; แก้ไขโดยเว้น Secret ว่างจะรักษาค่าเดิม กรอกใหม่เพื่อเปลี่ยนค่าเดิม
- ตรวจ Name/Host และ Shortname ไม่ซ้ำ, Ports (ถ้ากรอก) เป็นเลข 1–65535 คั่น comma, ความยาวข้อความ และยืนยันก่อนลบ
- ต้นแบบให้ **System Admin** เข้าถึงแท็บ NAS; บัญชีอื่นจะไม่อ่าน/แสดงข้อมูล NAS ผ่านหน้าจอ แต่การตรวจสิทธิ์ที่ Browser **ไม่ใช่ระบบ Security สำหรับ Production**
- NAS Draft เริ่มต้นว่างจาก `data/radius-nas.json` และถูกบันทึกแยกใน `localStorage` ของ Browser นี้ โดยไม่ได้ส่งไป RADIUS Manager และไม่ได้รวมใน Portal Config Export หรือ `window.name`
- **ข้อควรระวังด้านความปลอดภัย:** `localStorage` ไม่เข้ารหัสและผู้ใช้ Browser/เครื่องเดียวกันอาจอ่าน Secret ได้ ต้องใช้ **Secret จำลองเท่านั้น** ห้ามกรอก RADIUS Secret จริง ก่อนใช้ Production ต้องพัฒนา Backend, RBAC ฝั่ง Server, การจัดเก็บ Secret ที่ปลอดภัย, API และ Audit Log ตาม RADIUS Manager รุ่นจริง
- หาก Browser ไม่อนุญาต `localStorage` หรือข้อมูลเก่าอ่านไม่ออก ปิดการแก้ไข NAS และแสดงเหตุผล ไม่เขียนทับข้อมูลที่อ่านไม่ออก
- ไฟล์เกี่ยวข้อง: `html/radius-policy.html`, `js/pages/radius-policy.js`, `js/pages/radius-nas.js`, `js/nas-model.js`, `css/radius-policy.css`, `data/radius-nas.json`, `js/offline-data.js`, `tests/nas.test.js`

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
- Config schemaVersion 7 เก็บ `bindings.siteIds` และระบุ `packageSource: radius-manager-allow-package`; `packageIds` เป็นค่าที่คำนวณจาก Allow Package
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
- Preview แสดงเฉพาะรายการที่เปิด เรียงลำดับและเลื่อนก่อนหน้า/ถัดไปแยกตาม Banner area รูปภาพที่เปิด Clickable กดเปิดลิงก์ได้ ส่วนวิดีโอมีปุ่มเล่นและควบคุมเสียง พร้อมลิงก์ปลายทาง หรือเปิดคำถามที่ผูกไว้เมื่อกดดำเนินการต่อ
- สื่อทุกไฟล์ฝังใน Config JSON จึงเปิดได้ออฟไลน์ ส่วนลิงก์ปลายทางต้องใช้การเชื่อมต่อตามเว็บไซต์นั้น วิดีโอต้องใช้ Codec ที่ Browser รองรับ
- Banner วิดีโอไม่บังคับให้ดูจบก่อนรับสิทธิ์ ตัวเลือก Video Ads ก่อนรับสิทธิ์ยังเป็นต้นแบบเดิม
- Config รุ่นใหม่ใช้ schemaVersion 7; Config / Draft รุ่นเดิมที่มี Banner เดียวจะย้ายมาเป็นรายการแรกให้โดยอัตโนมัติ
- ไฟล์สื่อขนาดใหญ่อาจเกินพื้นที่เก็บของ Browser ระบบจะแจ้งเมื่อบันทึก Draft ถาวรไม่ได้ ให้ดาวน์โหลด Config JSON ก่อนปิดแท็บ แล้วโหลดกลับผ่านเมนูตั้งค่า (ไฟล์ Config ไม่เกิน 60 MB)

## เงื่อนไข Free WiFi และการเลือก Config

- ไปที่ **Portal Configuration → Quiz & เงื่อนไข** เพื่อแก้ข้อความลิงก์ยอมรับและเนื้อหาเงื่อนไขเต็ม แยกภาษาไทย/อังกฤษ
- ใน Preview กดข้อความยอมรับหรือช่องติ๊กเพื่อเปิดหน้าต่างอ่านเงื่อนไข จากนั้นกด **ยอมรับเงื่อนไข** จึงรับสิทธิ์ได้ การปิดหน้าต่างหรือกด Escape ยังไม่ถือว่ายอมรับ
- เนื้อหาแสดงเป็นข้อความธรรมดา รองรับหลายบรรทัด การเปลี่ยนข้อความหรือรุ่นเงื่อนไขทำให้ต้องยอมรับใหม่ใน Preview
- เมนู **ตั้งค่าและไฟล์ Config** เลือก **Portal Path เท่านั้น** แล้วกด **เลือก Config นี้** ก่อนโหลด/ดาวน์โหลด รายการ Path มาจาก Config ที่ผู้ใช้มีสิทธิ์เข้าถึง ส่วน Site เป็นข้อมูลที่ผูกใน Path และแสดงแบบอ่านอย่างเดียว
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
- `js/pages/portal-banners.js`: ตัวจัดการ Banner, Banner area, Preview และหน้าต่าง Quiz
- `js/pages/portal-questionnaires.js`: สร้าง แก้ไข และลบคำถามที่ผูกกับวิดีโอ
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


## เพิ่ม Banner area และ Video Quiz (แก้ต่อจาก WiFi-Tools-Edite.zip)

1. เข้า **Portal Configuration → ดีไซน์** แล้วเพิ่มรูปภาพหรือวิดีโอ
2. เลือก **Banner area** ต่อรายการตามตารางด้านล่าง เปิด Enabled เพื่อแสดง
3. สำหรับวิดีโอ เปิด **Clickable → เมื่อดำเนินการต่อ → Quiz / Questionnaires** แล้วเลือกคำถามได้หลายรายการ
4. กด **ดูตัวอย่าง** ในการ์ด Banner เพื่อไปยังตำแหน่งนั้น กด **ดำเนินการต่อ** เพื่อไปยังคำถามของวิดีโอโดยตรง ไม่มีปุ่มเปิด Quiz ซ้อนบนวิดีโอ สำหรับ 1st page / modal ใช้ปุ่มด้านบนหน้าต่าง ส่วนตำแหน่งอื่นใช้ปุ่มใต้สื่อ
5. ต้องตอบครบทุกข้อ และ Quiz ต้องตอบถูกจึงแสดงผลผ่าน แบบสอบถามไม่มีคำตอบถูกหรือผิด เมื่อผ่านจะมีปุ่มดำเนินการต่อไปยัง Modal ถัดไปหรือกลับ Portal การปิดหน้าคำถามก่อนผ่านจะกลับหน้าวิดีโอ ผลอยู่เฉพาะใน Preview ไม่ส่งเข้าสู่ระบบหรือ Reports และไม่ได้เป็นเงื่อนไขปล่อยอินเทอร์เน็ตจริง
6. แก้ชื่อ คำถาม ตัวเลือก หรือเฉลยใน **Quiz & เงื่อนไข → แก้ไข Questionnaire / Quiz** แล้วกด **บันทึกคำถาม** ก่อนออกจากฟอร์ม คำถามที่ยังผูกกับ Banner จะลบไม่ได้จนกว่าจะยกเลิกการเลือก
7. บันทึก Draft หรือไปเมนูตั้งค่าเพื่อดาวน์โหลด Config JSON ตาม Portal เดิม

| Banner area | ตำแหน่งในต้นแบบ |
| --- | --- |
| b01 | ส่วนหัว / คอลัมน์ข้างฟอร์มเมื่อใช้ Desktop |
| b02 | ใต้ฟอร์มรับสิทธิ์ |
| login | เหนือฟอร์มเข้าสู่ระบบ / รับสิทธิ์ |
| modal | หน้าต่างบน Portal เปิดจากปุ่มเปิด Modal หรือดูตัวอย่าง |
| 1st page (`first`) | หน้าต่างก่อนเข้าสู่ Portal ทดลองผ่านปุ่มทดลอง 1st page หรือดูตัวอย่าง เมื่อกดดำเนินการต่อจะเปิด modal ถ้ามีรายการที่เปิดอยู่ |

ตำแหน่งเหล่านี้เป็นการกำหนดในต้นแบบตามชื่อ area จากภาพอ้างอิง ไม่ใช่การอ่านตำแหน่งจาก Template จริง การเปลี่ยนค่าระหว่างแก้ดีไซน์จะไม่เปิดหน้าต่างเองเพื่อไม่แย่งการพิมพ์ ให้กดปุ่มทดลองที่ Preview

Config schemaVersion 7 เพิ่ม `area`, `clickable`, `action` และ `questionnaireIds` ใน `assets.banners` และเก็บรายการคำถามใน `lists.questionnaires` ทุกค่าผูกกับ Config ของ Portal ที่เลือก นำเข้า Config รุ่น 1–6 ได้ โดย Banner เก่าใช้ b01 และเปิด Clickable เฉพาะรายการที่มีลิงก์เดิม หน้า Portal และวิดีโอใช้คลังคำถาม `lists.questionnaires` ชุดเดียวกัน โดยหน้า Portal เลือกคำถามด้วย `lists.portalQuestionnaireIds` ส่วนวิดีโอเลือกด้วย `questionnaireIds` ของ Banner นั้น แก้คำถามเดียวแล้วทุกตำแหน่งที่อ้างอิงเปลี่ยนตาม คำถาม Portal เดิมจะย้ายเข้าคลังอัตโนมัติเมื่อโหลด Draft / Config รุ่นเก่า โดยไม่เปลี่ยนรายการคำถามที่วิดีโอเคยเลือก

มีคำถามตั้งต้น Customer age, WiFi purpose และ WiFi Quiz สำหรับทดลอง แก้ไขหรือลบได้ การผูกวิดีโอไม่อ้างอิงบริการภายนอก ส่วน URL ปลายทางใช้เครือข่ายตามเว็บไซต์นั้น

ทดสอบ event handler ด้วย DOM จำลองใน `tests/banner-ui.test.js` รวมการย้าย area, เปิด Modal/Quiz, ตอบไม่ครบ/ผิด/ถูก, Clickable เปิด–ปิด, สร้าง/แก้/ลบคำถาม และสิทธิ์อ่านอย่างเดียว พร้อมทดสอบ migration และ Config round-trip ยังไม่ได้ตรวจหน้าตา การเล่น Codec หรือการกดบน Browser จริง


## เปลี่ยนขั้นตอนวิดีโอและการเลือก Config

- **วิดีโอ → ดำเนินการต่อ → คำถาม → ส่งคำตอบ → ดำเนินการต่อ** โดยใช้คำถามที่เลือกใน Banner รายการที่กำลังแสดง ถ้าไม่มีการผูก Questionnaires ขั้นดำเนินการต่อจะไปหน้าถัดไปตามเดิม
- **Quiz & เงื่อนไข** เป็นตำแหน่งหลักสำหรับเพิ่ม/แก้คำถาม พร้อมช่องชื่อ ประเภท คำถาม ตัวเลือก และเฉลย แสดงว่าคำถามนั้นใช้กับหน้า Portal หรือ Banner ใด และมีตัวเลือกคำถามก่อนรับสิทธิ์จากคลังเดียวกัน
- ปุ่ม **แก้ไข Questionnaires** ในการ์ดวิดีโอเปิดไปยังฟอร์มดังกล่าวโดยตรง
- **ตั้งค่าและไฟล์ Config** เลือก Portal Path ได้จากรายการรวมตามสิทธิ์โดยไม่ต้องเลือก Site ก่อน หนึ่ง Config ที่ใช้หลาย Site จะแสดงในรายการครั้งเดียว และยังคงข้อจำกัดสิทธิ์แก้ไข/Export ของ Config ร่วม
- Config ใช้รหัสภายในเดิมเพื่อรักษาความสัมพันธ์และการนำเข้าไฟล์ แต่ผู้ใช้เลือกด้วย Portal Path บนหน้า Settings

## โมดูลตามสเปก / Separate Servers — Local AI และ Retention 6–9 เดือน

ปรับตามข้อกำหนด AI ภายในองค์กร, Backup ใหม่, วิดีโอมาก และ Log/Backup 6–9 เดือน ดูสมมติฐานและสูตรในหน้า **โมดูลตามสเปก** และ `Separate-Servers-Plan.md`

งบตัวอย่าง 9 เดือน: **12 VM / 78 vCPU / RAM 316 GiB / GPU 1 ใบ VRAM 48 GB / Disk 71,560 GB** รวม Backup usable 60,000 GB หนึ่งสำเนาแล้ว ยังไม่รวม RAID/HA/DR/สำเนาที่สอง ตัวเลขนี้ยังไม่ใช่สเปกจัดซื้อหรือผล Load Test ขึ้นกับสมมติฐาน Media/Log/Backup และ PoC โมเดลจริง

หาก GPU ใช้เครื่องจริงแยก จะเป็น 11 VM + 1 GPU Physical Server ไม่ใช่ 12 VM + เครื่องเพิ่มอีกหนึ่ง ยอด vCPU ไม่ใช่จำนวน Physical core ระบบตัวอย่างยังไม่รัน AI หรือ Backup จริง

ข้อมูลอยู่ใน `data/server-plan.json` และ `data/modules.json`; แก้แล้วรัน `node scripts/build-offline-data.js` อัปเดตไฟล์ออฟไลน์

## V014 — RADIUS & Policy → Site / Package (Offline CRUD)

- แท็บ **Site**: เพิ่ม / แก้ไข / ลบ Site Draft โดยใช้ Name, VLAN ID (1–4094 หรือว่าง), Location, Concurrent, Description และเลือก Allow Package แบบ checkbox; ดู Allow Package ของ Site ได้เหมือนเดิม
- แท็บ **Package**: เพิ่ม / แก้ไข / ลบ Package Draft พร้อมพารามิเตอร์ 18 ช่องจากรายละเอียด Package เดิม; แก้ไขชื่อ Package ซ้ำไม่ได้
- หากลบ Package ที่อ้างอิงใน Allow Package ของ Site Draft จะมีข้อความยืนยันบอกจำนวน Site ที่ได้รับผล และลบความสัมพันธ์ภายใน Draft เท่านั้น
- เฉพาะ System Admin ในต้นแบบเท่านั้นที่เห็นปุ่มจัดการและโหลด Draft; ระบบสิทธิ์ฝั่ง Browser นี้ไม่ใช่ Backend authorization สำหรับ Production
- เก็บข้อมูลลง `localStorage` คีย์ `wifi-tools:radius-catalog-demo:v1:<base URL>`; เริ่มจากชุดข้อมูลตัวอย่าง แล้วบันทึก snapshot แยกของเมนู RADIUS & Policy เพื่อ **ไม่เปลี่ยน Portal Configuration, Dashboard, รายชื่อ Site / Role ส่วนอื่น หรือ RADIUS จริง**. การแก้ไขใหม่จะคงอยู่เฉพาะ Browser/Origin/Path เดิมเท่านั้น ถ้าต้องการให้เชื่อมทุกเมนูต้องออกแบบ data source, migration, RBAC และ API ของ RADIUS Manager เพิ่ม ไม่ใช่ความสามารถ V014
- NAS CRUD ของ V013 ยังอยู่เหมือนเดิมและใช้คีย์แยก; ไม่มีการอัปโหลด Secret จริงไปที่ใด
- การตรวจสอบ: Node automated tests + `node --check` ผ่าน; ลองเปิด Chromium ทั้ง file:// และ localhost แล้วได้รับ ERR_BLOCKED_BY_ADMINISTRATOR จากสภาพแวดล้อม จึงยังไม่ยืนยันผล Browser UI จริง

## V015 — RADIUS & Policy → Package: ตารางและพารามิเตอร์

- แท็บ Package แสดงตาราง **Status, Name, Prefix Accounts, Created Date** (Prefix Accounts ใช้ค่าจาก User Prefix เดิม ไม่ใช่จำนวน Account) กดชื่อในตารางเพื่อเลือกดูรายละเอียด/แก้ไข/ลบ
- `Created Date` ของ Package ที่เพิ่มใหม่จะบันทึกเวลาจริงขณะสร้างใน Browser และเก็บไว้เมื่อแก้ไข ส่วนข้อมูลตัวอย่างและ Draft V014 ที่ไม่ได้เก็บวันที่สร้างจะแสดง `—` รวมถึงหลังแก้ไข ไม่แต่งวันที่ย้อนหลัง
- ฟอร์ม Package Type เปลี่ยนเป็น Dropdown **Prepaid / Postpaid**; ฟอร์ม Expiration เป็น **1st Login / Specified Date / Unlimited**; เลือก Specified Date จะแสดงช่องวันหมดอายุและบังคับเลือกวันที่จริง เลือกอย่างอื่นจะซ่อนช่องและล้างวันที่
- โหลด Draft V014 ที่บันทึกไว้ใน Browser ได้โดยไม่แปลงข้อความ Package Type/Expiration เดิมโดยพลการ หากต้องการแก้ไข Package เดิม ต้องเลือกสองฟิลด์ใหม่จาก Dropdown ก่อนบันทึก
- CRUD ยังบันทึกใน `localStorage` แยกจาก Portal Configuration / RADIUS จริง ไม่เรียก Backend หรือเปลี่ยนข้อมูล Production; บัญชี System Admin เป็นการจำลองสิทธิ์ใน Browser ไม่ใช่ RBAC Production
- ไฟล์ที่เปลี่ยน: `html/radius-policy.html`, `js/pages/radius-policy.js`, `js/pages/radius-catalog.js`, `js/radius-catalog-model.js`, `css/radius-policy.css`, `tests/radius-catalog.test.js`, `README.md`, `START-HERE.txt`
- ทดสอบ Node Automated Tests และตรวจ Syntax/JSON; การเปิด Browser จริงในสภาพแวดล้อมนี้ถูกบล็อก (`ERR_BLOCKED_BY_ADMINISTRATOR`) จึงไม่อ้างว่าทดสอบ UI จริงแล้ว


### V016 — RADIUS & Policy / Package: Expiration 1st Login
- เมื่อเลือก `1st Login` แสดงช่อง `Days` (จำนวนเต็ม 1–36500; เมื่อผู้ใช้เลือกโหมดนี้ใหม่ ค่าในฟอร์มเริ่มต้น 30) และบันทึกเป็น `expirationDays` ใน Offline Draft
- `Specified Date` แสดงเฉพาะวันที่ และ `Unlimited` ไม่แสดงวันที่หรือ Days; เปลี่ยนโหมดแล้วเคลียร์ฟิลด์ที่ไม่เกี่ยวข้อง
- Draft จาก V015 ยังอ่านได้โดยไม่เติม Days เอง หากแก้ Package เดิมที่เลือก 1st Login แต่ไม่มี Days ต้องกรอกก่อนบันทึก
- Days หมายถึงช่วงเวลานับตั้งแต่ Login สำเร็จครั้งแรกตามความต้องการ UI เท่านั้น ยังไม่เชื่อมระบบยืนยันตัวตน/บังคับ Expiration บน RADIUS จริง

### V017 — RADIUS & Policy: ลำดับแท็บ
- แสดงแท็บตามลำดับ **NAS → Package → Site** และเข้าเมนูตามปกติให้แสดง NAS เป็นค่าเริ่มต้น
- ลิงก์เจาะจง `?package=...` ยังคงเปิดแท็บ Package ได้; ไม่มีการแก้ไข NAS, Package, Site Draft หรือระบบ RADIUS จริง
