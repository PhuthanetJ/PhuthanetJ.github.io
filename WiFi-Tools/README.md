# Wi-Fi Tools — Offline Prototype

**Current release:** V039  
**Functional baseline:** V039  
**Updated:** 24 September 2026 / 24 กันยายน 2569

Wi-Fi Tools เป็นต้นแบบระบบบริหาร Wi-Fi แบบ Offline สำหรับทดลอง UI/UX, Config, Portal, RADIUS & Policy, Report และงานบริหารที่เกี่ยวข้อง โดยออกแบบให้เปิดใช้งานจากไฟล์ HTML/CSS/JavaScript ใน Browser ได้โดยไม่ต้องเชื่อม Backend จริง

> **สถานะสำคัญ:** โครงการนี้ยังเป็น Offline Prototype / Draft ข้อมูลจำนวนมากเป็นตัวอย่างหรือเก็บใน Browser (`localStorage`) และยังไม่ใช่ระบบ Production ห้ามใช้ RADIUS Secret, Password, Token หรือข้อมูลสำคัญจริงในต้นแบบนี้

---

## 1. เริ่มใช้งาน

1. แตก ZIP ทั้งหมดก่อนเปิดใช้งาน โดยคงโครงสร้าง `index.html`, `html`, `css`, `js`, `data` ไว้ด้วยกัน
2. เปิด `index.html` ด้วย Chrome หรือ Edge
3. บัญชีตัวอย่างหลัก: `admin` / `Demo1234!`

| Username | Role | Site | Gen Report | Export |
|---|---|---|---|---|
| admin | System Admin | ทุก Site | ได้ | ได้ |
| siteadmin | Site Admin | A | ได้ | ได้ |
| viewer | Site Viewer | B | ไม่ได้ | ไม่ได้ |
| reporter | Site Viewer | A และ C | ได้ | ได้ |

Login / Role / Permission เป็นการจำลองฝั่ง Browser เท่านั้น ไม่ใช่ Backend authorization สำหรับ Production

### Mobile

หน้าจอไม่เกินประมาณ 780px ใช้เมนูแบบ Mobile และตารางกว้างสามารถเลื่อนซ้าย–ขวาภายในกรอบได้ ตัวเลือก **ส่วนงาน** บน Mobile ใช้ตัวเลือกแบบ Touch-friendly แยกจาก Native `<select>` เพื่อแก้กรณีกดเลือกไม่ได้บนมือถือ

หาก Browser บนมือถือเปิดไฟล์หลายไฟล์จาก `file://` ไม่สมบูรณ์ สามารถเปิดผ่าน Web Server ภายใน LAN เช่น:

```bash
python -m http.server 8080 --bind 0.0.0.0
```

จากนั้นเปิด `http://<IP-PC>:8080` บนมือถือในเครือข่ายที่เชื่อถือได้

---

## 2. ส่วนงาน

Header ใช้ชื่อ **ส่วนงาน** โดยมีตัวเลือก:

- `ALL` — ค่าเริ่มต้น
- กรุงเทพและปริมณฑล
- ภาคกลาง
- ภาคตะวันออก
- ภาคเหนือ
- ภาคตะวันออกเฉียงเหนือ
- ภาคใต้

ค่าที่เลือกถูกเก็บใน Browser และคงค่าเมื่อเปลี่ยนหน้า

> ปัจจุบันส่วนงานเป็น **UI selector เท่านั้น** ยังไม่มี Mapping ระหว่าง Site กับส่วนงาน/ภูมิภาค จึงยังไม่กรอง Dashboard, Reports, Config หรือสิทธิ์จริงตามภูมิภาค

---

## 3. Portal Configuration

### Portal Path Management

หน้าแรกของเมนู `Portal Configuration` แสดงหัวข้อหลัก **Portal Path Management** เพียงหัวข้อเดียว และเป็นรายการ **Portal Path** ก่อน ยังไม่เปิด Tabs การตั้งค่าทันที โดยตารางแสดง:

- Name
- Path
- Template
- Sites — จำนวน Site ที่ผูกกับ Path
- Action — Configure / Edit / Delete

รองรับ **Add / Edit / Delete / Configure** Portal Path ใน Offline Draft

- `Configure` → เปิดรายละเอียดของ Portal Path ที่เลือก แล้วจึงแสดง Tabs การตั้งค่า
- `Edit` → แก้ Name / Path / Template / Site binding
- `Delete` → มี Confirm; ถ้ามี Site ผูกอยู่จะแจ้งจำนวน Site ก่อนลบ
- Path ห้ามซ้ำและต้องอยู่ใต้ `/portal/`
- Portal Path ใหม่ต้องผูก Site อย่างน้อย 1 Site
- Site เจ้าของ Portal Path ถูกเก็บภายใน Draft และไม่สามารถนำออกด้วย Edit ปกติ

> Offline Prototype ยังยอมให้ Confirm แล้วลบ Path ที่มี Site ผูกอยู่ได้ เพื่อทดสอบ Flow เท่านั้น สำหรับ Production ควรบังคับ Unassign Site ก่อนลบ

### Configure Portal Path

เมื่อกด Configure หัวข้อหน้าจะเปลี่ยนเป็น **Portal Configuration** แล้วจึงเข้าสู่ Tabs:

1. **ทั่วไป & Path** — เปิดเป็นค่าเริ่มต้น
2. **Login / OTP**
3. **ดีไซน์**
4. **ข้อความ & ภาษา**
5. **Quiz & เงื่อนไข**


### ฟังก์ชันการทำงาน (Quick Settings)

แสดงตัวเลือก Draft ดังนี้:

