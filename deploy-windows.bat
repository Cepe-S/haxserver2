@echo off
echo 🚀 Starting Haxbotron V2 deployment for Windows...

REM Check Node.js version
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js >= 18.0.0
    exit /b 1
)

REM Check if PM2 is installed globally
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PM2 not found globally. Installing...
    npm install -g pm2
)

REM Clean and build
echo 🧹 Cleaning and building...
npm run build

REM Verify build outputs
echo 🔍 Verifying build outputs...
if not exist "core\dist\app.js" (
    echo ❌ Core build failed - app.js not found
    exit /b 1
)

if not exist "web\backend\dist\server.js" (
    echo ❌ Web backend build failed - server.js not found
    exit /b 1
)

if not exist "web\frontend\dist\index.html" (
    echo ❌ Frontend build failed - index.html not found
    exit /b 1
)

if not exist "database\dist\index.js" (
    echo ❌ Database build failed - index.js not found
    exit /b 1
)

echo ✅ Build verification passed

REM Create logs directory
if not exist "logs" mkdir logs

REM Stop existing PM2 processes
echo 🛑 Stopping existing processes...
pm2 delete ecosystem.config.js 2>nul

REM Start with PM2
echo 🎮 Starting Haxbotron with PM2...
npm run pm2:start

REM Show status
echo 📊 PM2 Status:
pm2 status

echo ✅ Deployment complete!
echo.
echo 📋 Available commands:
echo   npm run pm2:status   - Check process status
echo   npm run pm2:logs     - View logs
echo   npm run pm2:restart  - Restart processes
echo   npm run pm2:stop     - Stop processes
echo   npm run pm2:delete   - Delete processes
echo.
echo 🌐 Access points:
echo   Dashboard: http://localhost:3000
echo   Core API:  http://localhost:3001