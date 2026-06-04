---
name: project-shikshaprime-phase4
description: ShikshaPrime Phase 4 — assignments module (backend + frontend) and bottom-tab navigation
metadata:
  type: project
---

Phase 4 adds the assignments module for both Student (view/filter/submit) and Teacher (create/grade) personas.

**Why:** Extends the mobile BFF and Expo app with assignment lifecycle management.

**How to apply:** Next phases (chat, fees, payments) should follow the same patterns established here.

## New packages installed

- Backend: `multer`, `form-data`, `@types/multer`
- Frontend: `@react-navigation/bottom-tabs@^7`, `expo-document-picker@^56`

## Backend files added

- `src/types/assignment.types.ts` — upstream + mobile DTO shapes
- `src/models/dto/assignment.dto.ts` — `toMobileAssignmentList`, `toMobileAssignmentDetail`
- `src/services/assignment.service.ts` — role-based calls to studentClient/teacherClient; file forwarding with `form-data`
- `src/middleware/upload.middleware.ts` — `handleAssignmentUpload` (required), `handleOptionalAssignmentUpload` (teacher create)
- `src/controllers/assignment.controller.ts` — 5 handlers; role-based branching in getAssignments/getAssignmentById
- `src/routes/assignment.routes.ts` — `/metadata` declared before `/:id` to avoid Express route shadowing
- `tests/assignment.test.ts` — 7 tests

## Frontend files added

- `src/types/assignment.ts`
- `src/api/modules/assignment.api.ts` — `Content-Type: multipart/form-data` set for submit (RN native XHR handles boundary)
- `src/hooks/useAssignments.ts`
- `src/screens/assignments/AssignmentsScreen.tsx` — featured "due tomorrow" card, filter chips, counters
- `src/screens/assignments/AssignmentDetailScreen.tsx` — doc picker + FormData submit; teacher grade form via Alert.prompt
- `src/screens/assignments/CreateAssignmentScreen.tsx` — InlinePicker component (modal sheet), subject/class from metadata API

## Navigation changes

- `navigation/types.ts` — split `AppStackParamList` → `AttendanceStackParamList` + new `AssignmentsStackParamList`; kept `AppStackParamList` alias for backwards compat
- `navigation/RootNavigator.tsx` — rebuilt with `createBottomTabNavigator` (two tabs: Attendance, Assignments); each tab has its own nested stack
- Phase 3 screens updated to import `AttendanceStackParamList` instead of `AppStackParamList`

## Key decisions

- `GET /assignments` is role-agnostic at the route level; role branching happens inside the controller (student → `/stats`, teacher → `/assignments`)
- `/metadata` route registered before `/:id` to prevent "metadata" being captured as an assignment id
- `handleOptionalAssignmentUpload` middleware allows teacher create to work with or without a file attachment
- `Alert.prompt` used for teacher grade input (iOS-only; acceptable for MVP)

[[project-shikshaprime-phase3]]
