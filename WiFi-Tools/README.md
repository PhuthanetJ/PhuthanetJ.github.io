# Wi-Fi Tools — Offline Prototype

**Current release:** V029  
**Functional baseline:** V029  
**Updated:** 23 September 2026 / 23 กันยายน 2569

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

ลำดับแท็บปัจจุบัน:

1. **ทั่วไป & Path** — เปิดเป็นค่าเริ่มต้น
2. ดีไซน์
3. ข้อความ & ภาษา
4. Login / OTP
5. Quiz & เงื่อนไข

### ทั่วไป & Path

- เลือก Config ตาม **Portal Path**
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
- แก้ข้อความเงื่อนไขการใช้งานไทย/อังกฤษได้
- Config ปัจจุบันใช้ schemaVersion 7 และรองรับ Migration จาก Config รุ่นเก่าในขอบเขตที่โค้ดกำหนด

---

## 4. RADIUS & Policy

ลำดับแท็บปัจจุบัน:

**NAS → Package → Account → Site**

NAS เป็นแท็บเริ่มต้น

> Site / Package / Account / NAS ในเมนูนี้เป็น Draft แยกใน Browser และยังไม่เชื่อม RADIUS Manager จริง การแก้ Site / Package ในหน้านี้ยังไม่เปลี่ยน Portal Configuration, Dashboard หรือระบบ Production

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

ผลตรวจ Functional Baseline V028:

```text
Tests: 109
Pass: 109
Fail: 0
```

ชุดทดสอบครอบคลุม Logic หลัก เช่น Config, Banner, Portal binding, Mobile, Division, NAS, Site/Package CRUD, Account, DISPATCH, Account Detail, Session และ Package Unlimited semantics

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

สิ่งที่ **ยังไม่ทำจริง** ใน Functional Baseline V028:

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
