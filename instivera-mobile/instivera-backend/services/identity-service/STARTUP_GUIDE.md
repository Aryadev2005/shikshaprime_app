#!/usr/bin/env bash

# ===================================================
# Identity Service - Phase 1 Startup & Testing Guide
# ===================================================

cat << "EOF"

╔════════════════════════════════════════════════════╗
║   Identity Service - Phase 1 Implementation        ║
║   Complete & Ready for Testing                     ║
╚════════════════════════════════════════════════════╝

WHAT'S BEEN BUILT:
─────────────────────────────────────────────────────

✅ 5 Database Models (Sequelize ORM)
   • users (tenant-specific)
   • teachers (tenant-specific)
   • students (tenant-specific)
   • otp_requests (tenant-specific)
   • institutions (GLOBAL, non-tenant)

✅ 4 Services with Business Logic
   • authService.ts - Login, email validation, password change
   • otpService.ts - OTP generation/verification with bcrypt
   • profileService.ts - Role-based profile retrieval
   • institutionService.ts - Global institutions listing

✅ 3 Controllers with HTTP Handlers
   • authController.ts - 4 endpoints
   • profileController.ts - 1 endpoint
   • institutionController.ts - 2 endpoints

✅ 3 Route Groups
   • /api/auth/* - Public login/OTP flow
   • /api/profile/* - Protected profile access
   • /api/institutions/* - Public institution data

✅ 2 Middleware Layers
   • auth-middleware.ts - JWT verification & role checking
   • error-middleware.ts - Global exception handler

✅ All utilities, types, config, and database setup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK START:
─────────────────────────────────────────────────────

1. PREREQUISITES
   ✓ Node.js 16+ installed
   ✓ PostgreSQL 12+ running on localhost:5432
   ✓ npm packages installed

2. CREATE DATABASE
   $ createdb identity_service
   
   Tables will auto-create on first run!

3. CONFIGURE ENVIRONMENT
   $ cat .env.development
   
   Edit if needed (DATABASE, JWT_SECRET, EMAIL config)

4. START SERVER
   $ npm run dev
   
   Watch for: "✅ Identity Service listening on port 3001"

5. LOAD TEST DATA (Optional)
   $ psql -U postgres -d identity_service -f seed.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TESTING THE API:
─────────────────────────────────────────────────────

Option A: Run Automated Tests
   $ chmod +x test.sh
   $ ./test.sh

Option B: Manual Testing with curl

   1. Check Health
      $ curl http://localhost:3001/api/health

   2. List Institutions
      $ curl http://localhost:3001/api/institutions

   3. Validate Email
      $ curl -X POST http://localhost:3001/api/auth/validate-email \
        -H "Content-Type: application/json" \
        -d '{"email":"teacher1@test.com"}'

   4. Send OTP
      $ curl -X POST http://localhost:3001/api/auth/send-otp \
        -H "Content-Type: application/json" \
        -d '{"email":"teacher1@test.com"}'
      
      → Check console for OTP value (dev mode)
      → Example: "🧪 DEV OTP for teacher1@test.com: 123456"

   5. Verify OTP
      $ curl -X POST http://localhost:3001/api/auth/verify-otp \
        -H "Content-Type: application/json" \
        -d '{"email":"teacher1@test.com","otp":"123456"}'

   6. Login
      $ curl -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"teacher1","password":"password123"}'
      
      → Extract "token" from response

   7. Get Profile (with token)
      $ curl http://localhost:3001/api/profile/me \
        -H "Authorization: Bearer <TOKEN_FROM_STEP_6>"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST CREDENTIALS (from seed.sql):
─────────────────────────────────────────────────────

Teacher:
  username: teacher1
  email: teacher1@test.com
  password: password123
  user_code: T001

Student:
  username: student1
  email: student1@test.com
  password: password123
  user_code: S001

Admin:
  username: admin1
  email: admin1@test.com
  password: password123
  user_code: A001

All passwords are "password123"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY FEATURES IMPLEMENTED:
─────────────────────────────────────────────────────

✅ JWT Authentication
   • 60-day token expiry (matches 2-month logout requirement)
   • Payload: user_id, username, role, user_type, user_code, email
   • Verified on /api/profile/me endpoint

✅ OTP Workflow
   • 6-digit random OTP
   • Bcrypt hashed in database
   • 10-minute expiry
   • Max 3 verification attempts
   • Rate limited to 1 OTP per 60 seconds

✅ Email Sending
   • Via Nodemailer + ZeptoMail SMTP
   • Dev mode: OTP logged to console if EMAIL_PASS not set
   • Production: Sends real emails

✅ Multi-Tenant Ready
   • getTenantModels(sequelize) - tenant tables
   • getGlobalModels(sequelize) - shared tables
   • Tenant ID propagated through requests

✅ Error Handling
   • Custom AppError class
   • Global error middleware
   • Consistent response format

✅ Database
   • PostgreSQL with Sequelize ORM
   • Auto-sync tables on startup
   • Prepared for production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API ENDPOINTS:
─────────────────────────────────────────────────────

PUBLIC ENDPOINTS (no auth required):
  POST   /api/auth/login          - Login with username/password
  POST   /api/auth/validate-email - Check if email exists
  POST   /api/auth/send-otp       - Send OTP to email
  POST   /api/auth/verify-otp     - Verify OTP code
  GET    /api/institutions        - List institutions
  GET    /api/institutions/:slug  - Get institution by slug
  GET    /api/health              - Health check

PROTECTED ENDPOINTS (require JWT):
  GET    /api/profile/me          - Get current user profile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSE FORMAT:
─────────────────────────────────────────────────────

SUCCESS:
{
  "status": 1,
  "data": { ... },
  "message": "Operation successful"
}

ERROR:
{
  "status": 0,
  "data": null,
  "message": "Error description"
}

Common HTTP Status Codes:
  • 200 - Success
  • 400 - Bad Request (validation error)
  • 401 - Unauthorized (invalid credentials, expired token)
  • 404 - Not Found
  • 429 - Too Many Requests (OTP rate limit)
  • 500 - Internal Server Error

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCUMENTATION:
─────────────────────────────────────────────────────

📄 README.md                 - Project overview & setup
📄 API.md                    - Complete endpoint documentation
📄 PHASE1_CHECKLIST.md       - Implementation checklist
📄 seed.sql                  - Test data SQL script
📄 test.sh                   - Automated test suite

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTEGRATION WITH BFF:
─────────────────────────────────────────────────────

The BFF (instivera-mobile/backend) can now call identity-service:

// From auth.service.ts in BFF:
const identityUrl = 'http://localhost:3001/api';

// Call login
POST ${identityUrl}/auth/login
→ Returns JWT token & user data

// Call send-otp
POST ${identityUrl}/auth/send-otp
→ Sends OTP to email

// Call verify-otp
POST ${identityUrl}/auth/verify-otp
→ Returns verified status

// Call get profile
GET ${identityUrl}/profile/me
→ Returns user profile

All responses follow { status: 1|0, data, message } format!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TROUBLESHOOTING:
─────────────────────────────────────────────────────

❌ "Port 3001 already in use"
   → Change PORT in .env.development

❌ "Cannot connect to PostgreSQL"
   → Check: psql -h localhost -U postgres
   → Start PostgreSQL if not running
   → Create database: createdb identity_service

❌ "OTP email not sending"
   → Check EMAIL_PASS is set in .env
   → In dev mode, check console for OTP output
   → Verify ZeptoMail API key is valid

❌ "Build errors"
   → Delete dist/ folder: rm -rf dist
   → Rebuild: npm run build

❌ "Tables not created"
   → Check database is connected
   → Look for sync logs in console output
   → Run seed.sql after tables created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS (Phase 2):
─────────────────────────────────────────────────────

1. API Gateway - Route requests to identity-service
2. Service-to-Service Communication - Add other microservices
3. Audit Logging - Log auth events
4. 2FA Support - Add SMS/TOTP
5. Session Management - Redis for token blacklisting
6. OAuth2 Integration - Support external identity providers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCTION CHECKLIST:
─────────────────────────────────────────────────────

□ Update JWT_SECRET in .env.production
□ Update EMAIL_PASS with production ZeptoMail key
□ Set NODE_ENV=production
□ Configure DB connection to production database
□ Set up SSL/TLS for HTTPS
□ Configure CORS for allowed origins
□ Set up logging & monitoring
□ Configure rate limiting
□ Set up backup strategy
□ Test load balancing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 All code mirrors shikshaprime_app patterns exactly
✅ Tests comprehensive without rework needed
🚀 Ready for Phase 2 integration

Generated: June 5, 2026
Status: COMPLETE & READY FOR TESTING ✅

═════════════════════════════════════════════════════

EOF

echo ""
echo "For detailed instructions, see README.md and API.md"
echo ""
