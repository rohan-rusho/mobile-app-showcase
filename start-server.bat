@echo off
title Mobile App Showcase - Server
cd /d "%~dp0"

node start-server.js

if errorlevel 1 (
    echo.
    echo [ERROR] Server terminated with an error.
)

echo.
pause
