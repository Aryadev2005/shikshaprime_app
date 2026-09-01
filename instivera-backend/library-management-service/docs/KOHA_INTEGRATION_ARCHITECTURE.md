# KOHA Integration Architecture Document (College ERP)

**Version:** 1.0  
**Date:** May 27, 2026  
**Scope:** ERP-to-KOHA integration via KOHA REST API v1

## 1. Objective and Scope

### Goal
Design and implement a robust ERP Library module where:
- ERP provides library-facing workflows (book search, student status, clearance checks, admin mapping, health checks).
- KOHA remains the single source of truth for catalog, checkouts, holds, and patron account/fines.
- ERP integrates only through KOHA REST APIs (`/api/v1/...`), with no direct KOHA DB coupling.

### Out of Scope
- KOHA internals: MARC21 cataloging, acquisitions, serials, authority control, indexing.
- KOHA infra operations: installation, backups, replication, OS-level monitoring.

## 2. Architecture Overview

### 2.1 Components
- ERP Frontend (Web)
- ERP Backend (`library-management-service`)
- KOHA Server (`/api/v1` REST)
- ERP Tenant DB (mapping + audit + settings)
- Optional cache (Redis)

### 2.2 Logical Flow
1. Frontend calls ERP API (`/api/library/...`).
2. ERP resolves tenant and local mapping (`student_id -> koha_patron_id`).
3. ERP calls KOHA REST endpoints via a dedicated `KohaClient`.
4. ERP normalizes KOHA payloads and applies business rules.
5. ERP returns consistent JSON to frontend.
6. ERP logs clearance checks in `library_clearance_logs`.

## 3. ERP Data Model

ERP stores only integration metadata and audit logs.

### 3.1 `library_patrons`
- `id` (PK)
- `student_id` (FK to ERP student/teacher)
- `koha_patron_id` (KOHA patron/borrower identifier)
- `patron_type` (`STUDENT` | `STAFF`)
- `is_active`, `is_deleted`
- `created_at`, `updated_at`

### 3.2 `library_clearance_logs`
- `id` (PK)
- `student_id`
- `koha_patron_id`
- `has_pending_books`
- `pending_books_count`
- `pending_fine_amount`
- `is_clear`
- `checked_at`
- `context` (`RESULT_PUBLISH`, `MANUAL_CHECK`, etc.)
- `checked_by`, `remarks`
- `is_deleted`

### 3.3 `koha_settings` (Required; confirmed in your DB)
- `id` (PK)
- `setting_key`
- `setting_value`
- `setting_group`
- `description`
- `is_encrypted`
- `is_active`
- `created_at`, `updated_at`
- `is_deleted`

Required keys (minimum):
- `KOHA_BASE_URL`
- `KOHA_TIMEOUT_MS`
- `KOHA_RETRY_COUNT`
- `KOHA_USERNAME` + `KOHA_PASSWORD` **or** `KOHA_API_KEY`

## 4. KOHA API Integration Design

### 4.1 Authentication
Supported auth modes:
- Basic Auth: `Authorization: Basic base64(username:password)`
- Token header: `x-koha-token: <token>`
- Koha auth header: `Authorization: Koha <api_key>`

Current working proof in your environment:
```bash
curl -u koha:koha -H "Accept: application/json" http://127.0.0.1:9001/api/v1/biblios
```

### 4.2 KOHA Client (`KohaClient`) Responsibilities
- Load config dynamically from `koha_settings` per tenant.
- Build auth headers from DB settings.
- Apply timeout + retry policy.
- Circuit-breaker style failure protection.
- Normalize/raise meaningful errors.

Core methods:
- `getPatron(patronId)`
- `getPatronCheckouts(patronId)`
- `getPatronAccount(patronId)`
- `searchCatalog(params)`
- `issueBook(payload)`
- `returnBook(checkoutId)`
- `renewCheckout(checkoutId)`
- `placeHold(payload)`
- `cancelHold(holdId)`
- `healthCheck()`

## 5. ERP Service-Layer Design

### 5.1 `LibraryService`
- Resolve patron mapping from ERP DB.
- Fetch checkouts + account + holds from KOHA.
- Compute `pending_books_count`, `pending_fine_amount`, `is_clear`.
- Persist audit in `library_clearance_logs`.
- Provide normalized book search results.

### 5.2 `CirculationService`
- List checkouts.
- Get patron checkouts.
- Issue / renew / return books.

### 5.3 `HoldsService`
- List holds.
- Get patron holds.
- Place / cancel hold.

### 5.4 `CrudService`
- CRUD for `koha_settings`, `library_patrons`, `library_clearance_logs`.
- Validation + soft delete handling.

## 6. ERP API Contract (Frontend-Facing)

### 6.1 Student Status and Search
- `GET /api/library/students/{student_id}/status`
- `GET /api/library/books/search?q=&title=&author=&isbn=&page=&limit=`

### 6.2 Settings Admin
- `GET /api/library/settings`
- `POST /api/library/settings`
- `GET /api/library/settings/{id}`
- `PUT /api/library/settings/{id}`
- `DELETE /api/library/settings/{id}`

### 6.3 Patron Mapping Admin
- `GET /api/library/patrons`
- `POST /api/library/patrons`
- `GET /api/library/patrons/{id}`
- `GET /api/library/patrons/student/{student_id}`
- `PUT /api/library/patrons/{id}`
- `DELETE /api/library/patrons/{id}`

