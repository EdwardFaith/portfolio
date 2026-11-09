@echo off
title sito - anteprima locale
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 goto con_node
where python >nul 2>nul
if %errorlevel%==0 goto con_python
echo.
echo  Non trovo ne Node.js ne Python su questo computer.
echo  Apri comunque index.html col doppio click: quasi tutto funziona,
echo  ma alcuni video e suoni non partono perche' il browser li blocca.
echo.
pause
exit /b 1

:con_node
node serve.js
goto fine

:con_python
echo  (uso Python: apro il browser, poi lascia questa finestra aperta)
start "" http://127.0.0.1:8000/
python -m http.server 8000

:fine
pause
