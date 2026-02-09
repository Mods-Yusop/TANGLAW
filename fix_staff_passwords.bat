@echo off
echo ========================================================
echo          TANGLAW STAFF PASSWORD REPAIR TOOL
echo ========================================================
echo.
echo This tool will reset ALL staff passwords to match the
echo credentials listed in "Accounts.xlsx".
echo.
echo Please wait...
echo.

cd server
call npx ts-node prisma/fix_all_staff_passwords.ts

echo.
echo ========================================================
echo          REPAIR COMPLETE!
echo ========================================================
echo All staff passwords have been synced.
echo.
pause
