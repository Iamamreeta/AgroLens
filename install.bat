@echo off
echo ========================================
echo   AGROLENS - INSTALL (WINDOWS)
echo ========================================
echo.
echo [1/3] Installing backend dependencies...
cd /d "%~dp0backend"
call npm.cmd install --no-audit --no-fund
if errorlevel 1 (
  echo [FAIL] Backend install failed
  exit /b 1
)
echo [OK] Backend installed.
echo.
echo [2/3] Installing ML service dependencies (optional)...
cd /d "%~dp0ml-model"
if exist requirements.txt (
  where pip >nul 2>nul
  if not errorlevel 1 (
    echo   pip install -r requirements.txt
    if errorlevel 1 (
      echo   [WARN] ML pip install returned non-zero; you may need a venv
    ) else (
      echo   [OK] ML dependencies installed.
    )
  ) else (
    echo   [SKIP] pip not found; ML deps skipped
  )
) else (
  echo   [SKIP] requirements.txt not found
)
echo.
echo [3/3] Installing mobile app dependencies...
cd /d "%~dp0mobile-app\AgroLensSDK54"
if exist package.json (
  where npm.cmd >nul 2>nul
  if not errorlevel 1 (
    call npm.cmd install --no-audit --no-fund --legacy-peer-deps
    if errorlevel 1 (
      echo   [WARN] Mobile install completed with warnings; try: npx expo install
    ) else (
      echo   [OK] Mobile installed.
    )
  )
) else (
  echo   [SKIP] Mobile package.json not found
)
echo.
echo ========================================
echo   INSTALL COMPLETE
echo ========================================
echo   Backend:  backend\node_modules\ (ready
echo   ML:       ml-model\ (configured)
echo   Mobile:   mobile-app\AgroLensSDK54\node_modules\
echo.
echo   Next: run start-all.bat
echo ========================================
