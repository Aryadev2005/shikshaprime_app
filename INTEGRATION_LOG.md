# Instivera Mobile ↔ Backend Integration Log

Working log for the frontend/backend integration pass. One section per phase.

---

## Phase 0 — Baseline audit (read-only)

### Backend topology (as found)

16 services, not 13 — `communication-service`, `compliance-service` and
`examination-service` also exist. Each has its own `server.ts`, its own
`/api/<service>` mount prefix, and **its own listening port**:

| service | mount prefix | default port (`src/config.ts`) |
|---|---|---|
| identity-service | `/api/identity` | 4000 |
| student-service | `/api/student` | 4000 |
| teacher-service | `/api/teacher` | 9052 |
| chat-service | `/api/chat` | 9054 |
| payment-service | `/api/payment` | 9053 |
| fees-management-service | `/api/fees-management` | 9052 |
| finance-service | `/api/finance` | 9052 |
| examination-service | `/api/examination` | 9052 |
| accreditation-service | `/api/accreditation` | 9052 |
| admission-service | `/api/admission` | 9040 |
| inventory-management-service | `/api/inventory` | 9040 |
| lead-management-service | `/api/lead-management` | 9040 |
| library-management-service | `/api/library` | 9040 |
| social-media-service | `/api/socialmedia` | 9040 |
| communication-service | (api-docs only, no routes mounted) | 9040 |
| compliance-service | (api-docs only, no routes mounted) | 9040 |

**Finding (blocking for local testing):** the app resolves a *single* origin
(`API_URL`), but locally the services listen on different ports — and several
default to the *same* port (4000 twice, 9052 five times, 9040 six times), so
they cannot all run as-is on one machine. In the deployed environment
(`https://collegec.mainapp.instivera.com:8081`) something in front is routing
`/api/<service>` to the right upstream. Open question for the tech lead: is
that reverse proxy config in this repo anywhere, or environment-only? Until
that is answered, **all local testing has to go against the deployed host**,
or against one service at a time with `SERVICE_PORT` set explicitly.

**Finding: real-time chat is not wired up server-side.** `chat-service` lists
`socket.io@^4.7.2` in `package.json`, but `src/server.ts` calls
`app.listen(...)` directly — there is no `http.createServer`, no
`new Server(...)`, no `io.on('connection')` anywhere in `chat-service/src`.
The only trace is a comment in `ChatService.ts:293`
(`// Emit real-time event (if socket.io is integrated)`). The frontend's
`src/lib/socket.ts` therefore connects to nothing. Chat over REST polling
works; live delivery does not.

### Endpoint match table

`path called` is what the module passes to axios today. `baseURL` is the bare
origin, so anything not starting with `/api/<service>` currently 404s.

