# Instivera Backend — Microservices

## Architecture
Mobile App → Gateway (4000) → 7 microservices → ShikshaPrime MySQL

## Services
| Service          | Port | Description                        |
|------------------|------|------------------------------------|
| gateway          | 4000 | API gateway, proxy for all routes  |
| identity-service | 9050 | Auth, OTP, profiles, institutions  |
| student-service  | 9051 | Student data, attendance           |
| teacher-service  | 9060 | Teacher data, attendance marking   |
| fees-service     | 9056 | Fee dues, receipts, ledger         |
| payment-service  | 9053 | Payments, PhonePe integration      |
| chat-service     | 9055 | Messaging + Socket.io              |
| notice-service   | 9057 | Notices from ShikshaPrime          |

## Database
All services → ShikshaPrime MySQL at 69.62.84.110:3306
Database: shikshaprime_main

## JWT Secret
All 8 processes use the same JWT_SECRET: `mivdjh32hjfdgppkmdu8`

## Start (development)
```bash
./dev-start.sh
```

## Start (production with pm2)
```bash
./start-all.sh
```

## Stop (development)
```bash
pkill -f ts-node-dev
```
