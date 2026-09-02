# Instivera Backend

Backend for the Instivera mobile app: 16 independent Express + TypeScript
services over a multi-tenant MySQL database. Each service has its own
`server.ts`, its own `/api/<service>` mount prefix, and its own port.

This document covers how to run and test the whole thing locally, what was
fixed in the September 2026 authorization pass, and what is still broken.

---

## 1. Quick start

```bash
# one-time, per service you intend to run
cd <service> && npm install

# start the seven services the mobile app uses, plus a local gateway
./devtools/run-services.sh
./devtools/run-services.sh status
./devtools/run-services.sh stop
```

Logs land in `devtools/logs/<service>.log`. When a request fails in a way the
HTTP response does not explain, that log is where the real error is.

Smoke test:

```bash
curl -sS localhost:4000/api/identity/institutions -H 'x-tenant: collegec'
```

### Why there is a gateway

The mobile app resolves **one** origin and appends `/api/<service>/...`.
Deployed, something in front of the VM fans that out to 16 upstreams (see
`NGINX-Setup.docx` in the ShikshaPrime repo). Locally each service listens on
its own port, so without a gateway the app can only ever reach one of them.

`devtools/gateway.js` is that missing piece — zero dependencies, routes on the
`/api/<service>` prefix, streams multipart through untouched:

| prefix | port |
|---|---|
| `/api/identity` | 9050 |
| `/api/student` | 9051 |
| `/api/teacher` | 9052 |
| `/api/payment` | 9053 |
| `/api/chat` | 9054 |
| `/api/admission` | 9041 |
| `/api/fees-management` | 9059 |

Ports come from each service's `.env.development` (`SERVICE_PORT`). Those files
are git-ignored and are **not** in the repo — get them from the team.

### Pointing the mobile app at your local stack

`instivera-frontend/src/config/env.ts` falls back to the Metro debug host on
port 4000, which is exactly where the gateway listens — so with no `.env` at
all the app hits your local backend. To be explicit:

```
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:4000
```

`127.0.0.1` works on a simulator but never on a physical device.

---

## 2. Tenancy — read this before you debug anything

Every request needs an `x-tenant` header. The value selects the database:
tenant `collegec` means database and DB user `shikshaprime_collegec`. The
`tenants` table lives in `shikshaprime_main`.

**Use `collegec`.** It is also the tenant the deployed app uses.

| tenant | `name` column | `subdomain` | usable? |
|---|---|---|---|
| 1 | `College A` | `collegea` | no |
| 2 | `College B` | `collegeb` | no |
| 4 | `collegec` | `collegec` | **yes** |
| 7 | `colleged` | `colleged` | yes |

`collegea` and `collegeb` fail on anything that resolves a tenant record —
registration, readmission, subject selection, all rules-driven logic — because
`getTenantByName` matches the **`name`** column while every caller passes the
**subdomain**. They still work for endpoints that only need the DB connection,
which makes the failure look intermittent. See finding S1.

### Three failure modes that look like bugs and are not

1. **`Invalid tenant: X`** → the tenant name/subdomain mismatch above.
2. **`Access denied for user 'shikshaprime_X, X'@...`** → you sent the
   `x-tenant` header **twice**. Node joins duplicate headers with `", "`, and
   the result is interpolated into a database name. Check your curl before
   suspecting credentials.
3. **`zsh: command not found: #`** → zsh does not treat `#` as a comment
   interactively. Run `setopt interactive_comments` once.

Always use `curl -sS`, never `-s` alone: `-s` silences curl's own errors, so a
missing upload file produces total silence instead of `curl: (26)`.

---

## 3. Creating test users

There is **no self-service path to a student or teacher account.** Plan for
this — it is the main thing that blocks end-to-end testing.

### Applicant (public, no auth)

