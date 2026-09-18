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

ตรวจ Syntax ของ JavaScript, JSON, HTML IDs, ไฟล์อ้างอิงและ Link พร้อมทดสอบตรรกะ 10 กรณี ได้แก่ Role/Site, การเพิ่มสิทธิ์, บัญชี Admin, ยอดรายวัน, Report scope, วันที่, รอบเดือน/ข้ามปี, Email, AP totals และ Login/การส่งต่อค่าในโหมดไฟล์

```bash
node --test tests/domain.test.js
```

ยังไม่ได้เปิดทดสอบการแสดงผล การกดครบทุกหน้า หรือ PDF ที่ Browser สร้างจริงในสภาพแวดล้อมนี้
