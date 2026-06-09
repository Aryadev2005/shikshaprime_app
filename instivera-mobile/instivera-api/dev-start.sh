#!/bin/bash
set -e

echo "=============================="
echo "  INSTIVERA API — Dev Server"
echo "=============================="

# Kill any process on port 4000
lsof -ti :4000 | xargs kill -9 2>/dev/null || true
echo "✅ Port 4000 cleared"

# Install deps if needed
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "🚀 Starting instivera-api on port 4000..."
npm run dev
