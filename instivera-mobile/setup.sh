#!/bin/bash

# INSTIVERA Mobile - Quick Setup Script
# This script sets up both backend and frontend for localhost testing

set -e

PROJECT_ROOT="/Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 INSTIVERA Mobile - Localhost Setup"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"
echo ""

# Backend Setup
echo "🔧 Setting up Backend..."
cd "$BACKEND_DIR"

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Service Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# Upstream Services
IDENTITY_SERVICE_URL=http://localhost:9050
STUDENT_SERVICE_URL=http://localhost:9051
PAYMENT_SERVICE_URL=http://localhost:9053
TEACHER_SERVICE_URL=http://localhost:9060
CHAT_SERVICE_URL=http://localhost:9055
FEES_SERVICE_URL=http://localhost:9056

# Logging
LOG_LEVEL=debug
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

if [ ! -d node_modules ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

echo "🏗️  Building backend..."
npm run build
echo "✅ Backend built successfully"
echo ""

# Frontend Setup
echo "🔧 Setting up Frontend..."
cd "$FRONTEND_DIR"

if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "========================================"
echo "🎯 Next Steps:"
echo "========================================"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd $BACKEND_DIR"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd $FRONTEND_DIR"
echo "  npm start"
echo "  Press 'w' for web, 'i' for iOS, 'a' for Android"
echo ""
echo "Terminal 3 (Optional) - Run Tests:"
echo "  cd $BACKEND_DIR"
echo "  npm run test:watch"
echo ""
echo "🌐 Access Points:"
echo "  Backend Health: http://localhost:4000/health"
echo "  Frontend Web:   http://localhost:19000"
echo "  Expo DevTools:  http://localhost:19000"
echo ""
echo "========================================"