- ฟังก์ชั่น Register
- ฟังก์ชั่น Free Trial
- รับ Account ผ่าน SMS
- รับ Account ผ่าน E-mail

> ใน Offline Prototype ตัวเลือก Register / รับ Account ผ่าน SMS / รับ Account ผ่าน E-mail เป็น Draft flags สำหรับ UI/Config เท่านั้น ยังไม่เชื่อม Backend Register, SMS Gateway หรือ E-mail จริง ส่วน Free Trial ยังคงอ้างอิงการเปิด Guest/Free Trial เดิมของ Portal.

#### Login / OTP

- **Social Login** รวม Provider: LINE / Google / Apple และเลือกเปิดแต่ละ Provider ได้; Preview แสดงเป็นปุ่มวงกลมพร้อม Icon
- **thaiD Login** แยกจากกลุ่ม Social Login และยังเปิด/ปิดได้อิสระ
- **ลงทะเบียน Free Wi-Fi** เปิด/ปิด Registration Form และเลือก Field ที่จะแสดงได้: Name, Gender, Thai Citizen ID, Passport, Birthday, Mobile Phone, Email, Province
- Province เป็น Dropdown ครบ 77 จังหวัด แบ่งเป็น กรุงเทพและปริมณฑล / ภาคกลาง / ภาคตะวันออก / ภาคเหนือ / ภาคตะวันออกเฉียงเหนือ / ภาคใต้
- V037 เปลี่ยน `Facebook Login` เป็น `thaiD Login` และ Migration Draft/Config รุ่นเก่าที่เคยเปิด Facebook จะย้าย flag มาเป็น thaiD
- Provider และ Register ยังเป็น Offline UI และยังไม่เชื่อม OAuth/thaiD/Register Backend จริง

#### ข้อความ & ภาษา

- ภาษาที่แก้ไขได้: ไทย / English / Chinese / Japanese
- Copy ของแต่ละภาษาถูกบันทึกแยกกันใน Config

#### ทั่วไป & Path

- Config อ้างอิงจาก **Portal Path ที่เลือกจากหน้า Management**
- Site เป็นข้อมูลที่ผูกกับ Portal Path
- เลือก Site ได้หลายรายการตามสิทธิ์
- Package ที่แสดงมาจาก Allow Package ของ Site
- Config ร่วมหลาย Site ใช้ Portal Path ชุดเดียวกัน

### ดีไซน์ / Banner / Video

- รองรับ Banner หลายรายการ
- รองรับรูป PNG / JPG / WebP และวิดีโอ MP4 / WebM
- กำหนด Banner area เช่น `b01`, `b02`, `login`, `modal`, `first`
- เปิด/ปิด, เรียงลำดับ, เปลี่ยนไฟล์, ลบ และกำหนดลิงก์ได้
- วิดีโอสามารถผูก Questionnaire / Quiz ได้
- Flow หลัก: **วิดีโอ → ดำเนินการต่อ → คำถาม → ส่งคำตอบ → ดำเนินการต่อ**

### Quiz & เงื่อนไข

- Questionnaire / Quiz แก้ไขได้
- คำถามของ Portal และคำถามที่ผูกกับ Video ใช้คลังคำถามร่วมกัน
- Terms & Conditions ใช้ Dropdown เลือกภาษาได้: ไทย / English / Chinese / Japanese
- Questionnaire / Quiz ใช้ Dropdown เลือกภาษาที่กำลังแก้แบบเดียวกับ Terms & Conditions: ไทย / English / Chinese / Japanese และรายการคำถามจะแสดงตามภาษาที่เลือก
- Video Ads เลือก Video Banner จากคลัง Banner และกำหนดจำนวนวินาทีที่ต้องดูก่อนจะแสดงปุ่ม “ดำเนินการต่อ”
- Config ปัจจุบันใช้ schemaVersion 9 และรองรับ Migration จาก Config รุ่นเก่าในขอบเขตที่โค้ดกำหนด

---

## 4. RADIUS & Policy

ลำดับแท็บปัจจุบัน:

**NAS → Package → Account → Site**

NAS เป็นแท็บเริ่มต้น

> Site / Package / Account / NAS ยังเป็น Offline Draft และยังไม่เชื่อม RADIUS Manager จริง ตั้งแต่ V031 เป็นต้นไป Site / Package Draft ใช้ร่วมกับ Portal Configuration ภายใน Browser เดียวกัน แต่ยังไม่เปลี่ยน Dashboard หรือระบบ Production

**V036 Site / Portal Path separation:** การสร้าง Site ใน `RADIUS & Policy` จะสร้างเฉพาะ Site เท่านั้น และ **ไม่สร้าง Portal Path อัตโนมัติ**. Site ใหม่จะปรากฏเป็นตัวเลือกใน `Portal Path Management > Add/Edit` เพื่อให้ผู้ดูแลผูกกับ Path ด้วยตนเอง. Site สามารถอยู่ในสถานะ “ยังไม่ผูก Portal Path” ได้โดยไม่ถือว่าเป็นข้อมูลเสีย.

**V034 Referential Integrity:** การลบ Site จะ reconcile Portal Path / Site-scoped Draft ที่อ้างอิง Site นั้น, ย้าย owner ของ Shared Portal Path ไปยัง Site ที่ยังเหลือ, ลบ Portal Path ที่ไม่เหลือ Site, และห้ามลบ Site สุดท้าย. ถ้ามี Account ที่ DISPATCH ไป Site นั้น ต้องยกเลิก DISPATCH ก่อน. การลบ Package จะถูกป้องกันถ้ายังมี Account อ้าง Package เพื่อไม่ให้เกิด orphan Account.

