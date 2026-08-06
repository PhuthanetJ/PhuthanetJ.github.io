# Network Monitor Dashboard V3 — HTTP Ready

เวอร์ชันนี้ใช้ PRTG Public Map ผ่าน HTTP ตาม URL ที่ทดสอบแล้วว่าใช้งานได้

## URL ของ Map

```text
http://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2447&mapid=D85564DB-3F1D-4D10-8E21-99B0CA9B2D98
```

```text
http://rfcctv.fortiddns.com:8443/public/mapshow.htm?id=2506&mapid=26815356-D3C7-4522-91C0-80DB58E8FF69
```

## ข้อกำหนดสำคัญ

Dashboard ต้องเปิดผ่าน HTTP เช่น:

```text
http://192.168.1.10:8080/
```

ห้ามเปิดผ่าน GitHub Pages หรือ HTTPS URL เพราะ Browser จะบล็อก HTTP Map เป็น Mixed Content

## ทดสอบบน Windows

ดับเบิลคลิก:

```text
start-http-server.bat
```

จากนั้นเปิด:

```text
http://localhost:8080/
```

เครื่องอื่นใน LAN เปิดด้วย:

```text
http://IP-เครื่องที่รัน:8080/
```

## เปิดด้วย PowerShell

```powershell
cd "C:\path\to\Network Monitor Dashboard"
python -m http.server 8080 --bind 0.0.0.0
```

## Production

นำ `index.html`, `style.css` และ `app.js` ไปวางบน Apache, Nginx หรือ IIS
ที่ให้บริการผ่าน HTTP

ตัวอย่าง:

```text
http://monitor-server/network-monitor/
```

## หมายเหตุด้านความปลอดภัย

HTTP ไม่มีการเข้ารหัสข้อมูลระหว่างผู้ใช้และ Server
เหมาะสำหรับ Network ภายในหรือการใช้งานชั่วคราว
