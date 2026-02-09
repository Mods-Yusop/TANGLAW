@echo off
echo ========================================================
echo          TANGLAW ADMIN PIN REPAIR TOOL
echo ========================================================
echo.
echo This tool will reset the Admin PIN to: 024434
echo.
echo Please wait...
echo.

cd server
call npx ts-node prisma/revert_admin_pin.ts

echo.
echo ========================================================
echo          REPAIR COMPLETE!
echo ========================================================
echo Admin PIN is now: 024434
echo.
pause