### 4.1 NAS

รองรับ **เพิ่ม / แก้ไข / ลบ / ค้นหา**

ตารางแสดง:

- Name/Host
- Shortname
- Secret — แสดงแบบปิดบัง
- Server

พารามิเตอร์ NAS:

1. Name/Host
2. Shortname
3. Type
4. Ports
5. Secret
6. Server
7. Community
8. Description

Validation หลัก:

- Name/Host และ Shortname ห้ามซ้ำ
- Ports ถ้ากรอกต้องเป็นเลข 1–65535 และรองรับหลายค่าคั่น comma
- แก้ไข NAS โดยเว้น Secret ว่างจะคงค่าเดิม

**Security:** NAS Secret ถูกเก็บใน `localStorage` ของ Prototype ซึ่งไม่เข้ารหัส จึงต้องใช้ Secret จำลองเท่านั้น

### 4.2 Package

รองรับ **เพิ่ม / แก้ไข / ลบ** และ **ค้นหา Package** จาก Name หรือ Prefix Accounts

> V034: ถ้า Package ยังมี Account อ้างใช้งานอยู่ ระบบจะ **ไม่อนุญาตให้ลบ** เพื่อป้องกัน orphan Account. ต้องจัดการ Account ก่อนจึงจะลบ Package ได้.

ตาราง Package แสดง:

- Status
- Name
- Prefix Accounts
- Accounts
- Created Date

จำนวนในคอลัมน์ **Accounts** อยู่กึ่งกลางและกดได้ เมื่อกดจะเปิดแท็บ Account พร้อม Filter เฉพาะ Account ของ Package นั้น

#### พารามิเตอร์ Package

| พารามิเตอร์ | รายละเอียด |
|---|---|
| ชื่อ Policy / Package | ชื่อ Package |
| User Prefix | Prefix สำหรับ GENERATE Username |
| Username format | รูปแบบ Username |
| Package Expired | ข้อมูล Package Expired ตาม Draft |
| Package Type | `Prepaid` / `Postpaid` |
| Upload | `0` / ว่าง = Unlimited |
| Download | `0` / ว่าง = Unlimited |
| Session Time | `0` / ว่าง = Unlimited |
| Session Limit | `0` / ว่าง = Unlimited |
| Idle Timeout | `0` / ว่าง = Unlimited |
| Time (hours:minutes) | `0`, `00:00` หรือว่าง = Unlimited |
| Daily time | `0`, `00:00` หรือว่าง = Unlimited |
| Weekly time | `0`, `00:00` หรือว่าง = Unlimited |
| Monthly time | `0`, `00:00` หรือว่าง = Unlimited |
| Expiration | `1st Login` / `Specified Date` / `Unlimited` |
| Days | แสดงเฉพาะ `1st Login`, 1–36500 วัน |
| Expiration Date | แสดงเฉพาะ `Specified Date` |
| Price | ราคา Package |
| Status | `Active` / `Disabled` |
| Description | รายละเอียด Package |

#### Expiration

- `1st Login` → ระบุ `Days`; ค่าเริ่มต้นเมื่อเลือกโหมดใหม่คือ 30 วัน
- `Specified Date` → ระบุ Expiration Date
- `Unlimited` → ไม่กำหนดวันหมดอายุ

#### Unlimited semantics

พารามิเตอร์ต่อไปนี้ใช้กติกาเดียวกัน:

`Upload / Download / Session Time / Session Limit / Idle Timeout / Time / Daily time / Weekly time / Monthly time`

ถ้าเป็น `0`, ค่าเวลาศูนย์ เช่น `00:00`, หรือเว้นว่าง → Prototype ตีความเป็น **Unlimited**

> เมื่อเชื่อม RADIUS จริง ต้องกำหนด Mapping ใหม่ว่าค่า Unlimited จะใช้ `0`, `NULL`, ไม่สร้าง Attribute หรือรูปแบบอื่นตาม Schema/Implementation จริง

### 4.3 Account

รองรับ:

- **CREATE** — สร้าง Account ทีละรายการ
- **GENERATE** — สร้างหลาย Account จาก `User Prefix + เลข 8 หลัก` สูงสุด 1,000 Account/ครั้ง
- **IMPORT** — Import CSV
- **DISPATCH** — กำหนด Account ให้ใช้ได้เฉพาะ Site
- **EXPORT CSV** — Export รายการ Account ตาม Filter ปัจจุบัน
- Search / Filter / Select Account

CSV Import ใช้ Header:

```csv
username,package,status,dispatch_site
```

`package` และ `dispatch_site` รองรับ ID หรือชื่อที่แสดงใน Draft

#### Account Status

Account ใช้สถานะ:

- `Active`
- `Inactive`

ข้อมูล Draft เก่าที่ใช้ `Disabled` จะถูก Migration เป็น `Inactive` ใน Account model

#### DISPATCH Logic

**ไม่ DISPATCH**

Account ใช้ได้ทุก Site ที่มี Package ของ Account นั้น

```text
Account A → Package X
Site A มี Package X → ใช้ได้
Site B มี Package X → ใช้ได้
Site C ไม่มี Package X → ใช้ไม่ได้
```

**DISPATCH ไป Site A**

```text
Account A → Package X → Dispatch Site A
Site A → ใช้ได้
Site B → ใช้ไม่ได้ แม้มี Package X
Site C → ใช้ไม่ได้
```

DISPATCH จึงเป็นตัวจำกัดขอบเขต Site ของ Account โดยไม่ได้เปลี่ยน Package ของ Account

