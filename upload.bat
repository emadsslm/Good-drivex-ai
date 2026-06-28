@echo off
chcp 65001 > nul
echo # Good-drivex-ai > README.md
echo تطبيق ذكاء اصطناعي محادثه هاتف >> README.md
git add .
git commit -m "Auto-Update"
git push origin main
pause
