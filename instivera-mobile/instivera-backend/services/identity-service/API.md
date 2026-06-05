# Identity Service - Phase 1

## Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=identity_service
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=60d

# Email (ZeptoMail)
EMAIL_SERVICE=zeptomail
EMAIL_HOST=smtp.zeptomail.in
EMAIL_PORT=587
EMAIL_USER=emailapikey
EMAIL_PASS=your_zeptomail_api_key
EMAIL_FROM=noreply@instivera.com
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Login
- **POST** `/api/auth/login`
- **Body**: `{ username: string, password: string }`
- **Response**: `{ status: 1, data: { user, token }, message }`

#### 2. Validate Email
- **POST** `/api/auth/validate-email`
- **Body**: `{ email: string }`
- **Response**: `{ status: 1, data: { exists, first_name?, last_name? }, message }`

#### 3. Send OTP
- **POST** `/api/auth/send-otp`
- **Body**: `{ email: string }`
- **Response**: `{ status: 1, data: { email, expiresIn }, message }`

#### 4. Verify OTP
- **POST** `/api/auth/verify-otp`
- **Body**: `{ email: string, otp: string }`
- **Response**: `{ status: 1, data: { email, verified }, message }`

### Profile Routes (`/api/profile`)

#### Get My Profile
- **GET** `/api/profile/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ status: 1, data: profile_object, message }`

### Institution Routes (`/api/institutions`) - PUBLIC

#### List Institutions
- **GET** `/api/institutions?type=school|college`
- **Response**: `{ status: 1, data: [institutions], message }`

#### Get Institution by Slug
- **GET** `/api/institutions/:slug`
- **Response**: `{ status: 1, data: institution, message }`

### Health Check
- **GET** `/api/health`
- **Response**: `{ status: 1, message: 'Identity service is healthy' }`