#### Account Detail

กด Username เพื่อเปิดรายละเอียด:

- Username
- Package
- Status — Toggle `Active / Inactive`
- Package Type
- Package Price
- Session Time
- First Login
- Expired Date
- Time Used
- Last Login
- Created Date
- Remain

ค่าที่ไม่มีข้อมูลแสดง `—` และ Prototype ไม่สร้างข้อมูล Login ย้อนหลังเอง

#### Sessions

ใน Account Detail มีตาราง Sessions:

| ลำดับ | MAC | Last seen |
|---:|---|---|

มีปุ่ม **Refresh** เพื่ออ่านข้อมูล Session ล่าสุดจาก Account Draft ปัจจุบัน

> Refresh ยังไม่อ่าน `radacct` หรือข้อมูลสดจาก FreeRADIUS

### 4.4 Site

รองรับ **เพิ่ม / แก้ไข / ลบ Site**

> V034: ต้องเหลือ Site อย่างน้อย 1 รายการ และถ้ายังมี Account ที่ `DISPATCH` ไป Site นั้น จะต้องยกเลิก DISPATCH ก่อนลบ. การลบ Site จะ reconcile Portal Path และ Site-scoped Draft เพื่อไม่ให้เกิด reference ค้าง.

พารามิเตอร์หลัก:

- Name
- VLAN ID
- Location
- Concurrent
- Description
- Allow Package

ตาราง Site แสดงจำนวน Account ที่ Site ใช้งานได้ โดยคำนึงถึง:

1. Package ต้องอยู่ใน Allow Package ของ Site
2. ถ้า Account มี DISPATCH ต้องตรง Site

คอลัมน์ Accounts กดได้ เมื่อกดจะเปิดแท็บ Account พร้อม Filter ตาม Site และแสดง **Account ตาม Package** เฉพาะในหน้าที่เข้าไปดู ไม่แสดง Breakdown ค้างในตาราง Site

---

## 5. Dashboard / AP / Report / User / Notification

### Dashboard / AP

- Dashboard แสดงข้อมูลสรุปตัวอย่าง
- กด Site เพื่อดู AP → Vendor → Model
- แสดงข้อมูลเช่น IP, MAC, Firmware, Status, Clients และ Last seen

### Reports

- กรองช่วงวันที่
- สรุปรวมรายวัน หรือแยก Site
- Export CSV
- PDF ผ่าน Report Preview และ Browser Print / Save as PDF
- รองรับหน้าปกหลายรูปแบบ
- ตั้งค่ารายงานรายเดือนแบบ Draft ได้

### User / Role

- Login / Logout
- เพิ่ม/แก้ผู้ใช้ใน Prototype
- Role: System Admin / Site Admin / Site Viewer
- จำกัด Site, Export และ Generate Report ตามสิทธิ์ที่กำหนดใน Draft

### Notification

มีค่าตั้งตัวอย่างสำหรับ:

- In-app
- Telegram
- LINE Messaging API
- Email / SMTP
- Webhook

ยังไม่มีระบบส่งข้อความจริง

### Free WiFi & Coupon

- เลือก Site Name ได้
- Coupon ตัวอย่างผูกกับ Site

---

## 6. ตั้งค่าและไฟล์ Config

- เลือก Config ตาม **Portal Path**
- โหลด Config JSON
- ดาวน์โหลด Config JSON
- โหลดค่าตั้งต้น
- มีวิธีใช้งาน / Scope ในต้นแบบ
- Site เป็นความสัมพันธ์ภายใน Portal Path ไม่ใช่ตัวเลือกหลักของหน้าตั้งค่า

Draft ของ Browser ไม่ได้เขียนทับไฟล์ต้นฉบับ การย้ายโฟลเดอร์, เปลี่ยน Origin หรือเปลี่ยน Browser/Profile อาจทำให้ไม่พบ Draft เดิม

---

## 7. โมดูลตามสเปก / Separate Servers

มีแผนตัวอย่างสำหรับ:

- Local AI ภายในองค์กร
- Separate Servers
- Media / Video ปริมาณมาก
- Log / Backup retention 6–9 เดือน

รายละเอียดสมมติฐานและ Capacity อยู่ใน:

- `Separate-Servers-Plan.md`
- `data/server-plan.json`
- `data/modules.json`

ตัวเลขในแผนเป็น Capacity Planning ตัวอย่าง ไม่ใช่ผล Load Test หรือสเปกจัดซื้อที่ยืนยันแล้ว

---

## 8. Data / Storage / Security Model

### Data Source ปัจจุบัน

- JSON ใน `data/` = ข้อมูลตั้งต้น/ตัวอย่าง
- `js/offline-data.js` = Bundle ข้อมูลเพื่อให้เปิด `file://` ได้โดยไม่ต้อง Fetch
- `localStorage` = Draft ที่ผู้ใช้แก้ใน Browser

### ข้อจำกัดด้าน Security

Prototype นี้ไม่มี Backend Security จริง จึงไม่ควรเก็บ:

- RADIUS Secret จริง
- Password จริง
- API Token จริง
- SMTP Credential จริง
- Production Customer Data

ก่อนนำไป Production ต้องมีอย่างน้อย Backend API, Authentication/Session, Server-side RBAC, Audit Log, Secret Management, Database Transaction/Validation และ Integration กับ RADIUS Manager / FreeRADIUS จริง

---

## 9. โครงสร้างไฟล์หลัก