### 6.4 Clearance Logs Admin
- `GET /api/library/clearance-logs`
- `POST /api/library/clearance-logs`
- `GET /api/library/clearance-logs/{id}`
- `PUT /api/library/clearance-logs/{id}`
- `DELETE /api/library/clearance-logs/{id}`

### 6.5 Circulation and Holds
- `GET /api/library/checkouts`
- `GET /api/library/checkouts/patron/{patron_id}`
- `POST /api/library/checkouts`
- `PUT /api/library/checkouts/{id}`
- `DELETE /api/library/checkouts/{id}`
- `GET /api/library/holds`
- `GET /api/library/holds/patron/{patron_id}`
- `POST /api/library/holds`
- `DELETE /api/library/holds/{id}`

### 6.6 Health
- `GET /api/library/koha/health`

## 7. KOHA REST API Catalog (All Endpoints)

### 7.1 Live Snapshot from Your KOHA
- Source endpoint: `GET http://127.0.0.1:9001/api/v1/` (Swagger/OpenAPI JSON)
- Snapshot date: **May 27, 2026**
- Total tags: **85**
- Total paths: **229**

Generated files:
- [koha-openapi-2026-05-27.json](/C:/Retechprime/ShikshaPrime_new/services/library-management-service/docs/koha-openapi-2026-05-27.json)
- [koha-rest-api-catalog-2026-05-27.csv](/C:/Retechprime/ShikshaPrime_new/services/library-management-service/docs/koha-rest-api-catalog-2026-05-27.csv)
- [koha-rest-api-tags-2026-05-27.csv](/C:/Retechprime/ShikshaPrime_new/services/library-management-service/docs/koha-rest-api-tags-2026-05-27.csv)

### 7.2 Core KOHA Endpoints Used for ERP Library Module
- `GET /api/v1/biblios`
- `GET /api/v1/biblios/{biblio_id}`
- `GET /api/v1/patrons/{patron_id}`
- `GET /api/v1/patrons/{patron_id}/checkouts`
- `GET /api/v1/patrons/{patron_id}/account`
- `GET /api/v1/patrons/{patron_id}/holds`
- `GET /api/v1/checkouts`
- `POST /api/v1/checkouts`
- `POST /api/v1/checkouts/{checkout_id}/renewal`
- `DELETE /api/v1/checkouts/{checkout_id}`
- `GET /api/v1/holds`
- `POST /api/v1/holds`
- `DELETE /api/v1/holds/{hold_id}`
- `GET /api/v1/status/version`

## 8. Frontend Integration

### 8.1 Student Profile ? Library Tab
- Call student status API.
- Show pending books/fines, borrowed books, due dates, overdue flag.

### 8.2 Library Search Screen
- Search box + advanced filters.
- Call book search API.
- Render title/author/isbn/availability/location.

### 8.3 Admin Mapping Screen
- Map student/staff to KOHA patron ID.
- Validate before save.

## 9. Security and Reliability

- No KOHA DB direct access from ERP.
- Credentials loaded at runtime from `koha_settings`.
- Optional encryption for sensitive settings (`is_encrypted=1`).
- Timeout/retry/circuit-breaker in KOHA client.
- Request validation and centralized error handling.
- RBAC enforcement for admin routes.

## 10. Deployment and Configuration

Environment:
- `SERVICE_PORT`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`

Runtime config in `koha_settings`:
- `KOHA_BASE_URL`
- `KOHA_API_KEY` or `KOHA_USERNAME` + `KOHA_PASSWORD`
- `KOHA_TIMEOUT_MS`
- `KOHA_RETRY_COUNT`

Tenant header:
- `x-tenant: <tenant_code>` (example: `collegea`)

## 11. Operational Checklist

### Backend
- [ ] `koha_settings` table present with required keys.
- [ ] `library_patrons` and `library_clearance_logs` migrated.
- [ ] KOHA health endpoint green.
- [ ] Patron mapping done for pilot users.
- [ ] API error logs monitored.

### Frontend
- [ ] Student library tab integrated.
- [ ] Book search page integrated.
- [ ] Patron mapping admin UI integrated.

### Go-Live
- [ ] Test normal issue/return/renew/hold flow.
- [ ] Test overdue/fine clearance blocking scenarios.
- [ ] Validate result-publish dependency on `is_clear`.

## 12. How to Refresh “All KOHA APIs” Catalog

Run from service root:
```powershell
$raw = curl.exe -s -u koha:koha -H "Accept: application/json" "http://127.0.0.1:9001/api/v1/"
$raw | Set-Content .\docs\koha-openapi-latest.json
$json = $raw | ConvertFrom-Json
$rows = @()
foreach ($p in $json.paths.PSObject.Properties) {
  foreach ($op in $p.Value.PSObject.Properties) {
    if ($op.Name -in @('get','post','put','patch','delete')) {
      $rows += [PSCustomObject]@{
        method = $op.Name.ToUpper()
        path = $p.Name
        tags = ($op.Value.tags -join '|')
        operation_id = $op.Value.operationId
        summary = $op.Value.summary
      }
    }
  }
}
$rows | Sort-Object method, path | Export-Csv .\docs\koha-rest-api-catalog-latest.csv -NoTypeInformation -Encoding UTF8
```

---

This architecture is aligned to your current requirement: **read KOHA config from `koha_settings`, use KOHA REST APIs as source of truth, and keep ERP-side data limited to mappings + audits.**