```bash
curl -sS -w '\nHTTP %{http_code}\n' -X POST localhost:4000/api/admission/registerApplicant \
  -H 'x-tenant: collegec' \
  -F 'username=qa_user_01' -F 'password=Test@1234' -F 'email=qa+user01@example.com' \
  -F 'first_name=QA' -F 'last_name=Tester' -F 'gender=MALE' -F 'dob=2005-01-01' \
  -F 'nationality=Indian' -F 'state=Delhi' -F 'district=New Delhi' \
  -F 'social_category=UNRESERVED' -F 'mobile=9999999999' \
  -F 'hs_year_of_passing=2026' -F 'hs_board=CBSE' \
  -F 'hs_registration_number=R1' -F 'hs_roll_number=1' \
  -F 'hs_registration_certificate=@devtools/fixtures/hs-certificate.pdf;type=application/pdf'
```

The certificate file is **required**, and the upload middleware whitelists by
MIME type — state `;type=application/pdf` explicitly. Gate conditions: the
tenant's `admission_mode` rule must not be `CENTRAL_PORTAL`, and
`hs_year_of_passing` must satisfy `allow_gap_years` / `max_gap_years`
(`collegec` allows a 3-year gap). Creates a user with role `applicant`.

### Applicant → student (needs an admin token)

```bash
curl -sS -X POST localhost:4000/api/admission/application/student/create \
  -H 'x-tenant: collegec' -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' \
  -d '{"user_id":<from the register response>,"semester_id":1}'
```

Sets `users.role = 'student'` and builds the `students` row from the
pre-registration record. **It does not create `student_personal_details`**, and
the payment queries `INNER JOIN` that table — so a student created this way
sees an empty fee list. An empty result is therefore *not* evidence that a
scoping fix works. To get a student with real fee data, either complete the
full applicant journey first (`/application/personal-details` → `/address-details`
→ `/guardian-details` → `/secondary-result` → `/higher-seconday-result` →
`/upload-documents` → `/preview-confirm`, each as the applicant) or insert the
`spd` row directly.

### Teacher (needs an admin token)

```bash
curl -sS -X POST localhost:4000/api/teacher/faculty \
  -H 'x-tenant: collegec' -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' \
  -d '{"first_name":"QA","last_name":"TeacherA","email":"qa+teachera@example.com","department_id":4}'
```

`department_id` is required by the table even though the controller does not
validate it (finding B5). The service also creates a `users` row with role
`teacher` and the hardcoded password `password123` (finding B4).

### Login

```bash
curl -sS -X POST localhost:4000/api/identity/authenticate-user \
  -H 'x-tenant: collegec' -H 'content-type: application/json' \
  -d '{"username":"qa_user_01","password":"Test@1234"}'
```

`username` accepts the email too. **The token sits outside `data`** in the
response — a known shape mismatch with `auth.api.ts`. Role is baked into the
JWT at login, so after promoting an applicant you must log in again.

---

## 4. Testing

Two scripts, both read-only by default with mutating checks behind flags.

```bash
# broad surface sweep + regression asserts for the three fixes
export TENANT=collegec ADMIN_USER=... ADMIN_PASS=...
./devtools/remaining-checks.sh 2>&1 | tee devtools/remaining-results.txt

# the older, narrower Phase 3 script (repo root)
export TENANT=... TOKEN=<teacher> STUDENT_TOKEN=<student>
./phase3-checks.sh
```

Opt-in mutating checks: `RUN_OTP=1 OTP_EMAIL=…` (sends real mail),
`RUN_SESSION=1` (creates an attendance session), `RUN_PAYMENT=1 ASSIGNMENT_ID=…`
(opens a real PhonePe UAT order).

### How to test an authorization fix honestly

An empty result proves nothing on its own — it can mean "blocked" or "the join
matched nothing". Always run a control with a privileged caller first:

```bash
# control: admin sees the data
curl -sS "localhost:4000/api/payment/students?studentId=33" -H "$T" -H "Authorization: Bearer $ADMIN"
# test: identical request, student caller
curl -sS "localhost:4000/api/payment/students?studentId=33" -H "$T" -H "Authorization: Bearer $STUDENT"
```

Same endpoint, same data, only the role differs. For deletes, verify the row
still exists afterwards — a handler that reports success while deleting nothing
looks identical to one that works.

### Untested areas

Session attendance (needs a routine entry the caller owns), assignment
submission and grading (needs a student in a class with an assignment), payment
initiate → status, and OTP login. Chat cannot be meaningfully tested — see §7.

---

## 5. Fixed in this pass — all verified end-to-end

