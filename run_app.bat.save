@echo off
echo Stopping previous instances...
taskkill /F /IM dotnet.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo Starting Magic Draw...
cd src\MagicDraw.AppHost
dotnet run
pause
