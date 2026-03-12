@echo off
title OCM Navigator - Server
echo.
echo  ========================================
echo   OCM Navigator - Change Management
echo  ========================================
echo.
echo  Starte Server auf Port 8080...
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo  Lokal:    http://localhost:8080/adesso-ocm-navigator_NEW6.html
echo  Netzwerk: http://%IP%:8080/adesso-ocm-navigator_NEW6.html
echo.
echo  Diesen Link an Kollegen im selben Netzwerk teilen!
echo  Server beenden: Ctrl+C oder Fenster schliessen
echo.
echo  ========================================
echo.

python -m http.server 8080

if errorlevel 1 (
    echo.
    echo  Python nicht gefunden. Versuche mit Node.js...
    npx serve . -l 8080
)

pause
