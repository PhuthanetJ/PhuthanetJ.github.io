# Wi-Fi Tools — Local AI / Separate Servers / Retention 6–9 เดือน

**สถานะ: งบตัวอย่างเพื่อวางแผน ยังไม่ใช่สเปกจัดซื้อหรือผล Load Test**

ปรับจากแผนเดิม 11 VM เป็น 12 VM เมื่อทำ GPU passthrough ได้ หรือ 11 VM + 1 GPU Physical Server หากเลือกแยกเครื่องจริง รุ่น Desktop/Mobile และฟังก์ชันเดิมคงอยู่ การแก้ครั้งนี้เป็นแผน Infra ไม่ได้ติดตั้ง AI/Backup จริง

## เงื่อนไขและสมมติฐาน

- ข้อกำหนดยืนยัน: AI ประมวลผลภายในองค์กร, สร้างระบบ Backup ใหม่, มีวิดีโอมาก และเก็บ Log/Backup ประมาณ 6–9 เดือน
- คงสมมติฐานโหลดเดิมเฉพาะเพื่อเปรียบเทียบ: 10 Site / 50 AP / 1,000 Sessions พร้อมกัน / Login สูงสุด 10 requests/วินาที ยังไม่ใช่ข้อมูลจริง
- ตารางใช้กรณี 9 เดือน ≈ 270 วัน; 6 เดือน ≈ 180 วัน เป็นการประมาณ 30 วัน/เดือน ต้องคำนวณตามปฏิทินจริงก่อนตั้ง Retention
- Local AI สำหรับข้อความ/Config/รายงาน/Log: งบ PoC โมเดล 8B–14B แบบ quantized, context 8K และ 1–4 คำขอพร้อมกัน ทั้งหมดเป็นโจทย์ทดลอง ไม่ใช่ผลยืนยันประสิทธิภาพ; ไม่รวม training หรือวิเคราะห์วิดีโอด้วย AI
- รวม 12 VM เมื่อ GPU ส่งผ่านเข้า VM ได้: เพิ่ม VM-12 สำหรับ Inference อีก 1 VM; หากเลือก GPU Physical Server จะเป็น 11 VM + 1 Physical Server ต้องจัดสเปก CPU เครื่องจริงใหม่ ไม่มี Replica / HA / DR
- RADIUS Manager / FreeRADIUS / SQL Server เป็นตัวเลือกจากแผนเดิม ยังต้องยืนยันรุ่น, Driver, License และการแยกฐานข้อมูล; ไม่เปลี่ยนระบบ Production ใดในงานนี้
- งบพื้นที่ตัวอย่าง: Media เริ่ม 1,000 GB เพิ่มสุทธิ 5 GB/วัน; Log ดิบ 5 GB/วัน; Full Backup ของข้อมูลที่เลือกไม่เกิน 4,000 GB ต่อชุด และ incremental 20 GB/วัน — ค่าทั้งหมดต้องวัดจริง
- Backup เป็นระบบใหม่: Repository แยกจาก Production storage/สิทธิ์ผู้ดูแล พร้อมสำเนาอีก failure domain ซึ่งยังไม่รวมความจุในยอดนี้; OS ของ Backup ต้องยืนยันหลังเลือกผลิตภัณฑ์

## ตารางกรณีตัวอย่าง 9 เดือน

| VM / บทบาท | OS ตัวอย่าง | vCPU | RAM GiB | OS GB | Data GB | GPU |
|---|---|---:|---:|---:|---:|---|
| VM-01 Reverse Proxy / TLS | Ubuntu Server 24.04 LTS | 2 | 4 | 60 | 0 | — |
| VM-02 Captive Portal Web | Ubuntu Server 24.04 LTS | 4 | 8 | 80 | 0 | — |
| VM-03 Wi-Fi Tools / API | Ubuntu Server 24.04 LTS | 4 | 8 | 100 | 0 | — |
| VM-04 RADIUS Manager | Ubuntu Server 24.04 LTS * | 4 | 8 | 80 | 20 | — |
| VM-05 FreeRADIUS / AAA | Ubuntu Server 24.04 LTS * | 4 | 8 | 60 | 20 | — |
| VM-06 Database | Windows Server 2022 * | 8 | 64 | 100 | 1,200 | — |
| VM-07 Media / File Service | Ubuntu Server 24.04 LTS | 8 | 16 | 80 | 4,000 | — |
| VM-08 Report / Scheduler / Notification | Ubuntu Server 24.04 LTS | 4 | 8 | 80 | 120 | — |
| VM-09 AI Orchestrator | Ubuntu Server 24.04 LTS | 8 | 16 | 80 | 200 | — |
| VM-10 Monitoring / Central Logs | Ubuntu Server 24.04 LTS | 8 | 32 | 100 | 4,000 | — |
| VM-11 Backup / Restore | Ubuntu Server 24.04 LTS * | 8 | 16 | 80 | 60,000 | — |
| VM-12 Local AI Inference / GPU | Ubuntu Server 24.04 LTS * | 16 | 128 | 100 | 1,000 | 1 × 48 GB VRAM |

