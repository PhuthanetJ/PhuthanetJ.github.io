@echo off
REM เปิด Dashboard ผ่าน HTTP ที่ Port 8080
cd /d "%~dp0"
python -m http.server 8080 --bind 0.0.0.0
pause
