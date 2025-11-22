@echo off
echo 🚀 Wagu Website Server Starting...
echo.
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Error installing dependencies!
    pause
    exit /b 1
)
echo.
echo 🌐 Starting server...
echo 📱 Open your browser and go to: http://localhost:8080
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.
call npm start
if errorlevel 1 (
    echo ❌ Error starting server!
    pause
    exit /b 1
)
pause
