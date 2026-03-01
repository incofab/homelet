# API Documentation

This document describes all available API routes, request/response payloads, and authorization rules.

## Conventions

- Base URL: `/api`
- Auth: Bearer token via Sanctum for all non-public routes.
- Response envelope (success):
  ```json
  {
    "success": true,
    "message": "...",
    "data": { ... },
    "errors": null
  }
  ```
- Response envelope (validation errors):
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "data": null,
    "errors": {
      "field": ["Error message"]
    }
  }
  ```
- Dates: `YYYY-MM-DD`
- Money: integer kobo

## Authentication

### POST `/api/auth/register`
Create a new user account.

Request body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret",
  "password_confirmation": "secret"
}
```

Response: authenticated user + token.

### POST `/api/auth/login`
Login and receive an auth token.

Request body:
```json
{
  "email": "jane@example.com",
  "password": "secret"
}
```

Response: authenticated user + token.

### GET `/api/auth/me`
Returns the current authenticated user.

### POST `/api/auth/logout`
Invalidates the current auth token.

## Buildings

### POST `/api/buildings`
Create a building.

Authorization:
- Authenticated user.
- Owner is the authenticated user.

Request body:
```json
{
  "name": "Sunrise Apartments",
  "address_line1": "12 Main St",
  "address_line2": "Suite 4",
  "city": "Lagos",
  "state": "Lagos",
  "country": "NG",
  "description": "Modern apartments",
  "for_sale": false,
  "sale_price": null
}
```

### GET `/api/buildings`
List buildings accessible to the user (owner/admin/manager).

### GET `/api/buildings/{building}`
Get a single building.

Authorization:
- Owner/admin/manager only.

### PUT `/api/buildings/{building}`
Update building details.

Authorization:
- Owner/admin/manager only.

Notes:
- If `for_sale` is `true`, `sale_price` is required (integer kobo).

### DELETE `/api/buildings/{building}`
Delete a building.

Authorization:
- Owner/admin only.

## Building Managers

### POST `/api/buildings/{building}/managers`
Add a manager to a building (by email). If user does not exist, it is created.

Authorization:
- Owner/admin only.

Request body:
```json
{
  "email": "manager@example.com",
  "name": "Manager Name"
}
```

Response: manager user object.

### DELETE `/api/buildings/{building}/managers/{user}`
Remove a manager from a building.

Authorization:
- Owner/admin only.

## Apartments

### POST `/api/buildings/{building}/apartments`
Create an apartment in a building.

Authorization:
- Owner/admin/manager only.

Request body:
```json
{
  "unit_code": "A1",
  "type": "one_bedroom",
  "yearly_price": 1200000,
  "description": "Large 1BR",
  "floor": "2",
  "status": "vacant",
  "is_public": true,
  "amenities": ["wifi", "parking"]
}
```

### GET `/api/buildings/{building}/apartments`
List apartments for a building.

Authorization:
- Owner/admin/manager only.

### GET `/api/apartments/{apartment}`
Get a single apartment.

Authorization:
- Owner/admin/manager for the building.
- Tenant can view only if assigned to the apartment.

### PUT `/api/apartments/{apartment}`
Update apartment details.

Authorization:
- Owner/admin/manager only.

### DELETE `/api/apartments/{apartment}`
Delete an apartment.

Authorization:
- Owner/admin/manager only.
- Blocked if apartment is occupied or has tenants.

## Assign Tenant + Lease

### POST `/api/apartments/{apartment}/assign-tenant`
Assign a tenant to an apartment and create an active lease.

Authorization:
- Owner/admin/manager only.

Behavior:
- Creates tenant user if missing and assigns `tenant` role.
- Creates active lease with `end_date = start_date + 1 year`.
- Sets apartment status to `occupied`.
- Entire operation is transactional.

