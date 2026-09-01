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

### teacher-service — next

---

## Phase 3 — Test plan

Target: **`https://collegec.mainapp.instivera.com:8081`**, not local. Local
port assignment is not resolvable from this repo (Phase 0: duplicate default
ports, no proxy config in-tree), so curl checks run against the deployed host.