**รวม 12 VM · 78 vCPU · RAM 316 GiB · GPU 1 ใบ VRAM 48 GB · Disk 71,560 GB**

Disk แยกเป็น OS 1,000 GB + ข้อมูลบริการ 10,560 GB + Backup repository ใหม่ 60,000 GB เป็นงบ usable capacity ยังไม่รวม raw disk/RAID, สำเนาที่สอง, Hypervisor overhead และ HA/DR; RAM รวมไม่รวม VRAM

## เปรียบเทียบพื้นที่ 6/9 เดือน

| ช่วง | Log คำนวณ/งบ GB | Media คำนวณ/งบ GB | Backup คำนวณ/งบ usable GB | Full / Incremental |
|---|---:|---:|---:|---|
| 6 เดือน ≈ 180 วัน | 2,340 / 3,000 | 2,470 / 3,000 | 41,860 / 50,000 | 7 Full + 210 วัน |
| 9 เดือน ≈ 270 วัน | 3,510 / 4,000 | 3,055 / 4,000 | 59,800 / 60,000 | 10 Full + 300 วัน |

## ที่มาและข้อจำกัดในการคำนวณ

- CPU/RAM/GPU ในตารางเป็นงบ PoC/ประเมิน ไม่ใช่ขั้นต่ำจากผู้ผลิตหรือผล Load Test; RAM ไม่สามารถใช้แทน GPU VRAM ในการประเมินได้โดยตรง
- Local AI: ต้องเลือก Model/quantization/context/concurrency แล้ววัด latency และ tokens/sec ก่อนล็อก GPU; รองรับฟังก์ชันสร้าง Config และวิเคราะห์ข้อความ ไม่ได้สมมติว่าต้องวิเคราะห์เนื้อหาวิดีโอ
- Log capacity = GB ดิบ/วัน × วัน × storage/index factor × 1.3; ที่ 5 GB/วันและ factor 2: 6 เดือน 2,340 GB / 9 เดือน 3,510 GB; หาก 20 GB/วันจะเป็น 9,360 / 14,040 GB แทน
- กรณีนี้ให้ค้น Log ทั้งช่วงจาก SSD; หากแยก Hot 30–90 วัน กับ Archive จนครบ 9 เดือน ต้องกำหนดเวลาค้น/นำกลับมาอ่านและปรับแผน Storage ใหม่ โดยไม่ลด Retention เงียบ ๆ
- Media capacity = (ข้อมูลเริ่มต้น + การเพิ่มสุทธิ/วัน × วัน) × 1.3: 6 เดือน 2,470 GB / 9 เดือน 3,055 GB การเพิ่มสุทธิต้องรวมไฟล์เก่า, version และไฟล์แปลงที่เก็บจริง
- Video bandwidth = จำนวนคนดูพร้อมกัน × bitrate; ตัวอย่าง 500 × 2 Mbps = 1 Gbps ก่อน overhead งบ 10 GbE สำหรับ Media/Storage ไม่ได้ยืนยันว่า uplink ทุก Site รองรับ และไม่ได้รวมการแปลงวิดีโอ
- Backup usable = (ขนาด Full × จำนวน Full + ขนาด Incremental/วัน × จำนวนวันที่เก็บจริงใน chain) × 1.3; สมมติไม่มี compression/dedup saving และ Full แต่ละชุดไม่เกิน 4 TB
- เผื่อ boundary chain เพิ่ม Full 1 ชุดและ Incremental 30 วัน: 6 เดือน (4,000×7 + 20×210)×1.3 = 41,860 GB; 9 เดือน (4,000×10 + 20×300)×1.3 = 59,800 GB ต้องคำนวณตาม retention engine ที่เลือกจริง
- หากต้องการรายวันเพียง 30 วัน + รายเดือน 9 เดือน ตัวอย่างพื้นที่จะลดลงได้; ต้องตกลง restore granularity ก่อนออกแบบนโยบายจริง ไม่เท่ากับย้อนคืนได้ทุกวันตลอด 9 เดือน
- Full Backup 4 TB เป็นขนาดข้อมูลที่เลือกสำรองจริง ไม่ใช่ผลรวมความจุ Disk VM; ต้องรวม DB/Media/Config/Raw logs และข้อมูล AI ที่สร้างเองตามขอบเขต หากสำรอง VM image/Log index ซ้ำต้องเพิ่มขนาด Full; ห้ามสำรอง repository กลับเข้าตัวเอง
- ทดสอบ application-consistent backup ของ DB, การกู้คืนและเวลาที่ใช้; Snapshot/สำเนาบน datastore เดียวไม่ใช่สำเนาแยกความเสียหาย; พื้นที่รุ่น 9 เดือน 60 TB สำหรับสำเนาหลักหนึ่งชุด ยังไม่รวมสำเนาที่สอง
- Disk GB/TB ใช้ฐานสิบ RAM GiB; Repository usable ไม่เท่ากับ raw disk หลัง RAID; ยอดรวมยังไม่รวม Hypervisor overhead, RAID, VM snapshot และ HA/DR
- Backup ใหม่และ Media มาก: ตรวจ throughput ของ Storage/10 GbE กับ backup window และ RTO; การจัดสรร vCPU ไม่ใช่จำนวน Physical core ของ Host

