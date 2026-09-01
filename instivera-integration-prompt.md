# Instivera Mobile ↔ Backend Integration — Prompt for Claude Code

Paste this whole thing as your first message to Claude Code, run from the root
of the `instivera-mobile` repo (so both `instivera-frontend` and
`instivera-backend` are visible to it).

---

## Ground rules — read this before touching anything

1. **Never run long-lived or interactive processes yourself.** No `expo start`,
   `npm run ios`, `npm run android`, no dev servers, nothing that blocks or
   watches. I run all of those in my own terminal — you're too slow at it and
   it wastes both our time. If a step needs the app or a server running,
   **stop and hand me the exact command(s) to run**, tell me exactly what
   output/behavior to look for, and wait for me to paste back what happened.
2. **Fast, read-only commands are fine to run yourself** — `grep`, `cat`,
   `ls`, `tsc --noEmit`, `eslint`, `git diff`, `git log`. Anything that
   returns in under a couple seconds and doesn't touch a live server.
3. **Work in small, verifiable phases.** After each phase below, stop, show
   me a summary of what changed (file list + one-line reason each), and wait
   for my go-ahead before starting the next phase. Don't chain all phases
   together in one pass.
4. **If you hit a bug or mismatch you can't resolve in ~2 attempts, stop.**
   Don't keep guessing and re-editing. Instead: state your current hypothesis,
   the single most informative next diagnostic step, and ask me to run it and
   paste the output. I'd rather spend one round-trip confirming a hypothesis
   than have you burn ten trying random fixes.
5. **Never fabricate or mock a response to make something "work."** If a
   screen calls an endpoint that doesn't exist on the backend, or the
   response shape doesn't match what the frontend expects, say so explicitly
   as a finding. Do not silently stub data just to get past it.
6. **Keep a running log.** Create/update `INTEGRATION_LOG.md` at the repo
   root as you go — one section per phase, listing what was found and what
   was fixed. This is so context survives if we pick this up in a new
   session.
7. **Don't touch anything outside the scope of a phase.** No refactors, no
   "while I'm here" cleanups, no renaming. If you notice something else
   broken, note it in `INTEGRATION_LOG.md` under "Out of scope — noted" and
   move on.

---

## Project context

- `instivera-frontend`: Expo / React Native app (TypeScript), Riverpod-style
  hooks via TanStack Query, `zustand` for auth state, `axios` client in
  `src/api/client.ts`, per-service modules in `src/api/modules/*.ts`.
- `instivera-backend`: 13 independent Node/Express/TypeScript microservices
  (`identity-service`, `student-service`, `teacher-service`, `chat-service`,
  `payment-service`, `fees-management-service`, `finance-service`,
  `admission-service`, `accreditation-service`, `inventory-management-service`,
  `lead-management-service`, `library-management-service`,
  `social-media-service`), each with its own `server.ts` and its own
  `/api/<service-name>` mount prefix. **There is no unified gateway** — every
  service is reached directly on the same origin.
- Tenancy: resolved via an `x-tenant` request header, enforced by
  `tenantMiddleware` in each service. This part is already correctly wired on
  both sides — don't change it.
- Auth: plain JWT, 24-hour expiry, **no refresh token**. This is intentional
  for now — **do not add refresh-token logic, rotation, or a new DB table in
  this pass.** That's a separate, deferred piece of work. If a 401 happens,
  the existing behavior (clear stored token, force re-login) is correct and
  should stay as-is.
- Three roles in the app: **Admin, Teacher, Student.** Screens/permissions
  differ per role — several backend routes are gated with `requireRole(...)`.

---

## Phase 0 — Baseline audit (no edits yet)

Before changing anything, build a full picture of the current state:

1. For every service in `instivera-backend`, read its `server.ts` and list
   every `app.use("/api/<x>/...", someRouter)` mount line, then open each
   mounted router file and list every route it defines. Produce a flat list
   of **every real backend endpoint**: method + full path + which
   controller/role-guard it uses.
2. For every file in `instivera-frontend/src/api/modules/*.ts`, list every
   `client.get/post/put/delete/patch(...)` call and the path it uses.
