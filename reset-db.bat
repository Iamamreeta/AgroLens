@echo off
echo ========================================
echo   AGROLENS - RESET DATABASE (WINDOWS)
echo ========================================
echo WARNING: This will DESTROY all data.
choice /C YN /M "Continue?"
if errorlevel 2 exit /b 1
cd /d "%~dp0backend"
if not exist "node_modules" (
  echo [ERROR] node_modules missing. Run install.bat first.
  exit /b 1
)
echo.
echo [1/2] Undoing migrations...
call npm.cmd run migrate:undo
echo.
echo [2/3] Re-running migrations with DB_SYNC=force...
set DB_SYNC=force
call npm.cmd start
echo.
echo [3/3] Running seeders...
call npm.cmd run seed
echo.
echo ========================================
echo   DATABASE RESET COMPLETE
echo ========================================