```text
WiFi-Tools/
├── index.html
├── html/                  # หน้า UI แยกตามเมนู
├── css/                   # CSS กลางและรายหน้า
├── js/
│   ├── app.js             # Session / Config / ส่วนงาน / state หลัก
│   ├── mobile.js          # Mobile behavior และ Division picker
│   ├── radius-catalog-model.js
│   ├── nas-model.js
│   ├── account-model.js
│   └── pages/             # Logic เฉพาะแต่ละหน้า
├── data/                  # Demo JSON / CSV
├── tests/                 # Node automated tests
├── docs/
├── scripts/
├── Separate-Servers-Plan.md
└── README.md
```

ไฟล์สำคัญของ RADIUS & Policy:

- `html/radius-policy.html`
- `css/radius-policy.css`
- `js/pages/radius-policy.js`
- `js/pages/radius-catalog.js`
- `js/pages/radius-nas.js`
- `js/pages/radius-account.js`
- `js/radius-catalog-model.js`
- `js/nas-model.js`
- `js/account-model.js`
- `data/radius-sites.json`
- `data/radius-packages.json`
- `data/radius-nas.json`
- `data/radius-accounts.json`

---

## 10. Testing

รัน Automated Tests:

```bash
node --test tests/*.test.js
```

ผลตรวจ Functional Baseline V030:

```text
Tests: 114
Pass: 114
Fail: 0
```

ชุดทดสอบครอบคลุม Logic หลัก เช่น Config, Banner, Portal binding, Mobile, Division, NAS, Site/Package CRUD, Account, DISPATCH, Account Detail, Session, Package Unlimited semantics และ Portal Path Management CRUD

> Automated Tests ใช้ Node / DOM จำลองในหลายส่วน ไม่เท่ากับการทดสอบ End-to-End บน Browser, Mobile Device หรือ RADIUS Production จริง

---

# 11. Version History

> Version History ด้านล่างระบุ **สิ่งที่เพิ่ม/เปลี่ยนในแต่ละรุ่น ณ เวลานั้น** ไม่ใช่คำอธิบาย Current Behavior หากข้อมูลเก่าขัดกับส่วน Current Features ด้านบน ให้ยึดส่วน Current Features

## V010 — Baseline: Local AI Backup / Offline Prototype

- Baseline ที่ใช้เริ่มพัฒนาชุด V011 เป็นต้นไป
- Desktop / Mobile responsive prototype
- Dashboard, AP, Portal Configuration, Reports, User/Role, Notification, Free WiFi/Coupon, Config และ Modules
- Banner / Video Quiz / Questionnaire
- Portal Config ตาม Portal Path และ Site / Allow Package snapshot
- Separate Servers / Local AI / Backup retention planning
- RADIUS & Policy ใน Baseline ยังเป็นข้อมูล Snapshot/Read-only เป็นหลัก

## V011 — Division / ส่วนงาน

- เปลี่ยน Header จาก `Site ที่ตั้งค่า` เป็น **ส่วนงาน**
- เพิ่ม `ALL` เป็นค่าเริ่มต้นและ 6 ภูมิภาค
- เก็บค่าที่เลือกใน Browser Draft
- ยังไม่ทำ Site-to-Division Mapping จริง

## V012 — Portal Configuration Tab Order

- ย้าย **ทั่วไป & Path** เป็นแท็บแรก
- เปิดทั่วไป & Path เป็นค่าเริ่มต้น
- ดีไซน์ย้ายเป็นแท็บที่สอง

## V013 — NAS CRUD

- เพิ่มแท็บ NAS ใน RADIUS & Policy
- รองรับเพิ่ม/แก้ไข/ลบ/ค้นหา NAS
- เพิ่ม 8 NAS parameters: Name/Host, Shortname, Type, Ports, Secret, Server, Community, Description
- Secret ในตารางแสดงแบบปิดบัง

## V014 — Site / Package CRUD

- Site รองรับเพิ่ม/แก้ไข/ลบ
- Package รองรับเพิ่ม/แก้ไข/ลบ
- Site เลือก Allow Package ได้
- เมื่อลบ Package จะลบความสัมพันธ์ Allow Package ภายใน Draft หลังยืนยัน

## V015 — Package Table / Type / Expiration

- ตาราง Package แสดง Status, Name, Prefix Accounts, Created Date
- เพิ่ม Package Type แบบ Dropdown: `Prepaid / Postpaid`
- Expiration แบบ Dropdown: `1st Login / Specified Date / Unlimited`
- `Specified Date` แสดง Expiration Date
- Package ใหม่บันทึก Created Date; ข้อมูลเก่าที่ไม่มีวันที่แสดง `—`

## V016 — Expiration: 1st Login + Days

- `1st Login` แสดงช่อง Days
- Days รองรับ 1–36500
- ค่าเริ่มต้นในฟอร์มเมื่อเลือกใหม่ = 30 วัน
- `Specified Date` และ `Unlimited` ซ่อน Days

## V017 — RADIUS Tab Order รุ่นแรก

- เรียงแท็บเป็น **NAS → Package → Site**
- NAS เป็นแท็บเริ่มต้น
- Deep link ไป Package ยังทำงาน

## V018 — Mobile Division Fix

- แก้ Dropdown ส่วนงานบน Mobile ที่กดเลือกไม่ได้
- เพิ่ม Touch-friendly Division picker
- Desktop ยังคงใช้ Native select

## V019 — Account Tab + Account Counts

- เพิ่มแท็บ Account แบบ Read-only ในช่วงแรก
- Package เพิ่มจำนวน Account
- Site เพิ่มยอดรวม Account จาก Package ที่ Allow
- เพิ่ม Breakdown Account ตาม Package

## V020 — Clickable Account Counts

