@echo off
title Vantage Dashboard Server
echo ===================================================
echo   Memulai Vantage Dashboard...
echo   Mohon biarkan jendela ini tetap terbuka.
echo ===================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
