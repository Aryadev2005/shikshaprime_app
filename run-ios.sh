#!/bin/bash
set -e

echo "======================================"
echo "  INSTIVERA — iOS Simulator Launcher"
echo "======================================"

# Check Xcode
if ! xcode-select -p &>/dev/null; then
  echo "❌ Xcode not found. Install it from the Mac App Store."
  exit 1
fi
echo "✅ Xcode found: $(xcode-select -p)"

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found."
  exit 1
fi
echo "✅ Node.js: $(node -v)"

# Check CocoaPods
if ! command -v pod &>/dev/null; then
  echo "❌ CocoaPods not found. Run: sudo gem install cocoapods"
  exit 1
fi
echo "✅ CocoaPods: $(pod --version)"

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/instivera-api"

# Check for .env files
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo ""
  echo "⚠️  No .env file found in instivera-api. Creating from example..."
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "✅ Created .env from .env.example"
    echo "   Please fill in real values in $BACKEND_DIR/.env"
  else
    echo "❌ No .env.example found either. Create $BACKEND_DIR/.env manually."
    exit 1
  fi
fi
lsof -ti :4000 | xargs kill -9 2>/dev/null || true
# Start instivera-api in background
echo ""
echo "🚀 Starting instivera-api on port 4000..."
cd "$BACKEND_DIR"
npm install --silent
npx ts-node --transpile-only src/server.ts &
API_PID=$!
echo "✅ instivera-api started (PID: $API_PID)"

# Trap to kill API on exit
trap "echo ''; echo '🛑 Stopping instivera-api...'; kill $API_PID 2>/dev/null; exit" INT TERM

# Wait for gateway to be ready
echo "⏳ Waiting for gateway to start..."
for i in {1..10}; do
  if curl -s http://127.0.0.1:4000/health > /dev/null 2>&1; then
    echo "✅ instivera-api is ready"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "❌ instivera-api did not start. Check logs above."
    kill $API_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Install frontend deps if needed
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Run prebuild if /ios doesn't exist
if [ ! -d ios ]; then
  echo "🔨 Running expo prebuild for iOS..."
  npx expo prebuild --platform ios --clean
  echo "✅ iOS project generated"
fi

# Install Pods if not done
if [ ! -d ios/Pods ]; then
  echo "📦 Installing CocoaPods..."
  cd ios && LANG=en_US.UTF-8 pod install && cd ..
  echo "✅ CocoaPods installed"
fi

# Launch on iOS simulator
echo ""
echo "📱 Launching on iOS Simulator..."
echo "   (If no simulator opens, open Simulator.app manually first)"
echo ""
npx expo run:ios