3. Produce a single markdown table: `frontend module | line | path called |
   matching backend endpoint (or "NO MATCH") | status`.
4. Show me this table before editing anything. Don't fix anything yet —
   this phase is just so we both know the true size of the gap.

---

## Phase 1 — Core config

1. Fix `src/config/env.ts` so it resolves to the **bare backend origin**,
   with no `/api/mobile` or any other suffix — every module supplies its own
   full `/api/<service>` path.
2. Update `.env.example` to match.
3. Confirm `src/api/client.ts`'s `baseURL: API_URL` doesn't need changes
   (it shouldn't, if step 1 is done right) — just verify, don't restructure
   the interceptors.
4. Stop here and show me the diff for confirmation before moving on.

---

## Phase 2 — Fix every module, service by service

Work through the services in this order (roughly matches dependency order —
nothing else works until auth does):

1. `identity-service` → `auth.api.ts`, `institutions.api.ts`, and any other
   module hitting identity (RBAC, class-routines, profile, etc.)
2. `student-service` → `student.api.ts`, and any assignment/learning-material
   modules that live under it
3. `teacher-service` → `teacherAttendance.api.ts`, `timetable.api.ts`
4. `chat-service` → `chat.api.ts` — **also check whether chat-service's
   `server.ts` actually initializes a `socket.io` server.** I found a
   reference to it in `ChatService.ts` but no real `new Server(...)` setup —
   confirm whether real-time chat is actually wired up server-side or if
   it's still a stub, and note this clearly in the log either way.
5. `payment-service`, `fees-management-service`, `finance-service` →
   `payment.api.ts` and anything fee-related
6. Remaining services (`admission`, `accreditation`, `inventory-management`,
   `lead-management`, `library-management`, `social-media`) → whichever
   admin-facing modules use them

For each module:
- Fix the path to match the real backend route from the Phase 0 table.
- **Check the response shape**, not just the path — open the controller and
  compare its actual JSON response (e.g. does it return `{status, data,
  message}`, or does something like `token` sit outside `data`?) against how
  the frontend module unwraps it (`response.data.data`, etc.) and against the
  corresponding type in `src/types/*.ts`. Fix any mismatch you find, and
  flag it explicitly in the log since these are easy to miss silently.
- If a frontend module calls something with **no matching backend route at
  all**, don't invent one and don't stub around it — log it under "Missing
  backend endpoints" and move to the next module.

Pause after each service and show me a short diff summary before continuing
to the next one.

---

## Phase 3 — Test plan handoff (you don't run the app — I do)

For each service you fixed in Phase 2, instead of trying to run the app
yourself:

1. Write me a ready-to-paste `curl` command per fixed endpoint (with
   placeholder `{{TOKEN}}` / `{{TENANT}}` values) that I can run directly
   against the real backend to sanity-check the response shape, independent
   of the app. This is our fast feedback loop — no slow app rebuilds needed
   just to check if an endpoint responds correctly.
2. Once I confirm the endpoints respond correctly via curl, write a manual
   QA checklist organized by role — **Admin**, **Teacher**, **Student** —
   mapping each existing screen under `src/screens/` to what to tap through
   and what to verify. I'll run the app myself and work through this
   checklist, then report back what broke.
3. Don't ask me to run the whole app before Phase 1 and 2 are both done and
   reviewed — get the config and paths right first, or every test will fail
   on the same root cause repeatedly.

---

## Phase 4 — Wrap-up

1. Finalize `INTEGRATION_LOG.md` with: what was fixed (by service), what's
   still missing on the backend, what was intentionally deferred (refresh
   tokens, anything else flagged as out-of-scope), and any open questions
   for me or the tech lead.
2. Show me the full `git diff --stat` across the whole repo as a final
   summary before I commit anything.

---

## Explicit "do not" list

- Do not add refresh-token, token-rotation, or session-table logic.
- Do not run `expo start`, `npm run ios`, `npm run android`, or any
  long-lived/interactive/watch process.
- Do not fabricate mock responses to make a broken call appear to work.
- Do not touch admin business logic or unrelated files "while you're in
  there."
- Do not skip ahead to Phase 2/3 without showing me the Phase 0 table and
  Phase 1 diff first.