- จัดตัวเลขคอลัมน์ Accounts ให้อยู่กลาง
- จำนวน Account ใน Package กดเพื่อเปิด Account ที่ Filter ตาม Package
- จำนวน Account ใน Site กดเพื่อเปิด Account ที่ Filter ตาม Site
- เพิ่มทางกลับไปดู Account ทั้งหมด

## V021 — Site Account Breakdown Drill-down

- ซ่อน `Account ตาม Package` ออกจากตาราง Site
- แสดง Breakdown เฉพาะเมื่อกดจำนวน Accounts ของ Site แล้วเข้าแท็บ Account
- สามารถ Filter ต่อจาก Site ลงไป Package ได้

## V022 — Account Actions + DISPATCH

- Account รองรับ CREATE / GENERATE / IMPORT / DISPATCH / EXPORT CSV
- GENERATE ใช้ User Prefix + เลข 8 หลัก
- เพิ่ม Logic DISPATCH เพื่อจำกัด Account ให้ใช้ได้เฉพาะ Site
- ถ้าไม่ DISPATCH Account ใช้ได้ทุก Site ที่ Allow Package นั้น
- จำนวน Account ของ Site เริ่มคำนึงถึง DISPATCH

## V023 — Account Detail + Sessions

- Username กดเปิด Account Detail ได้
- เพิ่มข้อมูล Package, Status, Package Based, Package Price, Session Time, First Login, Expired Date, Time Used, Last Login, Created Date, Remain
- เพิ่ม Session history: ลำดับ, MAC, Last seen
- ค่าที่ไม่มีข้อมูลแสดง `—`

## V024 — Package Type / Account Status / Session Refresh

- เปลี่ยนชื่อ `Package Based` ใน Account Detail เป็น **Package Type**
- Account Status เปลี่ยนเป็น Toggle `Active / Inactive`
- Account Draft เก่าที่เป็น `Disabled` Migration เป็น `Inactive`
- เพิ่มปุ่ม **Refresh** ใน Sessions

## V025 — Final RADIUS Tab Order

- เรียงแท็บเป็น **NAS → Package → Account → Site**
- NAS ยังคงเป็นแท็บเริ่มต้น
- Deep link Package ยังคงทำงาน

## V026 — Package Unlimited Semantics

- `Upload / Download / Session Time / Session Limit / Idle Timeout / Time / Daily / Weekly / Monthly` ใช้ค่า `0`, ค่าเวลาศูนย์ หรือว่าง = **Unlimited**
- ฟอร์มเพิ่ม Placeholder / Help text อธิบายกติกา
- Package Detail และ Account Detail แสดง `Unlimited` แทนค่าศูนย์/ว่างในจุดที่รองรับ

## V027 — README / Documentation Rebuild

- ไม่เปลี่ยน Functional Code จาก V026
- จัด README ใหม่ให้ Current Features แยกจาก Version History
- เพิ่มประวัติครบ V010–V027
- แก้ข้อความเก่าที่ขัดกับความสามารถปัจจุบัน เช่น Site/Package Read-only, Account Status และชื่อ Package Type
- รวมข้อจำกัด Offline Prototype / Security / Testing ให้ชัดเจน

## V028 — Package Search

- เพิ่มช่องค้นหาและปุ่ม **ค้นหา** ใน `RADIUS & Policy > Package`
- ค้นหาแบบไม่สนตัวพิมพ์เล็ก/ใหญ่จาก **Name** หรือ **Prefix Accounts**
- ตารางและตัวนับ Package แสดงเฉพาะผลลัพธ์ที่ตรงคำค้น
- ไม่เปลี่ยน Package ที่เลือกในส่วนรายละเอียด และไม่กระทบ CRUD / Account Count เดิม

---

## 12. Current Limitations / Next Production Work

สิ่งที่ **ยังไม่ทำจริง** ใน Functional Baseline V037:

- ไม่มี Backend API
- ไม่มี Database CRUD จริง
- ยังไม่เชื่อม RADIUS Manager / FreeRADIUS
- Sessions Refresh ยังไม่อ่าน `radacct`
- Package Expiration / Rate Limit / Quota ยังไม่บังคับจริงบน RADIUS
- Division ยังไม่ Mapping กับ Site
- Notification ยังไม่ส่งจริง
- Monthly report ยังไม่มี Scheduler จริง
- AI ยังไม่รันจริง
- Backup / Retention เป็น Capacity Plan
- Browser-side Role/Permission ไม่ใช่ Security boundary
- Account ยังไม่มีคำสั่ง DELETE / เปลี่ยน Package โดยตรงตาม Requirement ปัจจุบัน; Package ที่มี Account จึงถูกป้องกันไม่ให้ลบใน V034

ก่อน Production ต้องยืนยัน Schema, API, Attribute Mapping, Version และ Behavior ของ RADIUS Manager / FreeRADIUS ที่จะเชื่อมจริงก่อนนำ Logic Draft ไปใช้

## Sidebar Navigation

Current order:

1. Dashboard
2. RADIUS & Policy
3. Portal Configuration
4. Free WiFi & Coupon
5. Network Configuration
6. AP by Site
7. Reports
8. Monitor & Logs
9. Notifications
10. Administrator
11. Admin / Management
12. Specification

The filenames/routes remain unchanged; only the sidebar order and display labels were updated.

## Version History

