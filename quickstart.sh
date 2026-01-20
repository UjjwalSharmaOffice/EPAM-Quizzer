#!/bin/bash

# EPAM Quizzer - Quick Start Script

echo "🚀 EPAM Quizzer - Starting both backend and frontend..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Start backend in background
echo "🔧 Starting backend server on http://localhost:3000"
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "🎨 Starting frontend server on http://localhost:8080"
echo ""
echo "Opening frontend in browser..."

cd frontend

# Try different methods to start HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
elif command -v npx &> /dev/null; then
    npx http-server -p 8080
else
    echo "❌ No HTTP server available. Install Python or Node.js"
    kill $BACKEND_PID
    exit 1
fi