## HA และความต่อเนื่อง

- ส่วนที่จะทำซ้ำตามเป้าหมาย Availability: Reverse Proxy, Portal, Tools/API, RADIUS และ Database
- Database ต้องออกแบบ replication, quorum/witness และ failover ตาม Engine/Edition จริง รวมทั้งการเก็บ Session และการ retry ของแอป
- Media, Queue/Scheduler, Monitoring และ Backup ต้องมีแผนความต่อเนื่องด้วย ไม่ถือว่าไม่มีจุดล้มเหลวเดียวจากการเพิ่ม Web/RADIUS เท่านั้น
- กำหนด RPO/RTO และกระจาย VM ข้าม Host/Storage failure domain ก่อนสรุปจำนวน VM แบบ HA; แผนนี้ยังไม่คำนวณจำนวน HA
- Local AI Inference ยังมี GPU node เดียว; ออกแบบให้ AI ล่มแล้ว Manual Config และ Portal Login ทำงานต่อได้ การทำ GPU redundancy จะเพิ่มเครื่องและ GPU ไม่อยู่ในยอดนี้

## สิ่งที่ยังไม่รวม

- ไม่รวม Physical Host, raw disk/RAID, GPU chassis/power/cooling, Hypervisor และ License; มี GPU budget 1 ใบ แต่ต้องตรวจความเข้ากันได้ก่อนจัดซื้อ
- ไม่รวม HA/DR replicas, staging/UAT, Backup copy ที่สอง/Off-site, dedicated Vector DB/Queue หรือ transcoding worker ซึ่งต้องพิจารณาตามโหลดจริง
- ไม่รวม Training/Fine-tuning หรือ AI วิเคราะห์ภาพ/วิดีโอ; แผนนี้เป็น Local LLM inference สำหรับข้อความและ Tools
- SMS, ThaiD, Social Login, Payment และ Email ปลายทางยังเป็น integration ภายนอกตามการเลือกใช้งาน; Local AI ไม่ได้ทำให้บริการเหล่านี้ทำงานออฟไลน์โดยอัตโนมัติ
- ยังไม่ยืนยัน OS ของ RADIUS Manager, Driver, Backup product, GPU Host/Hypervisor หรือรุ่น LLM; ทุกส่วนในหน้าเว็บยังเป็นต้นแบบข้อมูลจำลอง

## รายละเอียดรายเครื่อง

