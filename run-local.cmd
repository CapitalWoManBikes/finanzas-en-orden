@echo off
cd /d "%~dp0"
echo Iniciando Finanzas en Orden...
echo.
"C:\Program Files\nodejs\npm.cmd" run dev -- --host 127.0.0.1 --port 5173 --strictPort
echo.
echo El servidor se detuvo. Presiona una tecla para cerrar.
pause >nul
