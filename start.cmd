@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo WaterOps could not start because Node.js is not installed or is not on PATH.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo WaterOps could not start because npm is not installed or is not on PATH.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Preparing WaterOps for first use...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check the message above and try again.
    pause
    exit /b 1
  )
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$root=(Get-Location).Path; $pidFile=Join-Path $root '.waterops.pid'; $logFile=Join-Path $root '.waterops.log'; $errorLog=Join-Path $root '.waterops.error.log'; $vite=Join-Path $root 'node_modules\vite\bin\vite.js'; $url='http://127.0.0.1:5173';" ^
  "if (Test-Path -LiteralPath $pidFile) { try { $saved=Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json; $running=Get-CimInstance Win32_Process -Filter ('ProcessId=' + [int]$saved.pid) -ErrorAction SilentlyContinue; if ($running -and $running.CommandLine -and $running.CommandLine.Contains($vite)) { Write-Host 'WaterOps is already running at' $url; if ($env:WATEROPS_NO_BROWSER -ne '1') { Start-Process $url }; exit 0 } } catch {}; Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue };" ^
  "$listener=Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if ($listener) { Write-Host 'Port 5173 is already in use. WaterOps did not stop or replace that process.' -ForegroundColor Yellow; exit 17 };" ^
  "$node=(Get-Command node).Source; $process=Start-Process -FilePath $node -ArgumentList @($vite,'--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $errorLog -PassThru; @{ pid=$process.Id; root=$root; startedAt=(Get-Date).ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8;" ^
  "$ready=$false; for ($attempt=0; $attempt -lt 40; $attempt++) { if (-not (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) { break }; try { $response=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { $ready=$true; break } } catch {}; Start-Sleep -Milliseconds 250 };" ^
  "if (-not $ready) { if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) { & taskkill.exe /PID $process.Id /T /F | Out-Null }; Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host 'WaterOps did not become ready. Review .waterops.log and .waterops.error.log for details.' -ForegroundColor Red; exit 18 }; Write-Host 'WaterOps is ready at' $url; if ($env:WATEROPS_NO_BROWSER -ne '1') { Start-Process $url }"

if errorlevel 1 (
  echo WaterOps was not started.
  pause
  exit /b 1
)

endlocal
