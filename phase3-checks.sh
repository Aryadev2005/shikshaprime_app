#!/usr/bin/env bash
# Phase 3 verification — run from the repo root.
#
#   export TENANT=...  TOKEN=<teacher>  STUDENT_TOKEN=<student>
#   ./phase3-checks.sh 2>&1 | tee phase3-results.txt
#
# Reads credentials from the environment: nothing secret is written to disk.
# Read-only by default. Mutating checks are OPT-IN via flags, and 0d (a real
# password change) is deliberately last.

set -uo pipefail
HOST="${HOST:-https://collegec.mainapp.instivera.com:8081}"
: "${TENANT:?set TENANT}"; : "${TOKEN:?set TOKEN (teacher)}"
STUDENT_TOKEN="${STUDENT_TOKEN:-$TOKEN}"

H=(-H "Authorization: Bearer $TOKEN"          -H "x-tenant: $TENANT")
SH_=(-H "Authorization: Bearer $STUDENT_TOKEN" -H "x-tenant: $TENANT")
JSON=(-H 'Content-Type: application/json')

hdr()  { printf '\n\033[1m── %s\033[0m\n' "$*"; }
want() { printf '   EXPECT: %s\n' "$*"; }
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$@"; }
body() { curl -s --max-time 20 "$@" | head -c 900; echo; }

echo "host=$HOST tenant=$TENANT  $(date)"

# ─────────────────────────── 0. SECURITY ASSERTIONS ───────────────────────────
hdr "0a  change-password, UNAUTHENTICATED  [THE INCIDENT]"
want "401 — a 200 here means the patch is not deployed"
echo "   GOT: $(code -X POST "$HOST/api/identity/change-password" -H "x-tenant: $TENANT" "${JSON[@]}" \
  -d '{"email":"someone.else@example.com","newPassword":"hunter2xyz"}')"

hdr "0b  change-password, authed but targeting ANOTHER account"
want "403 'You can only change your own password'"
body -X POST "$HOST/api/identity/change-password" "${H[@]}" "${JSON[@]}" \
  -d '{"email":"someone.else@example.com","currentPassword":"whatever","newPassword":"hunter2xyz"}'

hdr "0c  change-password, own account, WRONG current password"
want "401 'Current password is incorrect'"
body -X POST "$HOST/api/identity/change-password" "${H[@]}" "${JSON[@]}" \
  -d '{"currentPassword":"definitely-not-my-password","newPassword":"hunter2xyz"}'

# ── still-unpatched holes: these SHOULD reproduce ──
hdr "0e  FEE IDOR — student reads another student's fees   [expect the bug]"
want "200 with the OTHER student's rows = bug confirmed. 403/empty = already fixed"
if [ -n "${OTHER_STUDENT_ID:-}" ]; then
  body "$HOST/api/payment/students/assignments?studentId=$OTHER_STUDENT_ID" "${SH_[@]}"
else echo "   SKIPPED — set OTHER_STUDENT_ID=<another students.id>"; fi

hdr "0f  ATTENDANCE IDOR — another student's attendance    [expect the bug]"
want "200 with the OTHER student's records = bug confirmed"
if [ -n "${OTHER_STUDENT_ID:-}" ]; then
  body "$HOST/api/student/attendance/my-records?studentId=$OTHER_STUDENT_ID" "${SH_[@]}"
else echo "   SKIPPED — set OTHER_STUDENT_ID"; fi

hdr "0g  TEACHER OWNERSHIP — read another teacher's assignment  [expect the bug]"
want "200 = ownership filter dropped (req.user.id undefined -> NaN -> falsy)"
if [ -n "${OTHER_TEACHER_ASSIGNMENT_ID:-}" ]; then
  echo "   GOT: $(code "$HOST/api/teacher/assignments/$OTHER_TEACHER_ASSIGNMENT_ID" "${H[@]}")"
else echo "   SKIPPED — set OTHER_TEACHER_ASSIGNMENT_ID=<an assignment owned by a DIFFERENT teacher>"; fi

# ─────────────────────────── 1. TEACHER-SERVICE ───────────────────────────────
hdr "1a  teacher assignment list"
want "data.assignments[]; flat subject_name; 'submissions' is a NUMBER; total/page/limit"
body "$HOST/api/teacher/assignments?limit=100&status=active" "${H[@]}"

hdr "1c  submissions feed"
want "rows with assignment_id + submission_id + student_name + marks_obtained"
body "$HOST/api/teacher/assignments/submitted?limit=200" "${H[@]}"

hdr "1c-gap  assignment_id filter is IGNORED"
want "same/overlapping rows as 1c (filter unsupported) — this justifies client-side filtering"
body "$HOST/api/teacher/assignments/submitted?limit=200&assignment_id=1" "${H[@]}"

