@echo off
REM Quick-start script for the Interactive Web Dashboard (Windows)
REM Perl-to-ODM Migration Demo

echo ==========================================
echo   Perl-to-ODM Interactive Dashboard
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "web_dashboard" (
    echo Error: web_dashboard directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Navigate to web_dashboard directory
cd web_dashboard

echo Starting local web server...
echo.

REM Try Python 3 first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python HTTP server
    echo Dashboard will be available at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Try Node.js http-server
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Node.js http-server
    echo Dashboard will be available at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npx http-server -p 8000
    goto :end
)

REM No suitable server found
echo Error: No suitable web server found!
echo.
echo Please install one of the following:
echo   - Python 3: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo Or use VS Code Live Server extension:
echo   1. Install 'Live Server' extension in VS Code
echo   2. Right-click on web_dashboard\index.html
echo   3. Select 'Open with Live Server'
echo.
pause
exit /b 1

:end

@REM Made with Bob
