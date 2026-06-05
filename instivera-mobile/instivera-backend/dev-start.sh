#!/bin/bash
# Development startup — runs each service with ts-node-dev in background
echo "Starting all services in development mode..."
cd services/identity-service && npm run dev &
cd services/student-service  && npm run dev &
cd services/teacher-service  && npm run dev &
cd services/fees-service     && npm run dev &
cd services/payment-service  && npm run dev &
cd services/chat-service     && npm run dev &
cd services/notice-service   && npm run dev &
cd gateway                   && npm run dev &
echo "All services started. Use 'pkill -f ts-node-dev' to stop all."
wait