### V029 — Sidebar Navigation Reorder & Rename
- Reordered the main Sidebar Navigation to: Dashboard → RADIUS & Policy → Portal Configuration → Free WiFi & Coupon → Network Configuration → AP by Site → Reports → Monitor & Logs → Notifications → Administrator → Admin / Management → Specification.
- Renamed sidebar labels: การแจ้งเตือน → Notifications, User → Administrator, ตั้งค่าและไฟล์ Config → Admin / Management, โมดูลตามสเปก → Specification.
- Existing page filenames/routes remain unchanged.


### V030 — Portal Path Management Flow
- เปลี่ยนหน้าแรก `Portal Configuration` ให้เริ่มจากตาราง Portal Path ก่อนเปิด Tabs
- ตารางแสดง Name / Path / Template / Sites / Action
- รองรับ Add / Edit / Delete / Configure Portal Path ใน Browser Draft
- Configure เปิดหน้าเดิมพร้อม Tabs ของ Portal Path ที่เลือก และมีปุ่มกลับ Portal Path List
- Delete มี Confirm และแจ้งจำนวน Site ที่ผูกใช้งานอยู่
- เพิ่ม Validation Path ซ้ำ, Path format และ Site binding
- เพิ่ม ownerSiteId ภายใน Draft เพื่อรองรับหลาย Portal Path ต่อ Site โดยไม่ผูก Portal ID กับ Site ID
- Production recommendation: บังคับ Unassign Site ก่อน Delete จริง


## V031 — Shared RADIUS Site/Package → Portal Configuration
- Site / Package Draft ใช้ร่วมกับ Portal Configuration ภายใน Browser เดียวกัน


## V032 — Portal Page Title Flow
- หน้า Portal Path List แสดงหัวข้อหลัก `Portal Path Management` เพียงครั้งเดียว
- ซ่อน badge/ข้อความซ้ำ `Portal Path Management` ในหน้า List
- เมื่อกด Configure หัวข้อหลักเปลี่ยนเป็น `Portal Configuration` และจึงแสดง Tabs การตั้งค่า
- Sidebar menu ยังคงชื่อ `Portal Configuration` เพื่อสื่อชื่อโมดูลหลัก

## V033 — Portal Tab Order + Function Labels
- เรียง Tabs ในหน้า Configure เป็น **ทั่วไป & Path → Login / OTP → ดีไซน์ → ข้อความ & ภาษา → Quiz & เงื่อนไข**
- ปรับ Quick Settings `ฟังก์ชันการทำงาน` เป็น: **ฟังก์ชั่น Register / ฟังก์ชั่น Free Trial / รับ Account ผ่าน SMS / รับ Account ผ่าน E-mail**
- เพิ่ม Draft flags สำหรับ Register / Account SMS / Account E-mail และรองรับ Migration จาก Draft/Config รุ่นก่อนโดยไม่ทำให้ไฟล์เดิมเสีย
- ฟังก์ชัน Register / SMS / E-mail ยังเป็น Offline Draft flags และยังไม่เชื่อม Provider/Backend จริง



