@echo off
setlocal enabledelayedexpansion
title RenovApp
cd /d "%~dp0"

set "PORT=4321"
set "URL=http://127.0.0.1:%PORT%"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js est introuvable.
  echo   Installez-le depuis https://nodejs.org puis relancez ce raccourci.
  echo.
  pause
  exit /b 1
)

set "NEEDS_INSTALL="
if not exist "node_modules\next" set "NEEDS_INSTALL=1"
rem node_modules can exist yet be incomplete (OneDrive drops files silently),
rem which makes the build fail on missing type declarations. Check a real file.
if not exist "node_modules\lucide-react\dist\lucide-react.d.ts" set "NEEDS_INSTALL=1"

if defined NEEDS_INSTALL (
  echo.
  echo   Installation des dependances ^(une seule fois, quelques minutes^)...
  echo.
  call npm install || goto :failed
)

rem Rebuild whenever the export is missing. Delete out\ to force a refresh.
if not exist "out\index.html" (
  echo.
  echo   Construction de l'application ^(quelques instants^)...
  echo.
  call npm run build || goto :failed
)

rem Already running? Just reopen the window.
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %PORT%); $c.Close(); exit 1 } catch { exit 0 }" >nul 2>nul
if errorlevel 1 (
  echo   RenovApp tourne deja, ouverture de la fenetre...
) else (
  start "RenovApp - serveur" /min cmd /c "node scripts\serve.mjs"
  rem Give the server a moment to bind the port.
  powershell -NoProfile -Command "Start-Sleep -Milliseconds 900" >nul 2>nul
)

rem Open in app mode (no address bar) when Chrome or Edge is available.
set "BROWSER="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
  if exist %%P if not defined BROWSER set "BROWSER=%%~P"
)

if defined BROWSER (
  start "" "!BROWSER!" --app=%URL% --window-size=1500,1000
) else (
  start "" %URL%
)

exit /b 0

:failed
echo.
echo   Echec. Lisez le message ci-dessus, puis relancez.
echo.
pause
exit /b 1
