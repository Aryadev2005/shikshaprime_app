# Identity Service - Phase 1 Completion Checklist

## ✅ COMPLETED

### 1. Models (src/models/) ✅
- [x] `user.ts` - Users table (id, username, email, password_hash, role, user_type, user_code, is_active)
- [x] `teacher.ts` - Teachers table (id, teacher_id, first_name, last_name, email, phone, department_id, designation, profile_picture, employee_id, is_active)
- [x] `student.ts` - Students table (id, student_id, first_name, last_name, email, phone, class_id, program_id, roll_number, profile_picture, is_active)
- [x] `otp_request.ts` - OTP requests table (id, email, otp_hash, expires_at, attempts, is_used)
- [x] `institution.ts` - Institutions table GLOBAL (id, name, slug, type ENUM, logo_url, is_active)
- [x] `index.ts` - getTenantModels() + getGlobalModels()

### 2. Services (src/services/) ✅
- [x] `authService.ts`
  - [x] login(username, password, tenant) - bcrypt compare, JWT with 60-day expiry
  - [x] validateEmail(email, tenant) - check existence + return names
  - [x] changePassword(email, newPassword, tenant) - update password

- [x] `otpService.ts`
  - [x] sendEmailOtp(email, tenant) - generate, bcrypt hash, store, rate limit 60s
  - [x] verifyEmailOtp(email, otp, tenant) - hash compare, attempts (max 3), mark used

- [x] `profileService.ts`
  - [x] getProfile(userId, role, tenant) - role-based (teacher/student) profile fetch

- [x] `institutionService.ts`
  - [x] listInstitutions(type?) - query global institutions
  - [x] getInstitutionBySlug(slug) - fetch by slug

### 3. Controllers (src/controllers/) ✅
- [x] `authController.ts`
  - [x] makeLogin
  - [x] validateEmail
  - [x] sendEmailOtp
  - [x] verifyEmailOtp

- [x] `profileController.ts`
  - [x] getMyProfile (requireAuth middleware)

- [x] `institutionController.ts`
  - [x] getInstitutions (public)
  - [x] getInstitutionBySlug (public)

### 4. Routes (src/routes/) ✅
- [x] `auth.routes.ts` - POST /login, /validate-email, /send-otp, /verify-otp
- [x] `profile.routes.ts` - GET /me (requireAuth)
- [x] `institution.routes.ts` - GET /, /:slug
- [x] `index.ts` - setupRoutes() + /health + /api prefix

### 5. Middleware (src/middleware/) ✅
- [x] `auth-middleware.ts`
  - [x] authMiddleware - set tenant
  - [x] requireAuth - JWT verification
  - [x] requireRole(roles...) - role checking

- [x] `error-middleware.ts` - Global error handler

### 6. Utilities (src/utils/) ✅
- [x] `appError.ts` - Custom error class with static helpers
- [x] `jwt.ts` - generateToken, verifyToken with 60-day expiry
- [x] `emailService.ts` - sendOtpEmail via Nodemailer ZeptoMail
- [x] `responseHandler.ts` - sendSuccess, sendError helpers
- [x] `logger.ts` - Simple logger

### 7. Configuration & Database ✅
- [x] `config.ts` - All env vars (DB, JWT, Email)
- [x] `db.ts` - globalSequelize, getTenantSequelize(), initializeDatabase()
- [x] `server.ts` - Express app, routes, middleware, graceful shutdown
- [x] `types/index.ts` - Response interfaces

### 8. Environment Files ✅
- [x] `.env.development` - Dev configuration
- [x] `.env.production` - Prod configuration

### 9. Build & Dependencies ✅
- [x] `package.json` - All dependencies installed
  - express, sequelize, pg, nodemailer, bcryptjs, jsonwebtoken, dotenv
- [x] `tsconfig.json` - TypeScript configuration
- [x] Build succeeds with `npm run build` (0 errors)

### 10. Documentation ✅
- [x] `README.md` - Setup, architecture, troubleshooting
- [x] `API.md` - All endpoint documentation
- [x] `seed.sql` - Test data script
- [x] `test.sh` - Integration test script

### 11. Response Format ✅
- [x] All endpoints return: `{ status: 1|0, data: any, message: string }`
- [x] JWT payload: `{ user_id, username, role, user_type, user_code, email }`
- [x] Error handling via `next(error)` → error-middleware

### 12. Key Requirements ✅
- [x] JWT expiry: 60 days (matches "logout every 2 months")
- [x] OTP: 6-digit, hashed with bcrypt, 10-minute expiry, max 3 attempts
- [x] Multi-tenant design: getTenantModels() + getGlobalModels()
- [x] Global institutions table (non-tenant)
- [x] Email via ZeptoMail (same as shikshaprime)
- [x] Mirrors shikshaprime patterns exactly
- [x] /health endpoint preserved
- [x] No changes to instivera-mobile/backend BFF

---

## Usage

### Start Development
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/instivera-backend/services/identity-service
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Load Test Data
```bash
psql -U postgres -d identity_service -f seed.sql
```

### Run Tests
```bash
chmod +x test.sh
./test.sh
```

---

## BFF Integration (instivera-mobile/backend)

The BFF's auth.controller.ts expects these responses from `/api/auth/*` endpoints:

```typescript
// Login
POST /api/auth/login → { status, data: { user, token }, message }

// Validate Email
POST /api/auth/validate-email → { status, data: { exists, first_name?, last_name? }, message }

// Send OTP
POST /api/auth/send-otp → { status, data: { email, expiresIn }, message }

// Verify OTP
POST /api/auth/verify-otp → { status, data: { email, verified }, message }
```

All implemented and ready for BFF to consume.

---

## Database Tables Auto-Created

On first run, Sequelize will create:
- `users` (tenant-specific)
- `teachers` (tenant-specific)
- `students` (tenant-specific)
- `otp_requests` (tenant-specific)
- `institutions` (GLOBAL)

No manual SQL needed except for test data (seed.sql).

---

## Phase 2 Readiness

Phase 1 provides solid foundation for Phase 2:
- Multi-service integration via API Gateway
- Tenant isolation logic ready
- Error handling patterns established
- JWT authentication ready
- OTP workflow complete

---

## Notes

1. **Development Mode**: OTP sent to console if EMAIL_PASS not set
2. **Rate Limiting**: 60-second cooldown between OTP requests
3. **Password Reset**: Use /auth/send-otp → /auth/verify-otp → future /auth/change-password
4. **Admin Only**: Profile endpoint currently returns teacher/student data; in Phase 2, add admin check
5. **Tenant ID**: Currently hardcoded to 'default'; will be dynamic in Phase 2

---

Generated: June 5, 2026
Status: COMPLETE ✅
