## 0) Repo bootstrap and conventions

### Task 0.1 — Initialize Laravel API project

**Goal:** Fresh Laravel project with API-only patterns.

- Set base namespaces, strict types where desired.
- Add `app/Services`, `app/Actions`, `app/Http/Requests`, `app/Policies`.

**Acceptance**

- `sail artisan migrate` runs successfully.
- API route file exists and returns 200 for a health endpoint.

---

### Task 0.2 — Install and configure auth for API

**Goal:** Token auth + `/me`.

- Install **Laravel Sanctum**.
- Publish sanctum config, run migrations.
- Add middleware for API auth.
- Create endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

**Acceptance**

- Register+login returns token.
- Auth-protected `/me` returns user profile.

---

### Task 0.3 — Establish coding standards + tooling

**Goal:** Consistency and automated checks.

- Add Pint (if not already).
- Add Laravel Pest package for feature tests baseline.
- Add Postman collection or OpenAPI stub (optional).
- Add response format convention:
  - `{ success, message, data, meta, errors }`

**Acceptance**

- `sail pest` passes.
- `sail artisan pint` passes.

---

## 1) Core domain modeling (DB + Eloquent)

### Task 1.1 — Create RBAC tables and models

**Goal:** Roles + permissions with clean policy enforcement.
**Recommended approach:** `roles`, `permissions`, `role_user`, `permission_role` (or use Spatie package; pick one and be consistent).

- Roles: `admin`, `manager`, `tenant`
- Permissions (minimum):
  - `building.create`, `building.update`, `building.delete`, `building.view`
  - `apartment.create`, `apartment.update`, `apartment.delete`, `apartment.view`
  - `tenant.assign`, `lease.view`, `payment.record`, `chat.send`, etc.

**Acceptance**

- Seeder creates default roles and core permissions.
- User can be assigned a role.
- Policies check role/permission correctly.

---

### Task 1.2 — Buildings schema

**Goal:** Buildings owned by a user, with managers.
Create migrations/models:

- `buildings`
  - `id`, `owner_id`, `name`, `address_line1`, `address_line2`, `city`, `state`, `country`, `description`

- Pivot: `building_users`
  - `building_id`, `user_id`, `role_in_building` (`admin|manager`)
  - Unique constraint `(building_id, user_id)`

**Acceptance**

- Owner auto-attached as building admin in pivot.
- Manager can be attached/detached.

---

### Task 1.3 — Apartments schema

**Goal:** Apartments/units belong to building with pricing and vacancy.

- `apartments`
  - `id`, `building_id`, `unit_code` (e.g., A1), `type` enum, `yearly_price`, `description`, `floor`, `status` enum (`vacant|occupied|maintenance`), `is_public` boolean
  - add optional: `bedrooms`, `bathrooms`, `size_sqm`, `amenities` JSON

**Acceptance**

- Apartments CRUD works under building scope.
- Status updates obey rules (e.g., occupied requires active lease).

---

### Task 1.4 — Leases schema

**Goal:** Track tenant entry year, expiry, and lease status.

- `leases`
  - `id`, `apartment_id`, `tenant_id`, `rent_amount`, `start_date`, `end_date`, `status` (`active|expired|terminated`)
  - Ensure only **one active lease per apartment**:
    - DB partial unique not portable; enforce via validation + transaction.

**Acceptance**

- Assign tenant creates active lease and sets apartment occupied in a transaction.
- Lease expiry logic possible.

---

### Task 1.5 — Payments schema

**Goal:** Manual/online payments and history. Integrate Paystack for online payments.

- `payments`
  - `id`, `lease_id`, `tenant_id`, `amount`, `payment_method` (`manual|online`), `transaction_reference` nullable, `payment_date`, `status` (`pending|paid|failed`), `metadata` JSON

**Acceptance**

- Tenant can list own payments.
- Admin/manager can record manual payment.
- Payment belongs to lease.

---

### Task 1.6 — Rental requests schema (public interest)

**Goal:** Public can request to rent a vacant unit.

- `rental_requests`
  - `id`, `apartment_id`, `name`, `email`, `phone`, `message`, `status` (`new|contacted|closed`)

**Acceptance**

- Public endpoint creates rental request.
- Admin can list and update status.

---

### Task 1.7 — Chat schema

**Goal:** Conversations and messages between tenant/admin/manager.

- `conversations`
  - `id`, `building_id` nullable, `apartment_id` nullable, `created_by`

- `conversation_participants`
  - `conversation_id`, `user_id` (unique pair)

- `messages`
  - `id`, `conversation_id`, `sender_id`, `body`, `read_at`

**Acceptance**

- Tenant cannot message another tenant (enforced in policy/service).
- Messages only allowed if sender is a participant.

---

### Task 1.8 — Optional: Maintenance requests schema (recommended)

- `maintenance_requests`
  - `id`, `apartment_id`, `tenant_id`, `title`, `description`, `status` (`open|in_progress|resolved`)

**Acceptance**

- Tenant can create request.
- Admin/manager can update status.

## Suggestions

The Buildings can have multiple images and videos
The Apartments can have multiple images and videos
Allow profile picture for users
Maintainance request can have multiple images and videos
Use your descretion to handle the images and videos upload gracefully (use AWS)
Make your code implementation favour reusability and scalability always