## V034 — CRUD Regression & Site Delete Integrity
- แก้ Root Cause กรณีลบ Site 1 รายการแล้ว Portal Configuration โหลดไม่ได้: Portal Config เดิมยังเก็บ `ownerSiteId` / `bindings.siteIds` ที่ชี้ Site ที่ถูกลบ ทำให้ `WiFiPortalBindings.normalize()` throw และหยุด `app.js` ระหว่าง Startup.
- เพิ่มการ Reconcile Portal Config ทุกครั้งที่ Site/Package Catalog เปลี่ยนและระหว่าง Startup เพื่อกู้ Draft รุ่นก่อนที่มี Site reference ค้าง.
- Shared Portal Path: ถ้า Owner Site ถูกลบ แต่ยังมี Site อื่นผูกอยู่ ระบบย้าย Owner ไป Site ที่เหลือและคง Portal Path ไว้.
- Portal Path ที่ไม่เหลือ Site หลังลบ Site จะถูกลบเฉพาะ Draft นั้น โดยไม่กระทบ Portal Path อื่น.
- ถ้า Current Site ถูกลบ จะย้าย Context ไป Site ที่ยังเหลือ.
- ทำความสะอาด Site-scoped Draft ได้แก่ Notification channel, Coupon, Report Schedule และ User site scope ที่อ้าง Site ที่ถูกลบ.
- ห้ามลบ Site สุดท้าย เพื่อป้องกันระบบเข้าสู่สถานะไม่มี Site.
- ห้ามลบ Site ถ้ายังมี Account ที่ DISPATCH ไป Site นั้น; ต้องยกเลิก DISPATCH ก่อน.
- ห้ามลบ Package ถ้ายังมี Account อ้าง Package เพื่อป้องกัน orphan Account.
- เพิ่ม `tests/crud-regression.test.js` สำหรับ Site-delete reload regression, Shared Portal ownership transfer, Site-scoped cleanup และ CRUD smoke matrix ของ NAS / Package / Site / Account / Portal Path.
- Automated test suite: 124/124 ผ่านใน V034.
- การทดสอบ Browser จริงด้วย Headless Chromium ถูก Environment block localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`) จึงยังต้องทดสอบ interaction บน Chrome/Edge จริงของผู้ใช้เพิ่มเติม.


## V035 — Referential Integrity Hardening
- Block การนำ Package ออกจาก Site ถ้ายังมี Account ของ Package นั้น `DISPATCH` มายัง Site; ต้องยกเลิก DISPATCH ก่อน
- Account Draft validation เปลี่ยนเป็น strict สำหรับ Package/Site relation ใน `check()` และ `serialize()`
- Legacy stale DISPATCH ที่ Site หายหรือ Site ไม่ได้ Allow Package แล้ว จะ Recovery แบบ fail-closed: เปลี่ยน Account เป็น `Inactive` และล้างเฉพาะ DISPATCH ที่เสีย
- Portal Path `Edit / Delete / Binding change` จะ reconcile coverage ทันที ไม่ต้องรอ Reload เพื่อสร้าง fallback Path ให้ Site ที่หลุดจาก Path สุดท้าย
- Account CSV Export ป้องกัน Spreadsheet Formula Injection (`=`, `+`, `-`, `@`) ด้วย safe prefix
- เพิ่ม Regression Tests สำหรับ Site↔Package↔DISPATCH, stale Account recovery, immediate Portal reconciliation และ CSV hardening


## V036 — Site / Portal Path Lifecycle Separation
- การ Add Site ใน `RADIUS & Policy > Site` ไม่สร้าง Portal Path หรือ Portal Config Draft อัตโนมัติอีกต่อไป
- Site ใหม่ยัง Sync ไป `Portal Configuration` เพื่อให้เลือกได้ใน `Portal Path Management > Add/Edit` แต่เริ่มต้นเป็น **Unassigned**
- ยกเลิก fallback Portal Path อัตโนมัติเมื่อ Site ถูกนำออกจาก Path สุดท้าย; ผู้ดูแลต้อง Add/Edit Portal Path เพื่อผูก Site เอง
- Portal Path ที่มีอยู่เดิมยังคงอยู่ และการลบ Site ยังคงทำ Referential Cleanup / Owner transfer สำหรับ Shared Path ตาม V034/V035
- เพิ่ม runtime scratch config สำหรับหน้า List/หน้าทั่วไปเมื่อ Current Site ยังไม่มี Portal Path โดย scratch นี้ไม่ถูก Persist และไม่แสดงใน Portal Path Management
- เพิ่ม Regression Tests ยืนยัน Create Site → Portal Path count ไม่เพิ่ม, Site unassigned เปิด Portal Management ได้, และ Add Portal Path แบบ Manual ผูก Site ได้


## V037 — Portal Languages / thaiD / Video Ads Gate
- `Login / OTP`: เปลี่ยน Facebook Login เป็น **thaiD Login** และรองรับ Migration จาก Draft/Config รุ่นก่อน
- `ข้อความ & ภาษา`: เพิ่ม **Chinese** และ **Japanese** ทำให้ Portal Copy รองรับ 4 ภาษา (th/en/zh/ja)
- `Quiz & เงื่อนไข`: Terms & Conditions เปลี่ยนเป็นตัวแก้ไขแบบเลือกภาษาจาก Dropdown สำหรับ 4 ภาษา
- Questionnaire / Quiz เพิ่ม `language` ต่อรายการ และ Preview หน้า Portal เลือกคำถามตามภาษาที่กำลังแสดง
- Video Ads ผูกกับ **Video Banner** ที่มีอยู่ในแท็บดีไซน์ พร้อมกำหนด Watch Seconds 1–120 วินาที
- ปุ่ม **ดำเนินการต่อ** ใน Video Ads ถูกซ่อนไว้จนตรวจเวลาการเล่นครบตามเงื่อนไข; การ Seek ข้ามช่วงยาวไม่ถูกนับเป็นเวลาที่ดู
- Config schema เพิ่มเป็น **schemaVersion 8**; Import รุ่นเก่ายังคง Migration ภาษา/Terms/thaiD/Video Ads defaults
- Automated / Regression Tests: **138/138 ผ่าน**


## V038 — Social Login Group + Free Wi-Fi Registration Button
- `Login / OTP`: รวม **LINE / Google / Apple** ไว้ใต้กลุ่ม **Social Login** และเลือกเปิด/ปิดแต่ละ Provider ได้
- Social Login ใน Portal Preview แสดงเป็น **ปุ่มวงกลมพร้อม Icon** ตาม Provider ที่เปิดใช้งาน
- **thaiD Login** ยังคงเป็นวิธี Login แยกจาก Social Login
- เพิ่มตัวเลือก **แสดงปุ่ม ลงทะเบียน Free Wi-Fi** ซึ่งใช้ Draft flag `registerEnabled` เดิม
- เมื่อเปิด Register, Portal Preview แสดงปุ่ม `ลงทะเบียน Free Wi-Fi`; Offline Prototype แสดงเพียง feedback และยังไม่เชื่อม Register Backend
- ไม่เปลี่ยน Config schema เพราะใช้ state flags เดิม (`line`, `google`, `apple`, `thaid`, `registerEnabled`)
- Automated / Regression Tests: **140/140 ผ่าน**


## V039 — Registration Fields + Questionnaire Language Selector
- `Login / OTP`: เปลี่ยน Label Register เป็น **ลงทะเบียน Free Wi-Fi** และเมื่อเปิดจะแสดง Registration Field Configuration
- Registration Fields รองรับ Name, Gender, Thai Citizen ID, Passport, Birthday, Mobile Phone, Email และ Province
- Province ใช้ Dropdown ครบ 77 จังหวัด แบ่งเป็น 6 กลุ่มภูมิภาคของโครงการ
- Portal Preview กด `ลงทะเบียน Free Wi-Fi` แล้วเปิด Registration Form ตาม Field ที่เลือก; ยังเป็น Offline Preview และไม่ส่ง Backend
- `Quiz & เงื่อนไข`: Questionnaire / Quiz เพิ่ม Dropdown เลือกภาษาแบบเดียวกับ Terms & Conditions และกรองรายการคำถามตามภาษา
- Config schema เพิ่มเป็น **schemaVersion 9** เพื่อเก็บ Registration Field flags และรองรับ Migration จาก Draft เดิม
