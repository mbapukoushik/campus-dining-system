#!/bin/bash

# Break on error
set -e

echo "======================================================="
echo "   Campus Dining System - Automated Demo Setup"
echo "======================================================="
echo ""

echo "[1/4] Checking and Installing Dependencies..."
echo "      Installing backend dependencies..."
cd backend && npm install && cd ..

echo "      Installing frontend dependencies..."
cd frontend && npm install && cd ..
echo ""

echo "[2/4] Checking Environment Configuration..."
if [ ! -f "backend/.env" ]; then
    echo "      [!] backend/.env not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo ""
    echo "==================================================================="
    echo "                            WARNING"
    echo "==================================================================="
    echo "A new .env file was created in the backend folder."
    echo "The system REQUIRES Google OAuth credentials to run properly."
    echo "1. Open backend/.env in a text editor."
    echo "2. Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    echo "3. Save the file. Then press any key to continue."
    echo "==================================================================="
    read -n 1 -s -r -p ""
else
    echo "      backend/.env exists. Skipping copy."
fi
echo ""
echo ""

echo "[3/4] Starting Database Infrastructure (Docker)..."
docker compose up -d
echo "      Waiting 5 seconds for databases to initialize..."
sleep 5
echo ""

echo "[4/4] Seeding Database and Starting Servers..."
echo "      Starting backend server in background..."
cd backend
npm run seed
npm run dev &
BACKEND_PID=$!
cd ..

echo "      Starting frontend server in background..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================================="
echo "   Setup Complete! Application is starting up."
echo "   Dashboard: http://localhost:5173"
echo "======================================================="
echo "Press Ctrl+C to stop both servers."

# Trap SIGINT and terminate background jobs before exiting
trap "kill $BACKEND_PID $FRONTEND_PID; docker compose stop; exit" SIGINT

# Wait for background jobs to finish
wait
