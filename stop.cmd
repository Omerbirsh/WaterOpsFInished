@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$root=(Get-Location).Path; $pidFile=Join-Path $root '.waterops.pid'; $vite=Join-Path $root 'node_modules\vite\bin\vite.js';" ^
  "if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'WaterOps is already stopped.'; exit 0 };" ^
  "try { $saved=Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json; $pidValue=[int]$saved.pid } catch { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host 'Removed an unreadable WaterOps process record. No process was stopped.' -ForegroundColor Yellow; exit 0 };" ^
  "$running=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $pidValue) -ErrorAction SilentlyContinue; if (-not $running) { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host 'WaterOps was already stopped. Removed the stale process record.'; exit 0 };" ^
  "if (-not $running.CommandLine -or -not $running.CommandLine.Contains($vite)) { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host 'The recorded process no longer belongs to WaterOps. It was left running and the stale record was removed.' -ForegroundColor Yellow; exit 0 };" ^
  "& taskkill.exe /PID $pidValue /T /F | Out-Null; Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host 'WaterOps has been stopped.'"

if errorlevel 1 (
  echo WaterOps could not be stopped cleanly.
  pause
  exit /b 1
)

endlocal