| fix | evidence |
|---|---|
| **Teacher assignment ownership.** `getAssignmentById` / `updateAssignment` / `deleteAssignment` resolved the caller with `req.user.id`, a claim the JWT does not carry, so `parseInt(undefined)` → `NaN` → falsy → the ownership clause was omitted entirely. Any authenticated user could read, rewrite or delete any assignment in the tenant. Now use `getFacultyIdFromUser` like the 18 sibling handlers. | Non-owning teacher gets 404 on read, update and delete; row confirmed intact with original title; owner's delete removes it (checked in the DB) |
| **Assignment delete filtered on a non-existent column** (`faculty_id`; the column is `teacher_id`) and returned `true` unconditionally, so a non-owner got "deleted successfully" while nothing was deleted. Corrected, plus an ownership pre-check so a non-owner gets a real 404. | as above |
| **`requireRole('teacher')`** added to assignment PUT and DELETE. | student token → 403 "Forbidden: insufficient role" |
| **Payment IDOR.** `/students`, `/students/assignments` and `/students/reports` applied the `studentId` query param *before* the role branch, so a student passing another student's id got their fee rows. Now role-scoped at all three call sites. A second door — `studentEmail` read from the query string — was found and closed at the same time. | admin `?studentId=33` → 52 rows; student, identical request → 0 rows |
| **fees-management unauthenticated routes.** `/dues/:student_id`, `/receipts/:receipt_id` and `/receipts/student/:student_id` had no auth and no ownership check — anyone reachable could enumerate any student's dues by incrementing an id. Now `requireAuth` plus `assertCanReadStudent` (`src/utils/studentScope.ts`), which passes staff through and pins student callers to their own row. | 401 unauthenticated, 403 student→other, 200 admin |

---

## 6. Not fixed — open findings

Numbered for reference in tickets. **All are backend-only unless noted.**

### High

- **B1 — `/api/student/me` returns 500.** `studentService.ts:436` and `:582`
  select `st.religion`, but `religion` is a column on
  `student_personal_details`, not `students`. Line 371 already does it
  correctly (`spd.religion`). **The profile screen is dead for every student.**
  The app never reads `religion` at all — pure backend, one-word fix.
- **B2 — `/api/student/attendance/summary` is an IDOR.** `authRoutes.ts:144`
  has `requireAuth` only, no role gate and no self-scoping. A student token
  returns every student's name, department and attendance percentage. The
  sibling `my-records` on line 145 *is* gated. Same family as the fixes above.
- **B3 — public registration returns `password_hash`.** `registerApplicant`
  serialises the whole Sequelize `User` model, so an unauthenticated caller
  gets a bcrypt hash back. Select fields explicitly.
- **B4 — every faculty account gets the hardcoded password `password123`**
  (`facultyService.ts`), never forced to change. Needs a reset flow, not just a
  code change.
- **B6 — `createAssignment` returns 500 when `detailed_instructions` is
  absent.** The INSERT names `:detailed_instructions` unconditionally, so a
  missing key throws inside Sequelize's `injectReplacements`. *Has a frontend
  component:* `CreateAssignmentScreen.tsx:111` sends
  `instructions.trim() || undefined` and `JSON.stringify` drops `undefined`, so
  **any teacher who leaves Instructions blank gets a 500.** Fix belongs in the
  backend — the field is optional by intent.
- **B8 — `/api/student/assignments/filter` returns 500.** SQL syntax error near
  `LEFT JOIN subjects sub`, triggered when called with no filters — which is
  how the app's assignment list calls it.

### Medium

- **B9 — `/api/teacher/metadata/semesters` returns 500.** `Unknown column
  'sem.class_id'`; the live `semesters` table has `program_id`.
- **B10 — `/api/teacher/metadata/departments` returns 500.** `Table
  'teacher_classes' doesn't exist` — neither `teacher_classes` nor
  `teacher_class_assignments` is present in the tenant DB.
  B9 and B10 kill two of the six dropdowns on `CreateAssignmentScreen`.
- **B7 — `updateAssignment` 500s on any partial update.** Its `SET` clause
  names all ten columns unconditionally, same root cause as B6. API-only; the
  app never PUTs assignments.