Request body:
```json
{
  "tenant_email": "tenant@example.com",
  "tenant_name": "Tenant Name",
  "start_date": "2026-03-01",
  "rent_amount": 1200000
}
```

Notes:
- `rent_amount` defaults to apartment `yearly_price` when omitted.

## Payments

### POST `/api/payments`
Record a payment.

Authorization:
- Tenant can submit `online` payments for their own lease.
- Admin/manager can submit `manual` payments for leases in their building.

Request body:
```json
{
  "lease_id": 1,
  "amount": 150000,
  "payment_method": "online",
  "transaction_reference": "TRX-12345",
  "payment_date": "2026-03-01",
  "status": "paid",
  "metadata": {
    "channel": "card",
    "processor": "paystack"
  }
}
```

### GET `/api/payments`
List payments for buildings the admin/manager owns/manages.

Authorization:
- Owner/admin/manager only.

### GET `/api/tenant/payments`
List payments for the authenticated tenant.

Authorization:
- Tenant only.

## Public Listings + Rental Requests

Public routes are throttled via `throttle:60,1`.

### GET `/api/public/apartments`
List vacant public apartments with building summary.

### GET `/api/public/buildings-for-sale`
List buildings marked for sale with their prices.

### POST `/api/public/rental-requests`
Create a rental request.

Request body:
```json
{
  "apartment_id": 1,
  "name": "Prospective Tenant",
  "email": "lead@example.com",
  "phone": "1234567890",
  "message": "Interested in the unit"
}
```

### GET `/api/rental-requests`
List rental requests scoped to buildings the admin/manager owns/manages.

Authorization:
- Owner/admin/manager only.

### PUT `/api/rental-requests/{rentalRequest}`
Update rental request status.

Authorization:
- Owner/admin/manager only.

Request body:
```json
{
  "status": "contacted"
}
```

## Chat (Conversations + Messages)

### POST `/api/conversations`
Create a conversation tied to a building or apartment.

Authorization:
- Tenant must have an active lease for the apartment/building.
- Admin/manager/owner only within their building scope.
- No tenant-to-tenant conversations.

Request body:
```json
{
  "building_id": 1,
  "apartment_id": 2,
  "participant_ids": [10, 11]
}
```

Notes:
- Either `building_id` or `apartment_id` is required.
- The authenticated user is auto-added as a participant.

### GET `/api/conversations`
List conversations the user participates in.

### GET `/api/conversations/{conversation}/messages`
List all messages for a conversation.

Authorization:
- Participant only.

### POST `/api/conversations/{conversation}/messages`
Send a message to a conversation.

Authorization:
- Participant only.

Request body:
```json
{
  "body": "Hello there"
}
```

### POST `/api/conversations/{conversation}/read`
Marks all messages not sent by the current user as read (sets `read_at`).

Authorization:
- Participant only.

## Maintenance Requests

### POST `/api/maintenance-requests`
Create a maintenance request.

Authorization:
- Tenant only, and must have an active lease for the apartment.

Request body:
```json
{
  "apartment_id": 1,
  "title": "Leaking pipe",
  "description": "Pipe under sink is leaking."
}
```

### GET `/api/maintenance-requests`
List maintenance requests.

Authorization:
- Tenant: only their own requests.
- Owner/admin/manager: requests for their buildings.

### PUT `/api/maintenance-requests/{maintenanceRequest}`
Update maintenance request status.

Authorization:
- Owner/admin/manager only.

Request body:
```json
{
  "status": "in_progress"
}
```

## Media Uploads (Images/Videos)

All media uploads are stored using the configured filesystem disk (`FILESYSTEM_DISK`). For production, set this to `s3_public`.

Common request fields:
- `file` (multipart file, required)
- `collection` (optional): `images` or `videos` (defaults to `images`)

### GET `/api/buildings/{building}/media`
List media for a building.

Authorization:
- Owner/admin/manager for the building.

### POST `/api/buildings/{building}/media`
Upload building media (images/videos).

