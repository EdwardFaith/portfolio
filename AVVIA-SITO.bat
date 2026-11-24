@echo off
title il sito
echo.
echo   il sito si accende sul computer (non chiudere questa finestra)...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Page index.html
pause