- **`/api/chat/teachers` exposes the full staff directory** — names and email
  addresses — to a student token. May be intended for a chat picker; needs a
  decision.
- **Assignment attachments are unauthenticated** (`facultyRoutes.ts`, commented
  "Public file access"). Any attachment is readable by anyone who can guess the
  path.

### Low

- **B5 — `createFaculty` 500s instead of 400** on a missing `department_id`; it
  validates only `first_name`/`last_name`, and its error string names fields it
  does not check (`employee_id and employee_name`).
- `getPaymentById` reads `req.params.id` on a `:paymentId` route — can only
  ever 404.
- `checkPaymentStatus` sends `Bearer ${authUser.token}`, a field the decoded JWT
  does not have, so the header is literally `Bearer undefined`. **This breaks
  the payment WebView's status polling end-to-end** — a successful payment
  appears to hang. `initiatePaymentGateway` forwards
  `req.headers.authorization` correctly; copy that.
- `calculateGrade` treats marks as a percentage regardless of `maximum_marks`,
  so 18/20 grades as an `E`.
- `student_fee_assignments` has no `paid_amount`, so a PARTIAL row counts as
  fully outstanding and the app overstates balances.
- `getFacultyAssignments` string-interpolates `facultyId`, `subject_id` and
  `program_id` into SQL. Values are `parseInt`ed today, so not exploitable from
  the current route — one careless caller from injection.

### Structural

- **S1 — `getTenantByName` matches `name`, callers pass the subdomain**
  (`shared/tenants/tenants.service.ts`). One-line fix in shared code; affects
  all 16 services, so it needs a deliberate decision.
- **S2 — an unknown tenant surfaces as a MySQL 500**, not a 400.
  `tenantMiddleware` checks only that the header exists and is a string before
  the value is interpolated into a DB name and DB username. Validating against
  the `tenants` table would close the boundary and make every typo a clean 400.
- **S3 — `getFacultyIdFromUser` falls back to the first active teacher in the
  tenant** when it cannot match the caller. The ownership fixes above now
  depend on this helper, so a teacher without a linked `teachers` row silently
  assumes another teacher's identity. Removing the fallback touches 21 handlers
  and may break environments with incomplete user↔teacher linkage — **left open
  deliberately, needs a decision.**
- **`getSubmittedAssignments` has no `assignment_id` filter**, so the app
  over-fetches (`limit=200`) and filters client-side. Any teacher with more
  than 200 submissions sees a truncated list.
- `communication-service` and `compliance-service` mount swagger and a root
  handler but no routers — they serve nothing.

---

## 7. What the mobile app still cannot reach

40 of 50 request paths resolve. The remaining 10 are blocked on missing
backend, not on wiring:

| surface | calls | what is needed |
|---|---|---|
| chat | 6 | The app is built around conversations; the backend exposes message-level routes (`/messages/direct`, `/messages/class-broadcast`) and fixed-audience lookups. Needs create-direct, create-group, post-by-conversation-id and cross-role user search — plus a socket server: `socket.io` is a dependency but is never instantiated in `server.ts`. Even `GET /api/chat/conversations`, whose path matches, returns 400 `userId and userType are required`. |
| repository | 2 + download | The entire service. Note the `Library` tab in the app renders the repository stack — unrelated to `library-management-service`. |
| `teacher/my-attendance` | 1 | `GET /api/teacher/staff-attendance/me?month&year`. The admin-scoped route would leak other staff's records. |
| `registration/status/:regId` | 1 | A public lookup — the screen lives in the auth stack, so the caller has no account yet. |

---

## 8. Test data hygiene

The dev environment points at a **shared** database
(`shikshaprime_<tenant>` on the team's MySQL host), not a local one. Everything
you create is visible to everyone and there is no rollback. Prefix test
accounts (`qa_`, `qa+…@example.com`) and record the ids you create.

`registerApplicant` emails every admin in the tenant on success, and the OTP
endpoints send real mail. Use addresses you control.

The ShikshaPrime repo root carries `shikshaprime_main.sql` and
`shikshaprime_college.sql` — with those, a fully local MySQL is possible and
the shared database can be left alone. That is the better long-term setup.
