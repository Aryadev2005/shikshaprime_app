#!/bin/bash
echo "Starting all Instivera backend services..."
echo "All services connect to ShikshaPrime DB at 69.62.84.110"

# Build all services first
for service in identity-service student-service teacher-service fees-service payment-service chat-service notice-service; do
  echo "Building $service..."
  cd services/$service && npm install && npm run build && cd ../..
done

# Build gateway
echo "Building gateway..."
cd gateway && npm install && npm run build && cd ..

# Start with pm2 (if available) or background processes
if command -v pm2 &> /dev/null; then
  pm2 start services/identity-service/dist/server.js --name "identity-service"
  pm2 start services/student-service/dist/server.js  --name "student-service"
  pm2 start services/teacher-service/dist/server.js  --name "teacher-service"
  pm2 start services/fees-service/dist/server.js     --name "fees-service"
  pm2 start services/payment-service/dist/server.js  --name "payment-service"
  pm2 start services/chat-service/dist/server.js     --name "chat-service"
  pm2 start services/notice-service/dist/server.js   --name "notice-service"
  pm2 start gateway/dist/server.js                   --name "gateway"
  pm2 list
else
  echo "pm2 not found. Run: npm install -g pm2"
  echo "Then re-run this script."
fi
