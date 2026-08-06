# เปิด Dashboard ผ่าน HTTP ที่ Port 8080
Set-Location $PSScriptRoot
python -m http.server 8080 --bind 0.0.0.0
