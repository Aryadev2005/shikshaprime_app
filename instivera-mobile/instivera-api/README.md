# Instivera API

Consolidated mobile backend — replaces the 7-microservice architecture.

## Architecture

Mobile App → instivera-api (port 4000) → ShikshaPrime MySQL

All domain modules run in one Express process:
- `/auth` — Login, OTP, email validation
- `/profile` — Role-based profile (teacher/student)
- `/institutions` — Public institution listing
- `/student` — Student profile, attendance
- `/teacher` — Teacher profile, timetable, classes, attendance marking
- `/assignments` — Role-aware (teacher creates, student submits)
- `/repository` — Student file repository
- `/fees` — Fee dues, receipts, ledger
- `/payment` — PhonePe integration + webhooks
- `/chat` — REST + Socket.io real-time messaging
- `/notices` — Notice board
- `/registration` — Student self-registration (PUBLIC)

## Start

```bash
cd instivera-mobile/instivera-api
cp .env.example .env.development   # fill in DB_PASSWORD
npm install
npm run dev
```

Or use the launcher:
```bash
./dev-start.sh
```

## Port
4000 (same as the old gateway — no changes needed in the React Native frontend)

## Socket.io
Connect to `http://localhost:4000` with:
```js
io(url, {
  auth: { token: jwtToken, tenant: tenantId },
  transports: ['websocket', 'polling'],
})
```
