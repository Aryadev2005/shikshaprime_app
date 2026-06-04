# INSTIVERA Mobile - Localhost Setup Guide

## Overview
This guide will help you run the INSTIVERA mobile app stack on localhost:
- **Backend BFF**: http://localhost:4000
- **Frontend (Expo)**: http://localhost:19000 (Expo DevTools)

## Prerequisites

### System Requirements
- macOS (as per your setup)
- Node.js 18+ and npm 9+
- Xcode Command Line Tools
- (Optional) Android Studio for Android emulator
- (Optional) Xcode for iOS simulator

### Check Installation
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
```

---

## Part 1: Backend Setup (Mobile BFF)

### 1.1 Install Backend Dependencies
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend

# Install dependencies (if not already done)
npm install
```

### 1.2 Create .env File
Create a `.env` file in the backend directory:

```bash
cat > .env << 'EOF'
# Service Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# Upstream Services (assuming they run on localhost)
IDENTITY_SERVICE_URL=http://localhost:9050
STUDENT_SERVICE_URL=http://localhost:9051
PAYMENT_SERVICE_URL=http://localhost:9053
TEACHER_SERVICE_URL=http://localhost:9060
CHAT_SERVICE_URL=http://localhost:9055
FEES_SERVICE_URL=http://localhost:9056

# Logging
LOG_LEVEL=debug
EOF
```

### 1.3 Build Backend
```bash
npm run build
```

### 1.4 Run Backend (Development Mode)
```bash
npm run dev
```

You should see output like:
```
{"level":"info","service":"instivera-mobile-bff","port":4000,"environment":"development","msg":"INSTIVERA Mobile BFF started successfully"}
```

✅ Backend is running at **http://localhost:4000**

---

## Part 2: Frontend Setup (React Native Expo)

### 2.1 Install Frontend Dependencies
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/frontend

# Install dependencies (if not already done)
npm install
```

### 2.2 Update .env for Frontend (if needed)
The frontend uses the API URL from `app.json` via Expo Constants. The default is already set to:
```
http://localhost:4000/api/mobile
```

If you need to change it, edit `app.json`:
```json
"extra": {
  "apiUrl": "http://localhost:4000/api/mobile"
}
```

### 2.3 Start Frontend (Expo Development Server)

#### Option A: Web (Fastest for testing)
```bash
npm start

# Then press 'w' to open in web browser
```

#### Option B: iOS Simulator
```bash
npm start

# Then press 'i' to open iOS simulator
# (Requires Xcode installed)
```

#### Option C: Android Emulator
```bash
npm start

# Then press 'a' to open Android emulator
# (Requires Android Studio)
```

---

## Part 3: Running Both Services Together

### Terminal 1: Backend
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/frontend
npm start
```

---

## Part 4: Testing the Application

### 4.1 Test Backend Health Endpoint
```bash
# Test health check (no tenant required)
curl http://localhost:4000/health

# Expected response:
# {
#   "status": 1,
#   "data": {
#     "service": "instivera-mobile-bff",
#     "version": "1.0.0"
#   },
#   "message": "OK"
# }
```

### 4.2 Test Auth Endpoints
```bash
# Send OTP
curl -X POST http://localhost:4000/api/mobile/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "x-tenant: collegea" \
  -d '{"email":"test@example.com"}'

# Login (requires valid Identity Service running)
curl -X POST http://localhost:4000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant: collegea" \
  -d '{"username":"student1","password":"password123"}'
```

### 4.3 Test Frontend App Flow

#### Login Screen
1. Open the app in web/iOS/Android
2. You'll see the INSTIVERA login screen
3. Enter credentials:
   - **Username**: (any valid user from your Identity Service)
   - **Password**: (matching password)
   - **Institution**: collegea (auto-filled)

#### Expected Behavior
- ✅ **Success**: Navigate to Dashboard placeholder
- ❌ **Error**: Show error message below button
- **Biometric icon**: Display-only for now

#### OTP Screen
1. On Login Screen, tap "Sign In with OTP"
2. Enter your email
3. Tap "Continue"
4. Enter 6-digit OTP (will auto-verify when complete)
5. On success → navigate to Dashboard

---

## Part 5: Backend Tests

### Run All Tests
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend

npm test
```

### Expected Output
```
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

---

## Part 6: Troubleshooting

### Issue: Backend won't start - "JWT_SECRET is required"
**Solution**: Make sure `.env` file exists in backend directory with `JWT_SECRET` set
```bash
# Check if .env exists
cat /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend/.env

# Should contain: JWT_SECRET=your-key-here
```

### Issue: Frontend can't connect to backend
**Solution**: Check if backend is running and accessible
```bash
# Test connectivity
curl http://localhost:4000/health

# If fails, ensure:
# 1. Backend is running on port 4000
# 2. No firewall blocking the connection
# 3. Correct IP if testing on physical device
```

### Issue: Expo Metro bundler won't start
**Solution**: Clear cache and reinstall
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/frontend

# Clear cache
npm start -- --clear

# Or full reset
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: TypeScript errors in frontend
**Solution**: Rebuild type definitions
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/frontend

npm run build
```

---

## Part 7: Testing with Real Identity Service

If you have the Identity Service running on `http://localhost:9050`:

### 1. Ensure Identity Service is Running
```bash
# Check if it's running
curl http://localhost:9050/health
```

### 2. Get Valid Credentials
```bash
# Check available users in Identity Service DB
# (Usually done through Identity Service documentation)
```

### 3. Test Full Auth Flow
1. **Backend**: `npm run dev`
2. **Frontend**: `npm start`
3. **Login** with valid credentials
4. **Verify** token is stored and app navigates to Dashboard

---

## Part 8: Port Configuration

If ports are already in use, you can change them:

### Backend (Change port 4000)
Edit `backend/.env`:
```bash
PORT=5000  # Change to any available port
```

Then update frontend `app.json`:
```json
"extra": {
  "apiUrl": "http://localhost:5000/api/mobile"
}
```

### Frontend (Expo auto-selects port)
Expo will automatically try ports 19000, 19001, etc. if 19000 is in use.

---

## Quick Start Commands

**Terminal 1 - Backend:**
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/frontend
npm start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

**Terminal 3 - Tests (optional):**
```bash
cd /Users/aryadevchatterjee/Documents/shikshaprime-app/instivera-mobile/backend
npm run test:watch
```

---

## Next Steps

1. ✅ Run backend and frontend as described
2. ✅ Test login flow
3. ✅ Verify token storage in SecureStore
4. ✅ Check console logs for any errors
5. 🔧 Integrate with real Identity Service
6. 📱 Test on physical device (next phase)

---

## Documentation Links

- **Expo**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Zustand**: https://github.com/pmndrs/zustand
- **Axios**: https://axios-http.com
- **Express**: https://expressjs.com
- **TypeScript**: https://www.typescriptlang.org