Authorization:
- Owner/admin/manager for the building.

Multipart form-data:
```
file: <image or video>
collection: images|videos
```

### GET `/api/apartments/{apartment}/media`
List media for an apartment.

Authorization:
- Owner/admin/manager for the building.
- Tenant can view only if assigned to the apartment.

### POST `/api/apartments/{apartment}/media`
Upload apartment media (images/videos).

Authorization:
- Owner/admin/manager for the building.

### GET `/api/maintenance-requests/{maintenanceRequest}/media`
List media for a maintenance request.

Authorization:
- Tenant owner of the request.
- Owner/admin/manager for the building.

### POST `/api/maintenance-requests/{maintenanceRequest}/media`
Upload maintenance request media (images/videos).

Authorization:
- Tenant owner of the request.
- Owner/admin/manager for the building.

### GET `/api/profile/media`
Fetch the authenticated user's profile photo.

Authorization:
- Authenticated user.

### POST `/api/profile/media`
Upload or replace the authenticated user's profile photo.

Authorization:
- Authenticated user.

Multipart form-data:
```
file: <image>
collection: profile
```

## Reviews (Buildings + Apartments)

Any authenticated user can create reviews. Reviews are stored with a polymorphic `reviewable` target so they can be attached to any entity type (currently buildings and apartments). Reviews include a 1–5 star rating and comment.
Verified reviews are automatically marked when the user has an active or past lease for the apartment.

### GET `/api/buildings/{building}/reviews`
List reviews for a building.

Authorization:
- Authenticated user.

### POST `/api/buildings/{building}/reviews`
Create a building review.

Authorization:
- Authenticated user.

Request body:
```json
{
  "rating": 4,
  "comment": "Great place to live."
}
```

Response:
```json
{
  "success": true,
  "message": "Building review created.",
  "data": {
    "review": {
      "id": 1,
      "rating": 4,
      "comment": "Great place to live.",
      "verified": false
    }
  },
  "errors": null
}
```

### GET `/api/apartments/{apartment}/reviews`
List reviews for an apartment.

Authorization:
- Authenticated user.

### POST `/api/apartments/{apartment}/reviews`
Create an apartment review.

Authorization:
- Authenticated user.

Request body:
```json
{
  "rating": 5,
  "comment": "Verified tenant review."
}
```

Response:
```json
{
  "success": true,
  "message": "Apartment review created.",
  "data": {
    "review": {
      "id": 2,
      "rating": 5,
      "comment": "Verified tenant review.",
      "verified": true
    }
  },
  "errors": null
}
```

## Dashboards

### GET `/api/dashboard/admin`
Admin/manager dashboard metrics (scoped to managed/owned buildings).

Authorization:
- Owner/admin/manager only.

Response data:
```json
{
  "counts": {
    "buildings": 1,
    "apartments": 10,
    "vacant": 3,
    "occupied": 7
  },
  "expiring_leases_next_90_days": 2,
  "total_income_paid": 3500000,
  "pending_payments": 4
}
```

### GET `/api/dashboard/tenant`
Tenant dashboard metrics.

Authorization:
- Tenant only.

Response data:
```json
{
  "active_lease": { "id": 1, "status": "active", "end_date": "2026-12-31" },
  "days_to_expiry": 90,
  "last_payment": { "id": 10, "status": "paid", "payment_date": "2026-03-01" },
  "payment_summary": {
    "paid": 3,
    "pending": 1,
    "failed": 0
  }
}
```

## Background Commands (Operational)

These are Artisan commands executed by the scheduler; not HTTP endpoints.

### `leases:expire`
- Runs daily.
- Expires active leases with `end_date < today`.
- Sets apartment to `vacant` if no other active lease exists.

### `leases:send-renewal-reminders`
- Runs daily.
- Sends reminder email to tenants exactly 90 days before `end_date`.
- Uses queued job `SendRenewalReminderEmail`.
