@echo off
echo ========================================
echo   AGROLENS - START ALL SERVICES (WINDOWS)
echo ========================================
echo.
cd /d "%~dp0"
if not exist "backend\node_modules" (
  echo [ERROR] backend\node_modules missing. Run install.bat first.
  exit /b 1
)
echo [1/2] Starting ML service on port 5001 (background, if available)...
cd /d "%~dp0ml-model"
if exist "api\app.py" (
  where python >nul 2>nul
  if not errorlevel 1 (
    start "AgroLens-ML" cmd /c "cd /d %~dp0ml-model ^&^& python -m uvicorn api.app:app --host 0.0.0.0 --port 5001 --reload
  ) else (
    echo   [SKIP] python not found; use Render ML https://agrolens-ml.onrender.com
  )
)
echo.
timeout /t 3 /nobreak >nul
echo [2/2] Starting backend Express API on port 3000...
cd /d "%~dp0backend"
echo   Backend URL: http://localhost:3000
echo   API root:  http://localhost:3000/api
echo   Health:    http://localhost:3000/health
echo.
echo   Close this terminal or Ctrl-C to stop backend.
echo ========================================
call npm.cmd start
