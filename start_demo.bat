@echo off
setlocal

echo =======================================================
echo    Campus Dining System - Automated Demo Setup
echo =======================================================
echo.

echo [1/4] Checking and Installing Dependencies...
echo         Installing backend dependencies...
cd backend
call npm install
cd ..

echo         Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo [2/4] Checking Environment Configuration...
if not exist "backend\.env" (
    echo         [!] backend\.env not found. Copying from .env.example...
    copy backend\.env.example backend\.env
    echo.
    echo ===================================================================
    echo                             WARNING
    echo ===================================================================
    echo A new .env file was created in the backend folder.
    echo The system REQUIRES Google OAuth credentials to run properly.
    echo 1. Open backend\.env in a text editor.
    echo 2. Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
    echo 3. Save the file and press any key to continue.
    echo ===================================================================
    pause
) else (
    echo         backend\.env exists. Skipping copy.
)
echo.

echo [3/4] Starting Database Infrastructure (Docker)...
docker compose up -d
echo         Waiting 5 seconds for databases to initialize...
timeout /t 5 /nobreak >nul
echo.

echo [4/4] Seeding Database and Starting Servers...
echo         Starting backend server...
cd backend
start "Campus Dining - Backend Server" cmd /k "npm run seed && npm run dev"
cd ..

echo         Starting frontend server...
cd frontend
start "Campus Dining - Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo =======================================================
echo    Setup Complete! Application is starting up.
echo    Dashboard: http://localhost:5173
echo =======================================================
pause