- **VM-01 Reverse Proxy / TLS**: แยก Public endpoint กับ Admin endpoint; วาง Admin หลังเครือข่ายจัดการ
- **VM-02 Captive Portal Web**: รับ Portal Redirect; ไม่ใช่ Gateway ที่รับส่งทราฟฟิกอินเทอร์เน็ตทั้งหมด
- **VM-03 Wi-Fi Tools / API**: เรียก RADIUS Manager เพื่ออ่าน Site / Allow Package; Tools ไม่แก้ Package โดยตรง
- **VM-04 RADIUS Manager**: * OS ตัวอย่าง ต้องยืนยันรุ่น/License/API และการแยก App ออกจาก DB กับผู้พัฒนา RADIUS Manager
- **VM-05 FreeRADIUS / AAA**: * ต้องตรวจ FreeRADIUS, SQL driver และ Vendor Attributes กับรุ่นจริงก่อนติดตั้ง
- **VM-06 Database**: งบขยายสำหรับ Accounting/Report: Data 800 + Transaction log 200 + TempDB 200 GB ไม่รับรองเก็บได้ 9 เดือน ต้องวัดการเติบโต DB แยกจาก Central Log; SQL Server/OS/License รอยืนยัน
- **VM-07 Media / File Service**: ตัวอย่าง (1,000 GB + 5 GB/วัน × 270 วัน) × 1.3 = 3,055 GB จัด Data 4,000 GB; ไม่รวม transcoding worker; 500 ผู้ชม × 2 Mbps = 1 Gbps ก่อน overhead จึงให้งบ uplink ภายใน 10 GbE และตรวจเส้นทางก่อน Login
- **VM-08 Report / Scheduler / Notification**: แยกงานหนักจาก Login API; Job queue ใช้ DB ในแผนตั้งต้น มี retry และป้องกันงานส่งซ้ำ
- **VM-09 AI Orchestrator**: เรียก VM-12 ภายในองค์กร ปิด Cloud fallback/telemetry ที่ส่งข้อมูลออก; เก็บเอกสาร/embedding index ขนาด PoC ภายใน VM นี้ ต้องแยกบริการเพิ่มเมื่อวัดภาระจริงแล้ว; ยังไม่เชื่อม Local AI ในต้นแบบ
- **VM-10 Monitoring / Central Logs**: สมมติ Log 5 GB/วัน × 270 วัน × index factor 2 × เผื่อ 1.3 = 3,510 GB จัด Data 4,000 GB; factor 2 รวม raw+index ในตัวอย่าง ไม่รวม replica; ข้อมูลที่ parse/encode ต่างกันต้องวัด factor ใหม่
- **VM-11 Backup / Restore**: สร้างใหม่; 60,000 GB เป็น usable repository budget สำหรับตัวอย่าง Full 4 TB และ Incremental 20 GB/วัน ไม่ใช่ raw disk และไม่รับรองขนาดจริง; ต้องเผื่อ RAID/RAID rebuild และสำเนาที่สองแยกต่างหาก; OS/Repo architecture ขึ้นกับผลิตภัณฑ์ ไม่จำเป็นต้องเป็น VMDK เดียว 60 TB
- **VM-12 Local AI Inference / GPU**: งบทดลอง GPU 1 ใบ VRAM 48 GB ไม่ใช่การรับรองโมเดล/ความเร็ว; ตรวจ Host, GPU, Hypervisor, passthrough/vGPU, License, Driver/CUDA และ runtime ก่อนเลือกซื้อ; ติดตั้ง Model/Tokenizer/Embedding ที่ต้องใช้ไว้ภายในและทดสอบตัดอินเทอร์เน็ต

## โมดูลและ VM ที่รองรับ

| โมดูล | VM | สถานะ |
|---|---|---|
| Portal Configuration / CMS | VM-02, VM-03, VM-07 | มี GUI / Preview; รอ Backend และการเผยแพร่ Portal |
| RADIUS AAA / Policy | VM-05, VM-04, VM-06 | รอเชื่อม RADIUS จริงและทดสอบราย Vendor |
| RADIUS Manager Integration | VM-03, VM-04, VM-06 | มี Snapshot ตัวอย่าง; รอ API/Schema จาก Manager |
| Identity / Login Connectors | VM-02, VM-03, VM-06 | GUI ตัวอย่าง; รอ Provider และการเชื่อมต่อ |
| Free WiFi / Coupon | VM-03, VM-05, VM-06 | มีคูปองตัวอย่าง; รอ Session จริง |
| Terms / Consent / Language | VM-02, VM-03, VM-06 | มี Editor/Preview; รอการจัดเก็บ Consent จริง |
| Video / Questionnaire / Quiz | VM-02, VM-03, VM-07, VM-06 | มี Preview/Config; ยังไม่บันทึกผลตอบจริง |
| Multi-site / Tenant / RBAC | VM-03, VM-06 | มีสิทธิ์จำลอง; Backend ต้องตรวจทุก request |
| AP / Vendor Adapter | VM-03, VM-05, VM-10 | มีข้อมูลตัวอย่าง; ต้องทดสอบแต่ละรุ่น/firmware |
| Dashboard / Real-time Monitor | VM-03, VM-10, VM-06 | มี Dashboard ตัวอย่าง; รอข้อมูลจริง |
| Reports / Export / Monthly Email | VM-08, VM-06, VM-03 | CSV/PDF ตัวอย่าง; ยังไม่มี Scheduler/SMTP จริง |
| Notification Channels | VM-03, VM-08, VM-10 | มีฟอร์ม; ยังไม่ส่งแจ้งเตือนจริง |
| Audit / Retention / Privacy | VM-06, VM-10, VM-03 | แผน Backend และ Retention ตามข้อกำหนดจริง |
| AI Portal / Config Assistant | VM-09, VM-03, VM-12 | แผน Local AI ภายในองค์กร; รอเลือกโมเดล/PoC และ Internal API จริง |
| AI Policy / AP Assistant | VM-09, VM-03, VM-04, VM-12 | แผน Local AI ภายในองค์กร; รอเลือกโมเดล/PoC และ Internal API จริง |
| AI Reports / Dashboard / Troubleshooting | VM-09, VM-08, VM-10, VM-03, VM-12 | แผน Local AI ภายในองค์กร; รอเลือกโมเดล/PoC และ Internal API จริง |
| Backup / Restore / DR | VM-11, VM-06, VM-07 | แผนระบบ; ยังไม่มีการสำรองข้อมูลจริงจาก GUI |
| High Availability | VM-01, VM-02, VM-03, VM-05, VM-06, VM-07, VM-08 | เป็นข้อกำหนดออกแบบต่อ; แผน 12 VM นี้ยังไม่ใช่ HA |
| Heatmap / RF / Traffic Analysis | VM-03, VM-10, VM-09 | รอ Telemetry, ตำแหน่ง AP และสิทธิ์ข้อมูล |
| Payment / Billing | VM-03, VM-08, VM-06 | ขอบเขตต่อยอด; รอระบบชำระเงินจริง |

