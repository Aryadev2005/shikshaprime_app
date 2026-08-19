# INSTIVERA — iOS Simulator Testing Guide

## Prerequisites

| Tool | Required Version | Check |
|------|-----------------|-------|
| macOS | 13 Ventura or later | `sw_vers` |
| Xcode | 15 or later | App Store |
| Xcode CLI tools | Same as Xcode | `xcode-select -p` |
| CocoaPods | 1.13+ | `pod --version` |
| Node.js | 18 or later | `node -v` |
| npm | 9+ | `npm -v` |

> Install CocoaPods if missing: `sudo gem install cocoapods`

---

## First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd instivera-mobile

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Create environment files (fill in real values after copying)
cp instivera-backend/gateway/.env.example instivera-backend/gateway/.env

# 4. Generate the native iOS project
cd frontend
npx expo prebuild --platform ios --clean
# This installs CocoaPods automatically

# 5. (Optional) Open in Xcode to verify the project was generated correctly
open ios/INSTIVERA.xcworkspace
```

---

## How to Run

The `run-ios.sh` script handles everything automatically:

```bash
cd instivera-mobile
chmod +x run-ios.sh
./run-ios.sh
```

The script will:
1. Verify Xcode, Node, and CocoaPods are installed
2. Create `gateway/.env` from `.env.example` if it doesn't exist
3. Start the BFF gateway on port 4000
4. Install frontend dependencies if needed
5. Run `expo prebuild` if the `/ios` folder doesn't exist
6. Install CocoaPods if `/ios/Pods` doesn't exist
7. Launch the app on the iOS simulator

Press `Ctrl+C` to stop both the simulator and the gateway.

---

## Choosing a Specific Simulator Device

```bash
cd frontend

# List available simulators
xcrun simctl list devices available

# Run on a specific device
npx expo run:ios --device "iPhone 15 Pro"
npx expo run:ios --device "iPhone 16"
npx expo run:ios --device "iPad Pro (12.9-inch) (6th generation)"
```

---

## Opening the Xcode Project Directly

```bash
open frontend/ios/INSTIVERA.xcworkspace
```

> Always open the `.xcworkspace` file, not the `.xcodeproj`. The workspace includes CocoaPods dependencies.

From Xcode:
- Select your target simulator from the device picker in the toolbar
- Press `Cmd+R` to build and run

---

## Common Errors and Fixes

### "No bundle URL present"
The Metro bundler lost its connection.
- Shake the simulator (`Cmd+Ctrl+Z` in Simulator.app)
- Tap **Reload** in the developer menu
- Or stop the app and re-run `npx expo run:ios`

### "Unable to boot device"
The simulator failed to start.
- Open **Xcode → Window → Devices and Simulators**
- Delete the simulator and recreate it, or try a different device name

### "Pod install failed"
CocoaPods dependency resolution failed.
```bash
cd frontend/ios
rm -rf Pods Podfile.lock
pod install
```

### "Module not found" at runtime
A native module is missing from the build.
```bash
cd frontend
npm install <missing-package>
npx expo prebuild --platform ios --clean
```

### Network errors on simulator (connection refused / timeout)
The app cannot reach the backend.
- Confirm `apiUrl` in `app.json` is `http://127.0.0.1:4000/api/mobile` (not `localhost`)
- Confirm the gateway is running: `curl http://127.0.0.1:4000/health`
- The ATS exception in `app.json → ios.infoPlist.NSAppTransportSecurity` allows HTTP to `127.0.0.1`

### "Build input file cannot be found" (Xcode)
Stale derived data.
- **Xcode → Product → Clean Build Folder** (`Shift+Cmd+K`)
- Delete `~/Library/Developer/Xcode/DerivedData` for a full clean

---

## Testing the Full Auth Flow on Simulator

1. The app opens to the **Institution Selection** screen
2. Tap an institution from the list to select it
3. Enter your **email** address and tap **Send OTP**
4. The OTP appears in the **identity-service console** (dev mode — no real SMS sent)
5. Enter the OTP on the next screen
6. Verify you are navigated to the correct role dashboard:
   - `teacher` role → Attendance tab with "Take Attendance" form
   - `student` role → Attendance tab showing personal attendance
   - `admin` role → Admin dashboard

---

## Backend Service Checklist

Start only the services needed for the feature you are testing.

### Auth only (login / OTP)
```bash
cd instivera-backend/services/identity-service && npm run dev
cd instivera-backend/gateway && npm run dev
```

### Attendance
```bash
# teacher
identity-service + gateway + teacher-service

# student
identity-service + gateway + student-service
```

### Assignments
```bash
identity-service + gateway + student-service
```

### Chat (real-time messaging)
```bash
identity-service + gateway + chat-service
```

### Fees & Payments
```bash
identity-service + gateway + fees-service + payment-service
```

### Notices & Repository
```bash
identity-service + gateway + (notice-service or repository-service)
```

> The gateway (`port 4000`) must always be running — it is the single entry point for the app.
