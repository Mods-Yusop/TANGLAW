@echo off
echo Stopping TANGLAW POS...
echo This will kill all running Node.js processes.
taskkill /F /IM node.exe
echo.
echo Application stopped. You can close this window.
pause
