## 2) API Endpoints (Controllers + Requests + Policies)

### Task 2.1 — Buildings API

Endpoints:

- `POST /api/buildings`
- `GET /api/buildings`
- `GET /api/buildings/{building}`
- `PUT /api/buildings/{building}`
- `DELETE /api/buildings/{building}`

Rules:

- Only authenticated.
- Only owner/admin updates.
- Managers can view/update if assigned.

**Acceptance**

- Feature tests cover: owner vs manager vs tenant access.

---

### Task 2.2 — Building managers API

Endpoints:

- `POST /api/buildings/{building}/managers` (add manager by email)
- `DELETE /api/buildings/{building}/managers/{userId}`

Rules:

- Only building owner/admin can manage managers.

**Acceptance**

- Adding manager creates building_users row with `manager`.
- Manager permissions activated for that building scope only.

---

### Task 2.3 — Apartments API

Endpoints:

- `POST /api/buildings/{building}/apartments`
- `GET /api/buildings/{building}/apartments`
- `GET /api/apartments/{apartment}`
- `PUT /api/apartments/{apartment}`
- `DELETE /api/apartments/{apartment}`

Rules:

- Only building admin/manager.
- Cannot delete if apartment has active lease.

**Acceptance**

- Tests confirm constraint.

---

### Task 2.4 — Tenant assignment + lease API

Endpoints:

- `POST /api/apartments/{apartment}/assign-tenant`
  - payload: tenant email/name, start_date, rent_amount (defaults to apartment yearly_price), term=1 year

- `GET /api/leases` (admin/manager scoped)
- `GET /api/tenant/lease` (tenant own active lease)

Rules:

- Assign tenant creates tenant user if not exists (role=tenant).
- Transaction: create lease + set apartment occupied.

**Acceptance**

- Only building admin/manager can assign.
- Tenant sees accurate start/end dates.

---

### Task 2.5 — Payments API

Endpoints:

- `POST /api/payments` (tenant online payment initiation OR admin manual record)
- `GET /api/payments` (admin/manager scoped)
- `GET /api/tenant/payments` (tenant own)

Rules:

- Tenant can only pay for own lease.
- Admin/manager can record manual payments for their building leases.

**Acceptance**

- Tests: tenant cannot record for another tenant.

---

### Task 2.6 — Public vacancy listing + rental request

Endpoints:

- `GET /api/public/apartments` (vacant + is_public)
- `POST /api/public/rental-requests`

**Acceptance**

- Public listing returns building + apartment summary.
- Rental request stored.

---

### Task 2.7 — Chat API

Endpoints:

- `POST /api/conversations` (create for apartment/building)
- `GET /api/conversations`
- `GET /api/conversations/{conversation}/messages`
- `POST /api/conversations/{conversation}/messages`
- `POST /api/conversations/{conversation}/read` (mark read)

Rules:

- Tenant can only create/join conversation tied to their apartment/building.
- Admin/manager can chat within buildings they manage.
- No tenant-to-tenant.

**Acceptance**

- Policy tests enforce participant-only messaging.

---

### Task 2.8 — Maintenance Requests API (optional but recommended)

Endpoints:

- `POST /api/maintenance-requests`
- `GET /api/maintenance-requests` (scoped)
- `PUT /api/maintenance-requests/{id}`

---

## 3) Background jobs: lease expiry and reminders

### Task 3.1 — Lease expiry updater (daily)

**Goal:** Automatically flip leases to expired when end_date < today and set apartment vacant if no new lease.

- Create Artisan command: `leases:expire`
- Schedule in `Kernel.php` daily.
- Use DB transaction per lease.

**Acceptance**

- Simulated test sets end_date in past → status becomes expired, apartment becomes vacant.

---

### Task 3.2 — Email reminder at 90 days before expiry (priority)

**Goal:** Send reminder exactly at T-90 days (or within a window).

- Create command: `leases:send-renewal-reminders`
- Runs daily; selects active leases whose end_date is 90 days from today.
- Dispatch queued job `SendRenewalReminderEmail`.

**Acceptance**

- Mail fake test ensures tenant receives reminder when end_date=now+90 days.

(Using scheduler + queue aligns with Codex CLI’s “run commands/tests locally” workflow.) ([OpenAI Developers][2])

---

## 4) Dashboards and reporting endpoints

### Task 4.1 — Admin dashboard metrics endpoint

Endpoint:

- `GET /api/dashboard/admin`

Return:

- buildings_count
- apartments_count
- vacant_count
- occupied_count
- expiring_leases_next_90_days
- total_income_paid
- pending_payments

**Acceptance**

- Tests validate calculations.

---

### Task 4.2 — Tenant dashboard endpoint

Endpoint:

- `GET /api/dashboard/tenant`

Return:

- active_lease details
- next_due_date (end_date)
- days_to_expiry
- last_payment
- payment_history summary

---

## 5) Cross-cutting: validation, errors, and security

### Task 5.1 — Request validation everywhere

- FormRequest classes for create/update actions.
- Enum validation for apartment types/status.
- Currency stored as integer kobo? (assumption) OR decimal. Choose one.

**Acceptance**

- Invalid payload returns 422 with structured errors.

---

### Task 5.2 — Authorization policies + scoping

- Policies:
  - BuildingPolicy
  - ApartmentPolicy
  - LeasePolicy
  - PaymentPolicy
  - ConversationPolicy

- Global query scopes or service-layer checks for “building membership”.

**Acceptance**

- Tests confirm no data leakage across buildings.

---

### Task 5.3 — Rate limiting for public endpoints

- Apply `throttle` middleware for `/public/*`.

---

## 6) Testing plan (Codex-friendly)

### Task 6.1 — Feature tests per module

Minimum tests:

- Auth: register/login/logout
- Building CRUD permissions
- Apartment CRUD permissions + cannot delete occupied
- Assign tenant creates lease and sets occupied
- Reminder email triggers at 90 days
- Public listing only vacant+public
- Chat: tenant can’t message non-participant / tenant-to-tenant blocked

**Acceptance**

- `sail pest` green.