hdr "1d  metadata (two endpoints, no combined one)"
want "flat arrays of {id, code, name}"
body "$HOST/api/teacher/metadata/subjects" "${H[@]}"
body "$HOST/api/teacher/metadata/classes"  "${H[@]}"

hdr "1e-negative  create WITHOUT type/due_time"
want "400 — proves the form must supply both"
echo "   GOT: $(code -X POST "$HOST/api/teacher/assignments" "${H[@]}" "${JSON[@]}" \
  -d '{"title":"curl negative test","subject_id":1,"due_date":"2026-12-31"}')"

# ─────────────────────────── 2. PAYMENT-SERVICE ───────────────────────────────
hdr "2a  fee assignments — self-scoped WITHOUT studentId  [the Phase 0 correction]"
want "200 with only YOUR rows; fields assignment_id/amount/discount_amount/fine_amount/status/due_date/fee_head_name; NO paid_amount"
body "$HOST/api/payment/students/assignments" "${SH_[@]}"

hdr "2b  student payments — self-scoped"
want "payment_id/amount/paid_amount/status/paid_date/payment_type_name; NO assignment_id (so 2a and 2b cannot be joined)"
body "$HOST/api/payment/students" "${SH_[@]}"

hdr "2d  payment status   [!! EXPECTED TO FAIL !!]"
want "upstream failure for a payment WITH gateway_transaction_id ('Bearer undefined')."
echo "   NOTE: a payment with NO gateway_transaction_id short-circuits and returns 200"
echo "         {gatewayStatus:null,...}. That is NOT evidence the bug is absent."
if [ -n "${PAYMENT_ID:-}" ]; then body "$HOST/api/payment/students/$PAYMENT_ID/status" "${SH_[@]}"
else echo "   SKIPPED — set PAYMENT_ID=<one that has been through /initiate>"; fi

# ─────────────────────── 3. KNOWN-MISSING (404 = correct) ─────────────────────
hdr "3  endpoints with no backend counterpart — 404 is the PASS condition"
printf '   my-attendance : %s\n' "$(code "$HOST/teacher/my-attendance?month=9&year=2026" "${H[@]}")"
printf '   repository    : %s\n' "$(code "$HOST/repository/categories" "${SH_[@]}")"
printf '   reg-status    : %s\n' "$(code "$HOST/registration/status/TEST123" -H "x-tenant: $TENANT")"
want "404 on all three"

# ─────────────────────────── 4. OTP (read-only part) ──────────────────────────
hdr "4  OTP send + throttle"
if [ "${RUN_OTP:-0}" = "1" ] && [ -n "${OTP_EMAIL:-}" ]; then
  body -X POST "$HOST/api/identity/send-email-otp" -H "x-tenant: $TENANT" "${JSON[@]}" -d "{\"email\":\"$OTP_EMAIL\"}"
  echo "   -- immediate resend, expect 429 --"
  echo "   GOT: $(code -X POST "$HOST/api/identity/send-email-otp" -H "x-tenant: $TENANT" "${JSON[@]}" -d "{\"email\":\"$OTP_EMAIL\"}")"
  echo "   Now verify by hand with the emailed code; EXPECT {email,verified:true} and NO token."
else echo "   SKIPPED — RUN_OTP=1 OTP_EMAIL=<real user email> (sends a real email)"; fi

# ══════════════════════ 0d — LAST, and only on request ════════════════════════
hdr "0d  REAL password change + re-authentication   [MUTATES — opt in]"
if [ "${RUN_PASSWORD_CHANGE:-0}" = "1" ]; then
  : "${PW_EMAIL:?set PW_EMAIL}"; : "${PW_CURRENT:?set PW_CURRENT}"; : "${PW_NEW:?set PW_NEW}"
  echo "   changing password for $PW_EMAIL ..."
  body -X POST "$HOST/api/identity/change-password" "${H[@]}" "${JSON[@]}" \
    -d "{\"currentPassword\":\"$PW_CURRENT\",\"newPassword\":\"$PW_NEW\"}"
  want "200 status:1 'Password changed successfully'"
  echo "   -- re-authenticating with the NEW password (did the patch break the legit path?) --"
  body -X POST "$HOST/api/identity/authenticate-user" -H "x-tenant: $TENANT" "${JSON[@]}" \
    -d "{\"username\":\"$PW_EMAIL\",\"password\":\"$PW_NEW\"}"
  want "200 with a token — if this fails, the patch broke the legitimate path"
  echo "   -- old password must now be rejected --"
  echo "   GOT: $(code -X POST "$HOST/api/identity/authenticate-user" -H "x-tenant: $TENANT" "${JSON[@]}" \
    -d "{\"username\":\"$PW_EMAIL\",\"password\":\"$PW_CURRENT\"}")"
  want "401"
else echo "   SKIPPED — RUN_PASSWORD_CHANGE=1 PW_EMAIL=.. PW_CURRENT=.. PW_NEW=.. (throwaway account only)"; fi

echo; echo "done."