## ข้อมูลที่ต้องยืนยันก่อนล็อกสเปก

1. Log กี่ GB/วัน และต้องค้นทันทีทั้ง 9 เดือนหรือยอมรับ Archive ได้
2. วิดีโอรวมกี่ GB เพิ่มต่อเดือนเท่าไร bitrate และคนดูพร้อมกันเท่าไร
3. Full Backup จริงกี่ TB, daily change เท่าไร และต้องย้อนรายวันทั้ง 9 เดือนหรือ Daily 30 วัน + Monthly 9 เดือน
4. งาน AI/โมเดล/ภาษา/context/ผู้ใช้พร้อมกัน รวมถึงรุ่น Host, GPU และ Hypervisor; เป้าหมาย RPO/RTO และ HA

## แหล่งอ้างอิง

ตัวเลขจัดสรรเป็นข้อเสนอจากสมมติฐานของแบบนี้ แหล่งอ้างอิงไม่รับรองว่ารองรับโหลดจริงของโครงการ

- [Ubuntu lifecycle — 24.04 LTS มี Standard security maintenance ถึง May 2029](https://ubuntu.com/about/release-cycle) — ยืนยันวงจรสนับสนุน OS เท่านั้น ไม่ใช่การรับรองแอป RADIUS Manager
- [Microsoft — SQL Server 2022 hardware / software requirements](https://learn.microsoft.com/en-us/sql/sql-server/install/hardware-and-software-requirements-for-installing-sql-server-2022?view=sql-server-ver16) — ยืนยันว่า SQL Server 2022 รองรับ Windows Server 2022; CPU/RAM/Disk ของโครงการนี้เป็นค่าประมาณที่เสนอ ไม่ใช่ minimum จาก Microsoft
- [vLLM — Optimization and Tuning](https://docs.vllm.ai/en/stable/configuration/optimization/) — GPU memory, KV cache และ concurrency มีผลต่อ serving; ใช้ประกอบการวาง PoC ไม่ได้ยืนยันสเปกนี้
- [NVIDIA L40S — ตัวอย่าง GPU VRAM 48 GB](https://www.nvidia.com/en-gb/data-center/l40s/) — ยืนยันว่ามี GPU ประเภทนี้ ไม่ใช่การเลือกยี่ห้อ/รุ่นจัดซื้อหรือยืนยันความเข้ากันได้กับ Host
- [NVIDIA Container Toolkit — Installation](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) — ต้องมี NVIDIA Driver และตั้งค่า runtime ให้เข้าถึง GPU; ต้องตรึงรุ่นจริงก่อนติดตั้ง
- [Veeam — Forward Incremental Retention](https://helpcenter.veeam.com/docs/vbr/userguide/retention_incremental.html) — ตัวอย่างการเก็บ chain เกิน retention window เพื่อรักษาการกู้คืน ไม่ได้เลือก Veeam เป็นผลิตภัณฑ์ของโครงการ