| frontend module | line | path called | matching backend endpoint | status |
|---|---|---|---|---|
| auth.api.ts | 21 | `POST /api/identity/authenticate-user` | `POST /api/identity/authenticate-user` | ✅ path OK — **response shape mismatch** (`token` sits outside `data`) |
| auth.api.ts | 33 | `POST /api/identity/send-email-otp` | `POST /api/identity/send-email-otp` | ✅ |
| auth.api.ts | 41 | `POST /api/identity/verify-email-otp` | `POST /api/identity/verify-email-otp` | ✅ path OK — **shape mismatch**: returns `{email, verified}`, no token |
| auth.api.ts | 49 | `POST /api/identity/validate-email` | `POST /api/identity/validate-email` | ✅ |
| institutions.api.ts | 16 | `GET /api/identity/institutions` | `GET /api/identity/institutions` | ✅ |
| profile.api.ts | 25 | `GET /profile/me` | **NO MATCH** — nearest `GET /api/student/me` (student) / `GET /api/teacher/faculty/me/profile` (teacher) | ❌ needs role branching |
| attendance.api.ts | 20 | `GET /attendance/my-records` | `GET /api/student/attendance/my-records` | ⚠️ prefix missing |
| attendance.api.ts | 28 | `GET /attendance/class-students` | nearest `GET /api/student/session-attendance/students` | ⚠️ different contract (session-based) |
| attendance.api.ts | 36 | `GET /attendance/summary` | `GET /api/student/attendance/summary` | ⚠️ prefix missing |
| attendance.api.ts | 44 | `POST /attendance/bulk-mark` | `POST /api/student/attendance/bulk` | ⚠️ prefix + name |
| assignment.api.ts | 110 | `GET /assignments/student/list` | `GET /api/student/assignments/stats` or `/filter` | ⚠️ name mismatch |
| assignment.api.ts | 110 | `GET /assignments/teacher/list` | `GET /api/teacher/assignments` | ⚠️ prefix + name |
| assignment.api.ts | 128 | `GET /assignments/student/:id` | `GET /api/student/assignments/:id` | ⚠️ prefix missing |
| assignment.api.ts | 128 | `GET /assignments/teacher/:id` | `GET /api/teacher/assignments/:assignmentId` | ⚠️ prefix missing |
| assignment.api.ts | 134 | `POST /assignments/student/:id/submit` | `POST /api/student/assignments/submit` (multipart, id in body) | ⚠️ shape + prefix |
| assignment.api.ts | 152 | `POST /assignments/teacher/create` | `POST /api/teacher/assignments` | ⚠️ prefix + name |
| assignment.api.ts | 168 | `POST /assignments/teacher/submissions/:id/grade` | `PUT /api/teacher/submissions/:submissionId/grade` | ⚠️ **method differs** (POST vs PUT) |
| assignment.api.ts | 176 | `GET /assignments/teacher/metadata` | **NO single endpoint** — `/api/teacher/metadata/{classes,programs,departments,subjects,semesters,academic-years}` | ❌ 1 call vs 6 |
| student.api.ts | 19 | `GET /student/search` | `GET /api/student/search` | ⚠️ prefix missing |
| teacherAttendance.api.ts | 38 | `GET /teacher/my-attendance` | nearest `GET /api/teacher/staff-attendance/overview` | ❌ contract differs |
| timetable.api.ts | 21 | `GET /teacher/timetable` | `GET /api/identity/class-routines/teacher-schedule` | ⚠️ wrong service |
| notice.api.ts | 33 | `GET /notices` | `GET /api/identity/notice/all` (+ `/notice/recent`) | ⚠️ prefix + name |
| notice.api.ts | 40 | `GET /notices/:id` | `GET /api/identity/notice/:id` | ⚠️ prefix missing |
| payment.api.ts | 15 | `GET /payment/summary` | **NO MATCH** — nearest `GET /api/payment/dashboard/stats` (admin-scoped) | ❌ |
| payment.api.ts | 20 | `GET /payment/history` | nearest `GET /api/payment/students` | ⚠️ contract differs |
| payment.api.ts | 25 | `POST /payment/initiate` | `POST /api/payment/students/:assignmentId/initiate` | ⚠️ needs assignmentId |
| payment.api.ts | 34 | `GET /payment/status/:paymentId` | `GET /api/payment/students/:paymentId/status` | ⚠️ prefix missing |
| repository.api.ts | 15 | `GET /repository/categories` | **NO MATCH** | ❌ |
| repository.api.ts | 22 | `GET /repository/categories/:id/files` | **NO MATCH** — nearest `/api/student/learning-materials` | ❌ |
| chat.api.ts | 13 | `GET /chat/conversations` | `GET /api/chat/conversations` | ⚠️ prefix missing |
| chat.api.ts | 18 | `POST /chat/conversations/direct` | **NO MATCH** — nearest `POST /api/chat/messages/direct` (sends a message, doesn't create a conversation) | ❌ |
| chat.api.ts | 26 | `POST /chat/conversations/group` | **NO MATCH** — nearest `POST /api/chat/messages/class-broadcast` | ❌ |
| chat.api.ts | 36 | `GET /chat/conversations/:id/messages` | `GET /api/chat/conversations/:conversationId/messages` | ⚠️ prefix missing |
| chat.api.ts | 43 | `POST /chat/conversations/:id/messages` | **NO MATCH** — nearest `POST /api/chat/messages/direct` | ❌ |
| chat.api.ts | 50 | `PUT /chat/conversations/:id/read` | `PUT /api/chat/conversations/:conversationId/read` | ⚠️ prefix missing |
| chat.api.ts | 54 | `GET /chat/users/search` | **NO MATCH** — nearest `GET /api/chat/teachers`, `GET /api/chat/students/class/:classId` | ❌ |
| registration.api.ts | 39 | `GET /registration/academic-years` | `GET /api/identity/sr/academic-years` | ⚠️ prefix + name |
| registration.api.ts | — | `GET /registration/programs` | `GET /api/identity/sr/programs` | ⚠️ prefix + name |
| registration.api.ts | — | `GET /registration/departments` | `GET /api/identity/sr/departments` | ⚠️ prefix + name |
| registration.api.ts | — | `GET /registration/classes` | `GET /api/identity/sr/classes` | ⚠️ prefix + name |
| registration.api.ts | — | `GET /registration/fee-structure` | `GET /api/identity/sr/fee-structure` | ⚠️ prefix + name |
| registration.api.ts | — | `POST /registration/submit` | `POST /api/admission/registerApplicant` (multipart) | ⚠️ different service + shape |
| registration.api.ts | — | `GET /registration/status/:regId` | **NO MATCH** | ❌ |

Score: 5 of 41 calls currently resolve. 24 are fixable path/prefix/shape
mismatches, 12 have no backend counterpart.

### Missing backend endpoints (nothing to point the frontend at)

- Unified profile endpoint (`/profile/me`) covering both roles.
- Single teacher assignment-metadata endpoint (frontend expects one call).
- Teacher "my attendance" (self-service view; only admin-scoped staff-attendance exists).
- Student-facing payment summary + payment history.
- The whole repository/document-library surface.
- Chat: create direct conversation, create group conversation, post message
  to a conversation by id, cross-role user search.
- Registration status lookup by registration id.

### Out of scope — noted

- `communication-service` and `compliance-service` mount swagger and a root
  handler but no actual routers — they serve nothing.
- `client.ts:69-106` keeps a `refreshQueue` that can never be resolved (there
  is no refresh flow). Harmless today, dead code. Deferred per ground rules.
- `identity-service/src/routes/authRoutes.ts:66-71` — the whole auth surface
  (login, OTP, password change) is unauthenticated *and* ungated by rate
  limiting at the router level. Flagging only; not this pass's scope.
- `OtpScreen.tsx:91` calls `login(email, '', tenant)` with an empty password
  after OTP verification — that cannot succeed against `authService.login`,
  which bcrypt-compares the password. The OTP login path is broken
  end-to-end, separately from any wiring issue.

---

## Phase 1 — Core config

Status: **already done in a previous session** (present as uncommitted changes).
Verified this pass:

- `src/config/env.ts` resolves a bare origin, no `/api/mobile` suffix, with
  env → `app.json` extra → Metro debug host → `127.0.0.1:4000` fallback chain.
- `.env.example` matches and documents the same order.
- `src/api/client.ts:25` uses `baseURL: API_URL` unchanged, forwards
  `Authorization` and `x-tenant`. No changes needed.

---

## Phase 2 — Module fixes

### identity-service — done

- `src/api/modules/auth.api.ts` — `login()` unwrapped `response.data.data`,
  which is the *user*; the JWT sits at the top level of the body
  (`authController.ts:makeLogin`). It now returns `{ user, token }` and throws
  if the token is absent, matching what `authStore.login()` reads.
- `src/types/api.ts` — `MobileUser` described fields the backend never sends
  (`id`, `firstName`, `lastName`, `avatarInitials`, `userCode`). Replaced with
  the actual `authService.login` payload (`user_code`, `username`, `name`,
  `role`, `user_type`, `email`, `phone`, `institute_code`, `access_code`,
  `is_email_verified`, `is_phone_verified`, `institution`). No UI code read
  the removed fields.
- `src/types/api.ts` — `VerifyOtpResponse` claimed `{user, token}`;
  `verifyEmailOtp` returns `{email, verified}` and issues no token. Corrected.
  `OtpScreen.tsx` ignores the return value, so nothing else changed.

- `src/api/modules/institutions.api.ts` — the module typed the response as
  `{id, name, slug, type, logo_url}`, but `institutionController` returns
  `{id, name, subdomain, logo, tagline, city, state, address_line, frontendUrl,
  apiUrl}`. **`slug` was always `undefined`**, so `SelectInstitutionScreen`
  persisted `tenant: undefined` and every later request went out with no usable
  `x-tenant`. Now maps `subdomain → slug` and `logo → logo_url` explicitly.
- `src/screens/auth/SelectInstitutionScreen.tsx` — `institution.type` has no
  backend source (see below), so the screen now falls back to `'college'`,
  the same default `LoginScreen.tsx:32` already applies. Two lines; forced by
  making `type` optional.
- `src/api/modules/notice.api.ts` — repointed `/notices` → `/api/identity/notice/all`
  and `/notices/:id` → `/api/identity/notice/:id`, and normalised two shape
  mismatches: the list nests rows a second level deep
  (`data.data.data`) with pagination keyed `{currentPage, pageSize,
  totalRecords, totalPages}` (frontend wanted `{page, limit, total, totalPages}`),
  and the detail endpoint returns `{notice, document}` rather than a notice.
  Field mapping: `description → content`, `from_date → published_date`,
  `to_date → expires_at`, `document → attachment` (absolute URL).
- `src/api/modules/timetable.api.ts` — repointed `/teacher/timetable` (wrong
  service entirely) to identity's class-routine endpoints, with role
  branching: teachers hit `/api/identity/class-routines/teacher-schedule`
  (flat entry array), students hit `/student-schedule` (a whole routine
  object, or `null`). Added a mapper producing `time`/`duration` from
  `start_time`/`end_time`.
- `src/api/modules/profile.api.ts` — `/profile/me` does not exist. Now branches
  on role to `GET /api/student/me` (raw profile bundle) or
  `GET /api/teacher/faculty/me/profile` (profile-page payload), normalising
  both into `ProfileData`.
- `src/api/modules/registration.api.ts` — the five dropdown lookups repointed
  to `/api/identity/sr/*`; `submitRegistration` repointed to
  `POST /api/admission/registerApplicant`.

`npx tsc --noEmit` across the frontend: clean (exit 0).

#### Identity findings that need backend work

1. **No school/college type on `tenants`.** `Institution.type` drives the
   whole sign-up form shape (`SignUpScreen.tsx:225,460,482,489` switch on
   `'college'` vs `'school'`), but the `tenants` table has no such column —
   verified against `models/main/Tenants.ts`. Every institution currently
   falls back to `'college'`. **School sign-ups are therefore showing the
   wrong form.** Needs a column + inclusion in `getActiveInstitutions`.
2. **Notices carry no audience or author.** The tenant `notices` table is
   `{id, title, description, attachment, from_date, to_date, created_at,
   updated_at}`. `target_audience` and `created_by` — which the detail screen
   renders — do not exist, so those UI blocks will never appear.
3. **`day_of_week` format is unverifiable from source.** It's a free
   `STRING(50)` with no enum, no seed data, and no constant anywhere in the
   repo. The mapper assumes full English weekday names (`"Monday"`). Confirm
   via curl in Phase 3 before trusting the day filter.
4. **Class routines have no room/venue column.** `TimetableEvent.room` is
   populated with the class name for teachers and left empty for students.
5. **`getFeeStructure` is a hardcoded stub** — `studentRegistrationController.ts:349`
   returns a literal `[{ADMISSION, 500}, {REGISTRATION, 100}]`, not table data.
6. **`mapStudentCoreProfile` reads `bundle.profile_img`, which the bundle
   query never selects** (`studentService.ts:422+`) — always `undefined`.
7. **Registration submit cannot succeed.** `registerApplicant` is multipart and
   returns 400 unless an `hs_registration_certificate` file part is present;
   `RegistrationSubmitPayload` contains no documents at all. Needs either a
   document-upload step in the app or a JSON registration route.
8. **Registration status lookup has no route.** Left pointing at the old path
   so it fails loudly as a 404 rather than being silently rewired to something
   that means something else.

#### Blocker for Phase 3 QA — fake data masking failures

`src/screens/calendar/CalendarScreen.tsx:187-188` falls back to
`STATIC_SCHEDULE` — hardcoded "Mathematics / John Doe / Room 204" entries —
whenever the API returns an empty array. Since the timetable path 404'd until
now, **the calendar has been showing invented classes this whole time**, and
during QA a working-looking calendar proves nothing. This needs removing (or
gating behind an explicit empty state) before the Phase 3 checklist is
meaningful. Not changed here: it is a screen, outside this phase's module
scope, and it is your call how the empty state should read.

### chat-service — deferred by request

Not touched this pass. Chat's problems are backend-shaped, not path-shaped:
the frontend is built around conversations (create direct, create group, post
into a conversation by id, search users across roles) and the backend only
exposes message-level routes (`POST /api/chat/messages/direct`,
`/messages/class-broadcast`) plus fixed-audience lookups (`/teachers`,
`/students/class/:classId`). 4 of 7 calls have no counterpart, and live
delivery is unimplemented (no `socket.io` server — see Phase 0). Repointing
paths would not make chat work. **Tracked as a separate backend work item.**

### student-service — done

- `src/api/modules/student.api.ts` — `/student/search` → `/api/student/search`,
  and the query param renamed `q` → `query`: `searchStudents`
  (`studentController.ts:376`) reads `query` and silently ignores `q`, so the
  old call returned the entire unfiltered student list rather than a search
  result.
- `src/api/modules/attendance.api.ts` — all four calls repointed and reshaped:
  - `my-records` → `/api/student/attendance/my-records`. The endpoint 400s
    without an explicit `studentId` and does **not** derive it from the token,
    so the module now resolves the caller's numeric `students.id` via
    `/api/student/me` first. Response `{records, summary}` is mapped into the
    app's `{summary, bySubject, heatmap}`; `streakDays` is computed client-side
    (the backend has no streak concept) and `bySubject` is `[]` (no per-subject
    data on this endpoint).
  - `class-students` → `/api/student/by-class?classId=` — there is no
    `/attendance/class-students`; the roster comes from `getStudentsByClass`.
  - `summary` → `/api/student/attendance/summary`, param `class_id` → `classId`,
    plus `startDate`/`endDate` both set to the requested date (that is how the
    endpoint reports a single day's `daily_status`). Returns a bare array, not
    `{students: [...]}`.
  - `bulk-mark` → `/api/student/attendance/bulk`. Body drops `classInfo` (the
    controller ignores it). It responds `data: null`, so `markedCount` is taken
    from the request length.
- `src/api/modules/assignment.api.ts` — student half only:
  - list → `/api/student/assignments/stats`, which returns
    `{assignments, stats, chart}` with flat rows (`subject_name`, not
    `subject.name`) and a server-computed `Submitted|Overdue|Pending` status.
    Added a separate `toStudentAssignment` adapter rather than bending the
    teacher-shaped `RawAssignment` mapper.
  - detail → `/api/student/assignments/:id`.
  - submit → `POST /api/student/assignments/submit`; the id moves into the body
    as `teacherAssignmentId` (it is not a path param). The file field is
    already named `assignmentFile`, so `AssignmentDetailScreen` is unchanged.
  - Teacher-side calls in this module still point at the old gateway paths and
    are marked `TODO(teacher-service phase)`.
- `src/types/assignment.ts` — `SubmitAssignmentResult.submissionId` made
  optional: `submitAssignment` returns only `{status, message}` (plus
  `uploadedFile`), never the submission row. The old code destructured
  `response.data.data.submission`, which would have thrown on every successful
  submit.
- `src/api/modules/repository.api.ts` — **untouched, no backend counterpart.**
  Nothing in any service exposes repository categories or files;
  `/api/student/learning-materials` is materials-by-id with no category
  concept, so it is not a drop-in. Left failing loudly rather than rewired to
  something that means something else.

`npx tsc --noEmit` across the frontend: clean (exit 0).

#### student-service findings that need backend work

1. **`GET /api/student/attendance/my-records` is an IDOR.** It is gated
   `requireRole("student")` but takes the target `studentId` straight from the
   query string and never checks it against the caller. Any logged-in student
   can read any other student's attendance by changing one parameter. It
   should derive the student from the token the way the sibling `/me/*` routes
   already do — which would also remove the extra lookup the app now performs.
2. **`POST /api/student/attendance/bulk` has no `requireAuth` at all**
   (`authRoutes.ts:128`), and neither does `POST /attendance` or
   `/attendance/upload`. The bulk handler `destroy`s every attendance row for
   the given students and date before re-inserting, so an unauthenticated
   caller can wipe and rewrite a class's attendance history. This is the most
   serious thing found so far.
3. **`getAssignmentById` `INNER JOIN`s attachments**
   (`assignmentController.ts:489`), so any assignment without an attachment
   returns 404 instead of the assignment. It also returns no id, subject,
   class, marks or submission state, so the detail screen cannot show grade or
   submission status for students.
4. **The student stats query hardcodes `graded: 0`** and `avgGrade: null`
   (`assignmentController.ts:133`) — it never distinguishes graded from
   submitted, so the "Graded" counter is always zero.
5. **`mapStudentFromDb` dereferences `dbRecord.details.*` unguarded**
   (`utils/mappers.ts:63,86,88`). Any student row without a
   `student_personal_details` join throws a TypeError mid-map, failing the
   whole list request rather than that one row.
6. **Duplicate assignment mounts.** `server.ts:59` mounts `assignmentRoutes` at
   `/api/student/assignments` and `server.ts:66` mounts `authRoutes` at
   `/api/student`, which also defines `/assignments/*` (lines 135-139). The
   first mount always wins, so the `requireRole("student")` guards on the
   `authRoutes` copies are dead code — the reachable handlers are
   `requireAuth`-only. Worth deleting one set to avoid the guards drifting.
7. **No repository/document-library surface exists** (carried over from Phase 0).

### teacher-service — see Phase 2 (continued) below

---

## Phase 3 — Test plan

Target: **`https://collegec.mainapp.instivera.com:8081`**, not local. Local
port assignment is not resolvable from this repo (Phase 0: duplicate default
ports, no proxy config in-tree), so curl checks run against the deployed host.

---

## Phase 2 (continued) — teacher-service

### Real routes (teacher-service, full list)

`server.ts` mounts exactly two routers: `facultyRoutes` at `/api/teacher` and
`staffAttendanceRoutes` at `/api/teacher/staff-attendance`.

| method | path | guard |
|---|---|---|
| GET | `/api/teacher/health`, `/ready` | none |
| GET | `/api/teacher/faculty/search` | auth |
| GET | `/api/teacher/faculty/stats` | admin |
| GET | `/api/teacher/dashboard/teacher` | teacher/admin/superadmin |
| GET | `/api/teacher/faculty/me/profile` | teacher/admin/superadmin |
| GET | `/api/teacher/faculty/by-department/:departmentId` | auth |
| GET | `/api/teacher/faculty/by-employee-id/:employeeId` | auth |
| GET/POST | `/api/teacher/faculty` | auth / admin |
| GET/PUT/DELETE | `/api/teacher/faculty/:id` | auth / admin / admin |
| GET | `/api/teacher/faculty/user/:id` | auth |
| POST | `/api/teacher/assignments` | auth (multipart) |
| GET | `/api/teacher/assignments` | auth |
| GET | `/api/teacher/assignments/submitted` | teacher |
| GET | `/api/teacher/faculty/:facultyId/assignments` | auth |
| GET/PUT/DELETE | `/api/teacher/assignments/:assignmentId` | auth |
| GET | `/api/teacher/submissions/:submissionId` | teacher |
| PUT | `/api/teacher/submissions/:submissionId/grade` | teacher |
| POST | `/api/teacher/assignments/:assignmentId/files` | auth |
| GET | `/api/teacher/assignments/:assignmentId/attachments` | auth |
| GET | `/api/teacher/assignments/:assignmentId/files/:filename` | **none (public)** |
| DELETE | `/api/teacher/assignments/:assignmentId/attachments/:attachmentId` | auth |
| POST/GET | `/api/teacher/faculty/:id/assignments` | admin / auth |
| DELETE | `/api/teacher/faculty-assignments/:assignmentId` | admin |
| GET | `/api/teacher/metadata/{semesters,programs,departments,subjects,academic-years,classes}` | auth |
| GET | `/api/teacher/staff-attendance/overview` | teacher/admin/superadmin |
| GET | `/api/teacher/staff-attendance/{stats,summary,report}` | admin |
| GET | `/api/teacher/staff-attendance/employee/:employeeId` | admin |
| POST | `/api/teacher/staff-attendance`, `/bulk` | admin |
| DELETE | `/api/teacher/staff-attendance/:attendanceId` | admin |

### Endpoint match table

| frontend call | was | now | notes |
|---|---|---|---|
| `getAssignments()` (teacher) | `GET /assignments/teacher/list` | `GET /api/teacher/assignments?limit=100&status=active` | envelope is `{assignments,total,page,limit}`, not a bare array |
| `getAssignmentById()` (teacher) | `GET /assignments/teacher/:id` | `GET /api/teacher/assignments/:assignmentId` | flat row + `attachments:[{id,fileName,fileUrl}]` |
| submissions for a detail screen | (came nested in the detail) | `GET /api/teacher/assignments/submitted?limit=200`, filtered client-side | detail returns a submission **count**, not rows |
| `createAssignment()` | `POST /assignments/teacher/create` | `POST /api/teacher/assignments` | responds `data: <insertId>`, not the row |
| `gradeSubmission()` | `POST /assignments/teacher/submissions/:id/grade` | `PUT /api/teacher/submissions/:submissionId/grade` | method changed; body `{marks_obtained, feedback}` |
| `getAssignmentMetadata()` | `GET /assignments/teacher/metadata` | `GET /api/teacher/metadata/subjects` + `/metadata/classes` (parallel) | rows are `{id, code, name}` |
| `getMyAttendance()` | `GET /teacher/my-attendance` | **unchanged — no backend counterpart** | see below |

### Changes made

- `src/api/modules/assignment.api.ts`
  - Added an `isTeacher()` helper distinct from `!isStudent()` — admins reach
    the same screens, but `/assignments/submitted` and `/submissions/*` are
    gated `requireRole('teacher')`, so an admin would 403 on them.
  - Teacher list repointed and reshaped: the response is
    `{assignments, total, page, limit}` with flat rows (`subject_name`, not
    `subject.name`) and a **numeric** `submissions` count. Requests
    `limit=100` because the server default is 10 and there is no pagination UI.
    No counters are returned for teachers, so the filter chips show no counts
    on that role.
  - Teacher detail repointed; `className` now comes from `class_name` and
    `fileUrl` from `attachments[0].fileUrl`.
  - Submissions list for the teacher grading UI now comes from
    `GET /api/teacher/assignments/submitted`, filtered client-side on
    `assignment_id` (see finding 3).
  - `createAssignment` repointed; returns `{id}` instead of an
    `AssignmentDetail`, because the endpoint responds with the insert id only.
    `CreateAssignmentScreen` ignores the return value, so nothing else changed.
  - `gradeSubmission` changed POST → PUT and now sends only
    `{marks_obtained, feedback}`.
  - `getAssignmentMetadata` split into two parallel metadata calls.
  - Deleted the `RawAssignment`/`RawSubmission`/`toAssignment`/
    `toAssignmentDetail`/`toSubmission`/`deriveStatus` block — it described the
    old gateway's nested model rows, which no service emits.
- `src/types/assignment.ts` — `GradeSubmissionPayload.grade` made optional
  (backend ignores it); `CreateAssignmentPayload` gained optional `type` and
  `due_time`, both **required by the backend** and not collected by the form.
- `src/api/modules/teacherAttendance.api.ts` — left pointing at the missing
  route, with the alternatives and why each is wrong documented in-file.

`npx tsc --noEmit` across the frontend: clean (exit 0).

### teacher-service findings that need backend work

1. **No teacher self-service attendance endpoint.** The calendar screen needs
   dated `{attendance_date, attendance_status}` rows for the caller. What
   exists: `/staff-attendance/overview` (institution-wide counters, no dates),
   `/staff-attendance/employee/:employeeId` (**admin-only**), and
   `/faculty/me/profile` (self-scoped but only 12 monthly percentages). Not
   repointed — the admin route is a different permission model and would expose
   other staff's attendance. Needs a `GET /api/teacher/staff-attendance/me`
   taking `month`/`year`.
2. **`/staff-attendance/overview` ignores its own `facultyId` param.**
   `getAttendanceStatsOverview` accepts `facultyId` but never adds it to
   `whereClause` (`staffAttendanceService.ts:323-333`), so every caller gets
   institution-wide totals regardless.
3. **No way to list submissions for one assignment.**
   `getSubmittedAssignments` filters on department/program/class/roll/student
   but **not** `assignment_id`, and the assignment detail returns only a
   submission count. The app therefore over-fetches (`limit=200`) and filters
   client-side; any teacher with more than 200 submissions will see a truncated
   list. Needs an `assignment_id` filter, or submissions nested on the detail.
4. **`getAssignmentById` / `updateAssignment` / `deleteAssignment` perform no
   ownership check at all.** *(Amended — an earlier draft of this finding said
   these 404. They do not; traced through, the effect is the opposite.)*

   18 of the 21 assignment/metadata handlers resolve the caller with
   `getFacultyIdFromUser(req.user, req.tenant)`, which looks up
   `teachers.id` by `user_id` → `email` → `employee_id`. These three do not:
   they read `req.user?.id` (`facultyController.ts:488, 536, 575`). The JWT
   payload is `{user_id, username, role, email}` (`identity-service/src/services/authService.ts:32-37`)
   — there is **no `id` claim** — so `req.user.id` is `undefined`,
   `parseInt(undefined)` is `NaN`, and `NaN` is falsy. Every one of these
   services gates its ownership clause on `if (facultyId)`, so the clause is
   simply **omitted**:
   - `getAssignmentById` — `ta.teacher_id` filter dropped: any authenticated
     user can read any assignment in the tenant.
   - `updateAssignment` — `AND teacher_id = :faculty_id` dropped: any
     authenticated user can rewrite any assignment (`requireAuth` only, no
     role gate).
   - `deleteAssignment` — clause dropped, and it names the **wrong column**
     anyway (`AND faculty_id = ...`; the column is `teacher_id`), so it could
     never have worked. Any authenticated user can delete any assignment.

   Consequence for this pass: the teacher detail screen will work in QA
   (nothing 404s), but it works because the authorization check is absent. The
   fix is to use `getFacultyIdFromUser` in all three, as the sibling handlers
   already do — and to gate update/delete on `requireRole('teacher')`. This
   ranks with the unauthenticated attendance-bulk endpoint found in the
   student-service pass.
5. **`createAssignment` silently defaults `program_id`, `semester_id` and
   `academic_year_id` to `1`** when absent (controller line 331-337 and again
   in the service). The mobile form sends none of them, so every assignment
   created from the app is filed against program 1 / semester 1 / academic
   year 1 whether or not those rows exist.
6. **`createAssignment` requires `type` and `due_time`**, which the mobile form
   does not collect. **This is a workaround pending a decision, not a fix.**
   The module sends `type: 'Assignment'` and `due_time: '23:59:00'` so the call
   stops 400ing, but neither value is a product decision I can make: `type` is
   an `'Assignment' | 'Homework'` enum the teacher should be choosing, and
   end-of-day is merely the least surprising due time, not a stated one. Either
   `CreateAssignmentScreen` grows both inputs, or the backend defaults them
   server-side and stops requiring them. Until one of those happens, every
   assignment created from the mobile app is typed 'Assignment' and due at
   23:59 regardless of intent. **Needs a decision.**
7. **`calculateGrade` treats marks as a percentage** regardless of
   `maximum_marks` (`assignmentService.ts:55-62`), so an assignment out of 20
   grades a perfect score as 'E'. The grading form's own "Grade" text input is
   also dead — the backend overwrites it — so it should be removed or made
   read-only.
8. **`GET /api/teacher/assignments/:assignmentId/files/:filename` is
   unauthenticated** (`facultyRoutes.ts:78`, commented "Public file access").
   Any assignment attachment is readable by anyone who can guess the path.
9. **The faculty list SQL is string-interpolated.** `getFacultyAssignments`
   builds `whereConditions` by concatenating `${facultyId}`, `${subject_id}`,
   `${program_id}` straight into SQL (`assignmentService.ts:138-141`). Values
   are `parseInt`ed in the controller today, so it is not exploitable from the
   current route, but it is one careless caller away from injection.

### Out of scope — noted

- Teacher list rows have no completion ratio (only a submission count with no
  class size), so the progress bar renders 0% for teachers. Left as-is; showing
  anything else would require inventing a denominator.

---

## Phase 2 (continued) — payment / fees

Covers `payment-service`, `fees-management-service`, `finance-service` and the
two screens that depend on them.

### Does a student-scoped payment endpoint exist? — yes. Phase 0 was wrong.

Phase 0 recorded `payment/summary` and `payment/history` as having "no direct
student-facing match (nearest are admin-scoped)". Re-checked line by line, that
is **incorrect for the list endpoints**: both
`GET /api/payment/students` (`studentPaymentController.ts:198-205`) and
`GET /api/payment/students/assignments` (`:454-461`) branch on the caller's
role and, for `role === 'student'`, filter `st.user_id = <token user_id>`. They
are `requireAuth`ed and self-scoping. No student id has to be resolved first.

What genuinely does not exist is a pre-aggregated **summary** — no endpoint
returns outstanding/annual/paid totals for a student. The nearest,
`/api/payment/dashboard/stats`, is institution-wide. The summary is therefore
assembled in the module from the student's own assignment rows: every figure is
summed from real data, and the gaps (payment mode, partial-payment amounts) are
left empty rather than filled in. Logged rather than repointed.

### Two fee tables, two ids

| table | endpoint | key | used for |
|---|---|---|---|
| `student_fee_assignments` (+ `fee_heads`) | `GET /api/payment/students/assignments` | `assignment_id` | the summary, and the id `initiate` takes in its path |
| `student_fee_payments` (+ `payment_types`) | `GET /api/payment/students` | `payment_id` | history, and the id `status` polls |

`POST /students/:assignmentId/initiate` looks up (or creates) the
`student_fee_payments` row for that assignment and returns **its** id as
`paymentId`, which `GET /students/:paymentId/status` then takes. So the app's
existing hand-off — summary → initiate → WebView → status — lines up, provided
`primaryPaymentId` carries an *assignment* id. It now does, and both the type
and the module say so. The two payloads share no key, so they cannot be joined
client-side; the summary uses the assignments list alone.

### Endpoint match table

| frontend call | was | now | notes |
|---|---|---|---|
| `getPaymentSummary()` | `GET /payment/summary` | `GET /api/payment/students/assignments` + client-side aggregation | no server-side student summary exists |
| `getPaymentHistory()` | `GET /payment/history` | `GET /api/payment/students` | self-scoping; **no screen calls this hook** |
| `initiatePayment()` | `POST /payment/initiate` | `POST /api/payment/students/:assignmentId/initiate` | id moves from body to path; body carries `amount` |
| `getPaymentStatus()` | `GET /payment/status/:paymentId` | `GET /api/payment/students/:paymentId/status` | returns `{paymentId, gatewayStatus, studentPaymentStatus}`; `isCompleted` derived |

### Changes made

- `src/api/modules/payment.api.ts` — rewritten against the real routes. The
  summary is derived from `amount − discount_amount + fine_amount` per row;
  `annualTotal`/`paidSoFar`/`outstanding` are sums over those rows; the headline
  due date and `primaryPaymentId` come from the earliest-due unpaid row.
  `OVERDUE` is computed client-side (the backend enum is
  `PENDING|PARTIAL|PAID|''` — there is no overdue state) because `FeeRow`
  renders one.
- `src/types/payment.ts` — `RecentPayment.mode`, `PaymentReceipt.mode` and
  `PaymentReceipt.receiptNumber` made optional (no student-facing source);
  `InitiatePaymentInput.paymentId` documented as a fee-assignment id.
- `src/screens/fees/FeesScreen.tsx` — one line: `RecentRow` printed
  `{date} · {mode}` unconditionally, which would render a dangling "·" now that
  mode is genuinely absent. The separator is dropped when there is no mode.
  No other screen change.

`npx tsc --noEmit` across the frontend: clean (exit 0).

### fees-management-service / finance-service

- **`finance-service` has no frontend caller and no student-facing surface.**
  It is double-entry accounting — vouchers, ledgers, chart of accounts, day
  book, trial balance, bank accounts. Nothing in `src/screens/fees/` or
  anywhere else references it. No work needed.
- **`fees-management-service` has no frontend caller either**, but it holds the
  only real receipt data in the system: `GET /receipts/student/:student_id`
  returns `fee_receipts` with `items` → `fee_head`, and
  `GET /dues/:student_id` returns the same `student_fee_assignments` rows with
  the fee head joined. **Not** wired up, for the reason in finding 3 below.
- Neither screen (`FeesScreen`, `PaymentWebViewScreen`) calls either service
  directly — checked; `paymentApi` is their only API dependency.

### payment/fees findings that need backend work

1. **`GET /api/payment/students` and `/students/assignments` are IDORs.** Both
   check `if (studentId)` from the query string *before* the role branch
   (`studentPaymentController.ts:195-205`, `:452-461`), so a student who passes
   `?studentId=<other student>` gets that student's fee rows — the self-scoping
   branch is never reached. Same shape as the attendance `my-records` IDOR
   found in the student-service pass: the id must be ignored for callers whose
   role is `student`.
2. **`student_fee_assignments` stores no paid amount.** There is a
   `PARTIAL` status but no `paid_amount` column, so a partially paid fee's paid
   portion is unknowable from this table. The summary counts PARTIAL rows as
   fully outstanding, which **overstates the balance** for any student mid-
   instalment. `student_fee_payments` does have `paid_amount`, but neither
   payload exposes a key to join them on. Needs either `paid_amount` on the
   assignment row or `assignment_id` in the `/students` SELECT.
3. **`fees-management-service`'s student endpoints are unauthenticated.**
   `GET /dues/:student_id`, `GET /receipts/:receipt_id` and
   `GET /receipts/student/:student_id` are mounted with no `requireAuth` and no
   ownership check (`routes.ts:75, 96-97`) — only the tenant header scopes
   them. Anyone who can reach the host can enumerate any student's dues and
   receipts by incrementing an id. The app was **not** pointed at them for this
   reason, even though they are the only source of receipt numbers. They need
   auth + self-scoping before any client uses them.
4. **No student-facing receipt or payment-mode data.** `payment_transactions`
   carries `receipt_number` and `payment_method`, but the only endpoint that
   includes transactions is `GET /api/payment/students/:paymentId`, which is
   broken (finding 5). So the "Recent payments" rows show no mode and the
   receipt-download button has nothing to download.
5. **`getPaymentById` reads the wrong param.** The route is
   `/students/:paymentId` but the controller destructures `req.params.id`
   (`studentPaymentController.ts:524`), so `findByPk(undefined)` — the endpoint
   can only ever 404. Unused by the app today.
6. **`checkPaymentStatus` forwards a token it never has.** It calls the
   identity service with `Bearer ${authUser.token}`
   (`studentPaymentController.ts:985`), but `authUser` is the decoded JWT
   payload `{user_id, username, role, email}` — there is no `token` field, so
   the header is `Bearer undefined` and the gateway status check fails for any
   payment that has a `gateway_transaction_id`. `initiatePaymentGateway`, three
   hundred lines earlier, does this correctly by forwarding
   `req.headers.authorization`. **This breaks the WebView's status polling
   end-to-end** — the screen will poll until it times out. Confirm with the
   Phase 3 curl for `/status` on a payment that has been through the gateway.
7. **No student-scoped payment summary endpoint** (see above). The aggregation
   now lives in the app; a `GET /api/payment/students/me/summary` would remove
   ~40 lines of client-side arithmetic and let the server account for partial
   payments properly.

---

## Phase 2 (continued) — remaining services

`admission-service`, `accreditation-service`, `inventory-management-service`,
`lead-management-service`, `social-media-service`.

**No code changed in this sub-phase.** Four of the five have no frontend caller
at all, and the fifth was already fixed.

### Which services the app actually calls

Every request path in `instivera-frontend/src`, by prefix:

| prefix | calls | state |
|---|---|---|
| `/api/identity` | 16 | fixed (Phase 2) |
| `/api/teacher` | 13 | fixed (this pass) |
| `/api/student` | 12 | fixed (Phase 2) |
| `/api/payment` | 8 | fixed (this pass) |
| `/api/admission` | 1 | fixed (Phase 2) |
| `/chat/*` | 6 | deferred by request — backend-shaped problem |
| `/repository/*` | 2 | no backend counterpart anywhere |
| `/teacher/my-attendance` | 1 | no backend counterpart |
| `/registration/status/:regId` | 1 | no backend counterpart |

That is the complete inventory: nothing else in the app issues a request.

### Per service

- **`admission-service`** — one caller, `registration.api.ts` →
  `POST /api/admission/registerApplicant`, already repointed in Phase 2. While
  here, the **registration-status gap was re-checked against the real route
  list rather than left on the Phase 0 note.** The nearest candidate is
  `GET /api/admission/application/registrations`, but it is `requireAuth`ed and
  resolves the caller with `getUserId(req.user.email)` — it is the staff-facing
  registration list (filter by class/year/status/search, paginated), not a
  lookup by registration id. `RegistrationStatusScreen` lives in the **auth
  stack**, i.e. an applicant checks their status *before* they have an account,
  so an authenticated staff list cannot back it under any mapping. There is
  also `GET /application/student/:studentId`, keyed on a student id an
  applicant does not have yet. **Finding confirmed, candidate ruled out:** the
  app needs a public `GET /api/admission/registration-status/:registrationId`.
- **`accreditation-service`** (120 routes) — no frontend reference. Skipped.
- **`inventory-management-service`** (22 routes) — no frontend reference. Skipped.
- **`lead-management-service`** (20 routes) — no frontend reference. Skipped.
- **`social-media-service`** (20 routes) — no frontend reference. Skipped.

No speculative coverage was built for the four: they are back-office surfaces
with no mobile screen to hang them off, and inventing callers would be exactly
the "silent stub" the ground rules rule out.

### `library-management-service` — gap confirmed, and a naming trap

Confirmed as stated: no API module, and **no screen calls it**.

Worth flagging because it is genuinely misleading: `RootNavigator.tsx:322-329`
registers a student-only tab **named "Library"**, but its component is
`RepositoryStackScreen` — the document repository, which has no backend either.
So the tab labelled "Library" has nothing to do with `library-management-service`
(Koha ILS, circulation, holds, patron mapping), and anyone reading the nav
would reasonably assume the service is already wired up. It is not, in either
sense: the tab is dead for students because `repository.api.ts` has no backend,
and the ILS has no client. Two separate gaps that happen to share a word.

No screens were built for either — that is a product decision, not an
integration fix.

---

## Phase 2.5 — frontend logic bugs

### 1. `OtpScreen.tsx:91` — OTP login. **Blocked on a backend decision.**

Not fixed. The evidence settles *what kind* of flow this is, but the fix is
entirely server-side, so it is not mine to pick.

**It is a genuine passwordless login, not a signup/verification step.** Three
independent confirmations:

- **Entry point.** The only route into the screen is
  `LoginScreen.tsx:147` — a **"Sign In with OTP"** link, from the login form,
  in the auth stack. Nothing in signup or password-reset navigates here.
- **The send endpoint the app uses requires an existing account.**
  `POST /api/identity/send-email-otp` calls `authService.validateEmail` first
  and 404s with "No user found with this email" (`authController.ts:52-55`).
  A signup-verification step could not use it. Notably identity **also**
  exposes `POST /user-send-email-otp`, which skips the existence check and
  sends via `sendOtpEmailForVerification` — *that* is the signup variant, and
  the app correctly does not call it. The frontend is already on the right
  send endpoint for a login flow.
- **There is no OTP-login route to redirect to** — checked, since a
  purpose-built route would make this moot. `authRoutes.ts` exposes exactly
  `authenticate-user`, `validate-email`, `send-email-otp`,
  `user-send-email-otp`, `verify-email-otp`, `change-password`. There is also
  an `otpRoutes.ts` mounted at `/api/identity/otp` that had not surfaced in
  earlier phases — but it is **phone** OTP (`/send`, `/verify`,
  `/check-validation/:phone_number`) for signup number validation, and its
  verify likewise returns `{phoneNumber, verified: true}` with no token.

So the mapping is option 1: **`verifyEmailOtp` must issue a token.** It
currently returns `{email, verified: true}` (`authController.ts:135-139`) and
persists no "recently verified" marker that another endpoint could trade for a
session, so there is nothing the client can present. `login(email, '', tenant)`
bcrypt-compares an empty string and can only 401 — **the frontend cannot fix
this at any layer.**

The one-line shape, for whoever picks it up: `verifyEmailOtp` already has the
verified email; it needs to load the user, call the same `generateToken`
payload `makeLogin` builds (`{user_id, username, role, email}`), and return
`{token, user}` in the login response shape. `OtpScreen` then stores that token
directly and never calls `login()`.

**Open question for the tech lead — the only blocking one in this pass:**
confirm passwordless OTP login is intended, and that any user with a mailbox
should get a session from a 6-digit code with no password. If yes, the above is
the fix. If OTP is only ever meant to gate a password reset, then the
**"Sign In with OTP" link should be removed** and the flow pointed at a reset
screen instead — which is a different, and much smaller, change. Left broken
and loud rather than guessed at either way.

### 2. `CalendarScreen.tsx` — fake schedule removed. **Fixed.**

- `STATIC_SCHEDULE` (the "Mathematics / John Doe / Room 204" entries) deleted,
  along with the `apiEvents.length > 0 ? apiEvents : STATIC_SCHEDULE` fallback.
  The screen now renders three explicit states: a spinner while loading, a
  "Couldn't load your timetable" card with a Retry button on error, and
  "No classes scheduled" on a genuinely empty day.
- **Also removed: fabricated data that was *not* behind the fallback.** Every
  class row rendered three hardcoded student avatars (`'Karan V'`, `'Tara I'`,
  `'Riya M'`) and a literal `+39` overflow badge — invented roster data, shown
  unconditionally, i.e. it would now sit next to *real* timetable rows and read
  as authoritative. No timetable endpoint returns enrolled students, so there
  is nothing to replace it with; the avatar row is gone and the "Take
  attendance" action remains. Flagging this rather than quietly deleting it:
  it is a visual change, and reverting is one commit if the design owner
  disagrees.

### 3. Sweep for the same pattern elsewhere — **one other instance, not fixed**

`src/screens/` swept three ways: for hardcoded `UPPER_CASE` seed arrays, for
fallback expressions (`length > 0 ? data : X`, `?? MOCK`, `|| STATIC`), and for
telltale literals ("John Doe", "Lorem", "dummy"). Everything else that matched
is legitimate UI vocabulary — `DAY_LABELS`, `MONTH_NAMES`, `FILTER_CHIPS`,
`STATUS_CYCLE`, `HEATMAP_COLORS`, `ACCENT_COLORS`, `TABS`, `STATUS_ORDER`.

**`ChatConversationsScreen.tsx` has the identical pattern, in two places:**

- `:196` — `(data && data.length > 0 ? data : STATIC_CONVERSATIONS)`, falling
  back to three invented conversations (`:139-188`) complete with unread
  badges, a pinned "Class XII-A" thread and a "John Doe" DM.
- `:230-234` — an "actives" row of five hardcoded `ActiveBubble`s
  (`Class XII-A count={42}`, `John Doe online`, `P. Nair`, …) rendered
  unconditionally, not even gated on an empty response.

**Not fixed, deliberately** — chat is the one service explicitly out of scope
this pass. Worth knowing that it matters more here than it did on the calendar:
chat's backend gaps mean the conversation list has *no working endpoint*
(Phase 0), so this screen currently shows **only** invented conversations, in
every environment, to every user. Any demo of chat is showing fiction. Flagged
for a decision alongside the chat backend work.

### Out of scope — noted

- `POST /api/identity/change-password` is unauthenticated **and** requires no
  proof of identity — see the security note below; found while tracing the OTP
  flow.

---

## OUT-OF-BAND SECURITY PATCH — unauthenticated account takeover

Handled ahead of and separately from Phase 3, at the tech lead's direction.
**Backend-only. No mobile app change. Deployable independently of the app
release.**

### The hole

`POST /api/identity/change-password` was mounted with **no `requireAuth`**
(`authRoutes.ts:71`) and its service took `{ email, newPassword }`, looked the
user up by email, and wrote a new bcrypt hash — **no current password, no OTP,
no session, no ownership check** (`authService.ts:77-96`).

Any unauthenticated caller who knew *any* email address on the platform could
set that account's password and log in as them. Students, teachers, admins
alike. Reachable from anywhere that could reach the host.

### The patch

Three files, minimum viable, no behaviour added beyond the gate:

- `routes/authRoutes.ts:71` — `requireAuth` added, with a comment marking it
  load-bearing so it does not get "cleaned up" later.
- `controllers/authController.ts:changePassword` — now derives the target from
  `req.user.email` rather than the body. `currentPassword` is required. A body
  `email` that does not match the caller's is refused **403** (an omitted one
  defaults to the caller). This is the second half of the fix: `requireAuth`
  alone would still let any logged-in student rewrite an admin's password.
- `services/authService.ts:changePassword` — signature is now
  `(email, currentPassword, newPassword, tenant)` and it
  `bcrypt.compare`s the current password before writing, throwing **401** on
  mismatch. So a stolen-but-still-valid token is no longer a permanent
  password-change key.

`npx tsc --noEmit` in identity-service: clean (exit 0, 60 source files
typechecked).

### Blast radius

- **No frontend caller.** Nothing in `instivera-frontend/src` calls
  `change-password` — grepped for the path, the method name, and any
  forgot/reset flow. The mobile app has no password-change or forgot-password
  screen at all, so this patch cannot break it.
- **⚠️ The web frontend is a separate repo and is not in this tree.** If the
  web app has a "forgot password" flow, it was almost certainly built on this
  endpoint — because until now it worked without a session, which is exactly
  the bug. **That flow will break on deploy, and it should**: a sessionless
  reset must not be served by an endpoint that also serves authenticated
  changes. It needs its own `POST /api/identity/reset-password` gated on a
  verified OTP. Not built here — no caller exists in this repo, and inventing
  one would be scope creep on an incident patch. **Check the web client before
  deploying, and schedule the OTP-gated reset endpoint alongside.**

### Verification

First item on the Phase 3 curl list, as an explicit security assertion — not a
response-shape check. See "0. Security regression checks".

---

## OTP login — throttling review (condition of sign-off)

Checked before endorsing OTP as a primary auth path. **Verdict: throttling
exists and naive brute force is impractical — but there are two gaps that
should close before this becomes the sanctioned login.**

### What is already there (`otpService.ts:148-238`)

- **Send:** 60-second cooldown per email, enforced in SQL against
  `email_otp_requests.created_at`, returning **429** inside the window.
- **Verify:** hard stop at **5 failed attempts** per OTP record; the counter is
  persisted (`attempts`) and incremented on every wrong guess.
- **Expiry:** 10 minutes, and the record is deleted on expiry, on success, and
  whenever a new OTP is issued.
- Same controls exist on the phone OTP path.

Sustained guessing is therefore ~5 attempts per 60s against a code that is
replaced each window: roughly 216,000 guesses a month for a ~19% chance against
one targeted account, while sending that victim ~43,000 OTP emails. Loud,
slow, and self-defeating. Not the practical risk.

### Gap 1 — the cooldown has a bypass an attacker may be able to trigger

`sendEmailOtp` skips the 60s wait when the previous OTP's
`delivery_status === 'failed'` (`otpService.ts:160-167`). The intent is
obvious and reasonable (don't lock a user out because SMTP hiccuped), but the
condition is *mail delivery failure*, which is not always outside an attacker's
influence — a mailbox that reliably bounces or greylists turns the cooldown off
and makes the guess rate unbounded. Attempts-per-OTP (5) would still cap each
code, but codes could then be cycled far faster than once a minute.

### Gap 2 — nothing throttles by IP or caller, anywhere

There is **no rate-limiting middleware in any service** — `express-rate-limit`
is not a dependency of identity, student, teacher or payment services, and no
hand-rolled limiter exists. The per-email DB cooldown is the *only* control.
So: no lockout after repeated failures, no per-IP ceiling, and nothing stopping
one host from running the above against thousands of accounts in parallel. This
restates the Phase 0 note ("the whole auth surface is ungated by rate limiting
at the router level") with the OTP specifics filled in.

### Recommendation before OTP becomes primary auth

1. Per-IP rate limiting on `/send-email-otp` and `/verify-email-otp`
   (and `/authenticate-user`, which has none either).
2. Make the cooldown bypass bounded — e.g. allow at most one bypassed resend
   before falling back to the full 60s, rather than an unlimited bypass keyed
   on delivery status.
3. Consider a short account-level cooldown after N failed OTPs across
   *records*, since issuing a new OTP currently resets `attempts` to 0.

None of this blocks the token-issuing change itself; it blocks calling that
change "done" as a login path.

---

## Phase 3 — Test plan (curl)

Target: `https://collegec.mainapp.instivera.com:8081` (local port assignment is
unresolvable from this repo — Phase 0). Set these once per shell:

```bash
export HOST='https://collegec.mainapp.instivera.com:8081'
export TENANT='{{TENANT}}'
export TOKEN='{{TOKEN}}'          # teacher token unless a block says otherwise
export STUDENT_TOKEN='{{TOKEN}}'  # a student's token
H=(-H "Authorization: Bearer $TOKEN" -H "x-tenant: $TENANT")
SH=(-H "Authorization: Bearer $STUDENT_TOKEN" -H "x-tenant: $TENANT")
```

Every response below should be `{status, message, data}` — note payment-service
and admission-service use a **numeric** `status: 1`, identity/teacher/student
use `"success"`. That difference is expected, not a bug.

---

### 0. Security regression checks — run these first

**These are assertions, not shape checks. A 200 where it says 401/403 means the
patch did not take.**

```bash
# 0a. UNAUTHENTICATED change-password — the incident. MUST be 401.
#     Before the patch this returned 200 and rewrote the password.
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$HOST/api/identity/change-password" \
  -H "x-tenant: $TENANT" -H 'Content-Type: application/json' \
  -d '{"email":"someone.else@example.com","newPassword":"hunter2xyz"}'
# EXPECT: 401
```

```bash
# 0b. Authenticated, but targeting someone else's account. MUST be 403.
curl -s -X POST "$HOST/api/identity/change-password" "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"email":"someone.else@example.com","currentPassword":"whatever","newPassword":"hunter2xyz"}'
# EXPECT: 403 "You can only change your own password"
```

```bash
# 0c. Own account, WRONG current password. MUST be 401.
curl -s -X POST "$HOST/api/identity/change-password" "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"definitely-not-my-password","newPassword":"hunter2xyz"}'
# EXPECT: 401 "Current password is incorrect"
```

```bash
# 0d. Own account, correct current password. Expect 200.
#     ⚠️ THIS REALLY CHANGES A PASSWORD — use a throwaway account.
curl -s -X POST "$HOST/api/identity/change-password" "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"<real current password>","newPassword":"<new password>"}'
# EXPECT: 200 status:1 "Password changed successfully"
```

**Still-open holes — these SHOULD fail (they are unpatched). Confirming they
reproduce is what justifies the tickets:**

```bash
# 0e. Fee IDOR: a student reading another student's fees by query param.
curl -s "$HOST/api/payment/students/assignments?studentId=<another students.id>" "${SH[@]}"
# EXPECT TODAY: 200 with that other student's rows  ← the bug
# AFTER FIX:    the studentId param ignored for role=student
```

```bash
# 0f. Attendance IDOR (found in the student-service pass, unpatched).
curl -s "$HOST/api/student/attendance/my-records?studentId=<another students.id>" "${SH[@]}"
# EXPECT TODAY: 200 with another student's attendance  ← the bug
```

```bash
# 0g. Teacher assignment ownership: read an assignment belonging to a DIFFERENT teacher.
curl -s "$HOST/api/teacher/assignments/<other teacher's assignmentId>" "${H[@]}"
# EXPECT TODAY: 200 — the ownership filter is dropped (req.user.id is undefined → NaN → falsy)
# This also confirms teacher-service finding 4 in one call. PUT/DELETE on the
# same id would succeed too — do NOT test those against real data.
```

---

### 1. teacher-service — endpoints fixed this pass

```bash
# 1a. Teacher assignment list. Envelope is {assignments,total,page,limit}.
curl -s "$HOST/api/teacher/assignments?limit=100&status=active" "${H[@]}"
# CHECK: data.assignments is an array; rows have subject_name (flat, not subject.name),
#        due_date, type, maximum_marks, and `submissions` as a NUMBER (a count).
#        data.total/page/limit present.
```

```bash
# 1b. Assignment detail. Note: works, but see 0g — it does not check ownership.
curl -s "$HOST/api/teacher/assignments/<assignmentId>" "${H[@]}"
# CHECK: flat row + attachments:[{id,fileName,fileUrl}]; class_name and
#        subject_name populated; `submissions` again a count, NOT a list.
```

```bash
# 1c. Submissions feed that backs the grading UI.
curl -s "$HOST/api/teacher/assignments/submitted?limit=200" "${H[@]}"
# CHECK: data.assignments rows carry assignment_id, submission_id, student_name,
#        submitted_at, marks_obtained, grade, feedback, status.
# CONFIRM THE GAP: there is no assignment_id filter — try
#   ...?assignment_id=<id>  and verify it is IGNORED (rows for other assignments
#   still come back). That is why the app filters client-side.
```

```bash
# 1d. Metadata (two calls; there is no combined endpoint).
curl -s "$HOST/api/teacher/metadata/subjects" "${H[@]}"
curl -s "$HOST/api/teacher/metadata/classes"  "${H[@]}"
# CHECK: both are flat arrays of {id, code, name}.
```

```bash
# 1e. Create — sends type/due_time defaults the form does not collect.
curl -s -X POST "$HOST/api/teacher/assignments" "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"title":"curl smoke test","description":"delete me","class_id":<id>,"subject_id":<id>,"due_date":"2026-12-31","type":"Assignment","due_time":"23:59:00","allow_late_submissions":false}'
# CHECK: 201 and `data` is a BARE NUMBER (the insert id), not an object.
# ALSO CONFIRM: omit "type" and "due_time" → EXPECT 400. That is the finding.
# THEN CHECK the created row's program_id/semester_id/academic_year_id are all 1
# (silently defaulted) via 1b.
```

```bash
# 1f. Grade a submission — PUT, not POST; `grade` is ignored.
curl -s -X PUT "$HOST/api/teacher/submissions/<submissionId>/grade" "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"marks_obtained":18,"feedback":"curl test"}'
# CHECK: 200. Then re-read via 1c and confirm the LETTER GRADE the server chose.
# ⚠️ If maximum_marks is 20, marks 18 should be an A/A+ but calculateGrade
#    treats marks as a percentage → expect 'E'. That confirms finding 7.
```

---

### 2. payment-service — endpoints fixed this pass

```bash
# 2a. Fee assignments — the source the whole Fees screen is now built from.
curl -s "$HOST/api/payment/students/assignments" "${SH[@]}"
# CHECK: self-scoped WITHOUT passing studentId (this is the key claim —
#        Phase 0 said no student-scoped endpoint existed; it does).
#        Rows: assignment_id, amount, discount_amount, fine_amount, status
#        (PENDING|PARTIAL|PAID|''), due_date, paid_date, fee_head_name.
# CONFIRM THE GAP: there is NO paid_amount on these rows — which is why a
#        PARTIAL row is counted as fully outstanding.
```

```bash
# 2b. Student payments (history). Also self-scoped.
curl -s "$HOST/api/payment/students" "${SH[@]}"
# CHECK: rows have payment_id, amount, paid_amount, status, paid_date,
#        payment_type_name — and NO assignment_id, which is why 2a and 2b
#        cannot be joined client-side.
```

```bash
# 2c. Initiate — assignmentId in the PATH, amount in the body.
curl -s -X POST "$HOST/api/payment/students/<assignment_id from 2a>/initiate" "${SH[@]}" \
  -H 'Content-Type: application/json' -d '{"amount":<amount>}'
# CHECK: data.paymentId (a DIFFERENT id — student_fee_payments.id),
#        merchantOrderId, amount, redirectUrl.
# ⚠️ This creates a real gateway order. Use a sandbox tenant if one exists.
```

```bash
# 2d. Status — ⚠️ EXPECT THIS TO FAIL. Do not treat a failure as a bad test.
curl -s "$HOST/api/payment/students/<paymentId from 2c>/status" "${SH[@]}"
# EXPECT TODAY, for a payment that HAS a gateway_transaction_id: an upstream
# failure. checkPaymentStatus calls identity with `Bearer ${authUser.token}`,
# but authUser is the decoded JWT {user_id,username,role,email} — there is no
# `token` field, so it sends "Bearer undefined" (studentPaymentController.ts:985).
# The WebView polls this until it times out, so a real payment appears to hang
# even when it succeeded.
#
# For a payment with NO gateway_transaction_id it short-circuits earlier and
# returns 200 {paymentId, gatewayStatus:null, studentPaymentStatus} — that path
# works, and is NOT evidence the bug is absent. Test one that went through 2c.
```

---

### 3. Known-missing endpoints — confirm they 404

Each of these is a frontend call deliberately left unrepointed. A 404 is the
**expected, correct** result and confirms the gap is real rather than a path typo.

```bash
curl -s -o /dev/null -w 'my-attendance:  %{http_code}\n' "$HOST/teacher/my-attendance?month=9&year=2026" "${H[@]}"
curl -s -o /dev/null -w 'repository:     %{http_code}\n' "$HOST/repository/categories" "${SH[@]}"
curl -s -o /dev/null -w 'reg-status:     %{http_code}\n' "$HOST/registration/status/<regId>" -H "x-tenant: $TENANT"
# EXPECT: 404 on all three.
```

```bash
# 4. OTP login — confirm verify issues no token (the Phase 2.5 blocker).
curl -s -X POST "$HOST/api/identity/send-email-otp" \
  -H "x-tenant: $TENANT" -H 'Content-Type: application/json' \
  -d '{"email":"<a real user email>"}'
# EXPECT: 200 {status:1, data:{email, expiresIn:600}}
# Then, with the code from the inbox:
curl -s -X POST "$HOST/api/identity/verify-email-otp" \
  -H "x-tenant: $TENANT" -H 'Content-Type: application/json' \
  -d '{"email":"<same email>","otp":"<6 digits>"}'
# EXPECT TODAY: {status:1, data:{email, verified:true}} and NO token anywhere.
# That is the whole bug: there is nothing for OtpScreen to log in with.
# AFTER THE AGREED FIX: this should return a token + user, same shape as
# /authenticate-user.

# Bonus, confirms the throttling review:
#   repeat send-email-otp within 60s  → EXPECT 429
#   verify with 5 wrong codes         → EXPECT "Too many failed attempts"
#   then request a NEW otp and verify attempts resets to 0  ← the gap
```

---

### Not covered here

Student-service and identity-service endpoints fixed in the **previous** pass
are not re-listed; this block covers what changed in this pass plus the
security assertions. The role-by-role manual QA checklist follows once these
curls come back — it depends on knowing which of the expected-failures actually
reproduce.

### Phase 3 — how to run it

`./phase3-checks.sh` at the repo root runs everything read-only in one pass:

```bash
export TENANT=... TOKEN=<teacher token> STUDENT_TOKEN=<student token>
export OTHER_STUDENT_ID=... OTHER_TEACHER_ASSIGNMENT_ID=... PAYMENT_ID=...
./phase3-checks.sh 2>&1 | tee phase3-results.txt
```

Credentials are read from the environment — nothing secret is written to disk
or into this log. Checks that mutate data are **opt-in** and skipped by default:

| check | flag | why it is gated |
|---|---|---|
| 4 (OTP send) | `RUN_OTP=1 OTP_EMAIL=…` | sends a real email |
| 0d (password change) | `RUN_PASSWORD_CHANGE=1 PW_EMAIL/PW_CURRENT/PW_NEW` | **really changes a password** |

**0d runs last and now has three steps, not one**: change the password → log in
with the **new** password (does the patch still allow the legitimate path?) →
confirm the **old** password is rejected (401). A green 0a with a broken login
would be a worse outcome than the bug.

Three checks stay manual because they create real records — run them from the
curl block above only when you want them: **1e** (creates an assignment),
**1f** (grades a real submission), **2c** (opens a real gateway order). The
script includes only the *negative* half of 1e (omitting `type`/`due_time`,
expecting 400), which mutates nothing.

### Decision recorded — OTP login ships as one bundled patch

Confirmed by the tech lead: implement token issuance in `verifyEmailOtp`
**together with** (a) closing the `delivery_status === 'failed'` cooldown
bypass and (b) per-IP rate limiting on `send-email-otp`, `verify-email-otp`
**and `authenticate-user`** — the password path has no throttle either, which
is a brute-force gap independent of OTP. Not urgent the way the password bug
was (OTP login currently just 401s, so nothing is exploitable today), but the
throttling must not become a follow-up ticket: the moment OTP login works, a
6-digit code rate-limited only per-email becomes the primary account-takeover
surface. One patch, or neither half.
