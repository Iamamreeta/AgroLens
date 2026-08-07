@echo off
echo ========================================
echo   AGROLENS - SEED DATABASE (WINDOWS)
echo ========================================
cd /d "%~dp0backend"
if not exist "node_modules" (
  echo [ERROR] node_modules missing. Run install.bat first.
  exit /b 1
)
echo.
echo [1/2] Running migrations...
set DB_SYNC=alter
call npm.cmd run migrate
echo.
echo [2/2] Running seeders...
call npm.cmd run seed
echo.
echo ========================================
echo   SEED COMPLETE
echo ========================================
