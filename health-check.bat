@echo off
echo ========================================
echo   AGROLENS - HEALTH CHECK (WINDOWS)
echo ========================================
echo.
set BACKEND_URL=http://localhost:3000
set ML_URL=http://localhost:5001
if "%1"=="" ( set BACKEND_ARG=""
) else ( set BACKEND_URL=%~1
if "%2"=="" ( set ML_ARG=""
) else ( set ML_URL=%~2

echo [1/3] Backend health (%BACKEND_URL%)...
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%BACKEND_URL%/health' -TimeoutSec 6; Write-Host ('  Status: ' + $r.StatusCode + ' | ' + $r.Content) } catch { Write-Host '  [FAIL] ' $_.Exception.Message; exit 1 }"
echo.
echo [2/3] Backend API info (%BACKEND_URL%)...
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%BACKEND_URL%/api' -TimeoutSec 6; Write-Host ('  Status: ' + $r.StatusCode + ' | ' + $r.Content.Substring(0, [Math]::Min(200,$r.Content.Length))) } catch { Write-Host '  [FAIL] ' $_.Exception.Message }"
echo.
echo [3/3] ML service health (%ML_URL%)...
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%ML_URL%/health' -TimeoutSec 8; Write-Host ('  Status: ' + $r.StatusCode + ' | ' + $r.Content.Substring(0, [Math]::Min(200,$r.Content.Length))) } catch { Write-Host '  [FAIL] (try Render instead: https://agrolens-ml.onrender.com/health -> ' $_.Exception.Message }"
echo.
echo ========================================
echo   HEALTH CHECK COMPLETE
echo ========================================
