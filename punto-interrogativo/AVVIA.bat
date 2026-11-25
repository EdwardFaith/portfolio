@echo off
title ?  -  proiezione
rem ============================================================
rem  ?  - installazione: accende la PROIEZIONE a schermo intero
rem  forzato (modalita' chiosco del browser).
rem  - il server parte ridotto a icona (non chiuderlo)
rem  - il browser si apre in chiosco: niente barre, niente F11,
rem    lo schermo intero resta anche premendo F5
rem  - per uscire: Alt+F4
rem ============================================================
set "PORTA=8090"
set "URL=http://localhost:%PORTA%/punto-interrogativo/index.html?mode=display&layout=split"
set "PROFILO=%TEMP%\punto-interrogativo-chiosco"

echo.
echo   accendo il server...
start "server ?" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\server.ps1" -NoOpen -Port %PORTA% -Root "%~dp0.." -Page punto-interrogativo/index.html
timeout /t 3 /nobreak >nul

rem  --use-fake-ui-for-media-stream: la telecamera viene concessa senza chiedere
rem  (nel chiosco la finestra del permesso coprirebbe la proiezione)
set "OPZ=--kiosk --no-first-run --user-data-dir="%PROFILO%" --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --overscroll-history-navigation=0 --disable-pinch"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" (
  echo   apro la proiezione in Chrome, a schermo intero. Per uscire: Alt+F4
  start "" "%CHROME%" %OPZ% "%URL%"
) else if exist "%EDGE%" (
  echo   apro la proiezione in Edge, a schermo intero. Per uscire: Alt+F4
  start "" "%EDGE%" %OPZ% --edge-kiosk-type=fullscreen "%URL%"
) else (
  echo   non trovo Chrome ne' Edge: la apro nel browser normale ^(premi F per lo schermo intero^).
  start "" "%URL%"
)
echo.
echo   il link per il telefono e' il QR sulla proiezione.
timeout /t 4 >nul
