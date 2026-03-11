# API Documentation

This document describes all available API routes, request/response payloads, and authorization rules.

## Conventions

- Base URL: `/api`
- Auth: Bearer token via Sanctum for all non-public routes.
- Model definitions: see `docs/models.md` for shared entity and request structures referenced below.
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
  "phone": "1234567890",
  "password": "secret",
  "password_confirmation": "secret"
}
```
Model references: `RegisterRequest`.

Response:
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "token": "string",
    "user": "User"
  },
  "errors": null
}
```
Model references: `User`.

### POST `/api/auth/login`
Login and receive an auth token.

Request body:
```json
{
  "email": "jane@example.com",
  "password": "secret"
}
```
Model references: `LoginRequest`.

Response:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "string",
    "user": "User"
  },
  "errors": null
}
```
Model references: `User`.

### GET `/api/auth/me`
Returns the current authenticated user.

Request: none

Response:
```json
{
  "success": true,
  "message": "User loaded.",
  "data": {
    "user": "User"
  },
  "errors": null
}
```
Model references: `User`.

### POST `/api/auth/logout`
Invalidates the current auth token.

Request: none

Response:
```json
{
  "success": true,
  "message": "Logged out.",
  "data": null,
  "errors": null
}
```

## Buildings

### POST `/api/buildings`
Create a building.

Authorization:
- Disabled. Buildings must be created via building registration requests and approved by an admin.

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
Model references: `BuildingCreateRequest`.

Response:
```json
{
  "success": false,
  "message": "Forbidden.",
  "data": null,
  "errors": null
}
```
Model references: `Building`.

### GET `/api/buildings`
List buildings accessible to the user (owner/admin/manager).

Request: none

Response:
```json
{
  "success": true,
  "message": "Buildings loaded.",
  "data": {
    "buildings": "BuildingSummary[]"
  },
  "errors": null
}
```
Model references: `BuildingSummary[]`.

### GET `/api/buildings/{building}`
Get a single building.

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Building loaded.",
  "data": {
    "building": "Building"
  },
  "errors": null
}
```
Model references: `Building`.

### PUT `/api/buildings/{building}`
Update building details.

Authorization:
- Owner/admin/manager only.

Notes:
- If `for_sale` is `true`, `sale_price` is required (integer kobo).

Request body:
```json
{
  "name": "Sunrise Apartments",
  "description": "Renovated units",
  "for_sale": true,
  "sale_price": 120000000
}
```
Model references: `BuildingUpdateRequest`.

Response:
```json
{
  "success": true,
  "message": "Building updated.",
  "data": {
    "building": "Building"
  },
  "errors": null
}
```
Model references: `Building`.

### DELETE `/api/buildings/{building}`
Delete a building.

Authorization:
- Owner/admin only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Building deleted.",
  "data": null,
  "errors": null
}
```

## Building Registration Requests

### POST `/api/building-registration-requests`
Submit a building registration request (authenticated users).

Authorization:
- Authenticated user.

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
Model references: `BuildingRegistrationRequestCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Building registration request submitted.",
  "data": {
    "request": "BuildingRegistrationRequest"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest`.

### POST `/api/public/building-registration-requests`
Submit a building registration request (public).

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
  "sale_price": null,
  "owner_name": "Jane Doe",
  "owner_email": "jane@example.com",
  "owner_phone": "1234567890",
  "owner_password": "secret",
  "owner_password_confirmation": "secret"
}
```
Model references: `BuildingRegistrationRequestCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Building registration request submitted.",
  "data": {
    "request": "BuildingRegistrationRequest"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest`.

### GET `/api/admin/building-registration-requests`
List building registration requests (admin only).

Query params:
- `status` optional (`pending|approved|rejected`).

Response:
```json
{
  "success": true,
  "message": "Building registration requests loaded.",
  "data": {
    "requests": "BuildingRegistrationRequest[]"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest[]`.

### GET `/api/admin/building-registration-requests/{buildingRegistrationRequest}`
Get a single building registration request (admin only).

Response:
```json
{
  "success": true,
  "message": "Building registration request loaded.",
  "data": {
    "request": "BuildingRegistrationRequest"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest`.

### POST `/api/admin/building-registration-requests/{buildingRegistrationRequest}/approve`
Approve a building registration request (admin only).

Response:
```json
{
  "success": true,
  "message": "Building registration request approved.",
  "data": {
    "request": "BuildingRegistrationRequest",
    "building": "Building",
    "owner": "User"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest`, `Building`, `User`.

### POST `/api/admin/building-registration-requests/{buildingRegistrationRequest}/reject`
Reject a building registration request (admin only).

Request body:
```json
{
  "rejection_reason": "Missing documents"
}
```

Response:
```json
{
  "success": true,
  "message": "Building registration request rejected.",
  "data": {
    "request": "BuildingRegistrationRequest"
  },
  "errors": null
}
```
Model references: `BuildingRegistrationRequest`.

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
Model references: `BuildingManagerCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Manager added.",
  "data": {
    "manager": "User"
  },
  "errors": null
}
```
Model references: `User`.

### DELETE `/api/buildings/{building}/managers/{user}`
Remove a manager from a building.

Authorization:
- Owner/admin only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Manager removed.",
  "data": null,
  "errors": null
}
```

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
Model references: `ApartmentCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Apartment created.",
  "data": {
    "apartment": "Apartment"
  },
  "errors": null
}
```
Model references: `Apartment`.

### GET `/api/buildings/{building}/apartments`
List apartments for a building.

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Apartments loaded.",
  "data": {
    "apartments": "ApartmentSummary[]"
  },
  "errors": null
}
```
Model references: `ApartmentSummary[]`.

### GET `/api/apartments/{apartment}`
Get a single apartment.

Authorization:
- Owner/admin/manager for the building.
- Tenant can view only if assigned to the apartment.

Request: none

Response:
```json
{
  "success": true,
  "message": "Apartment loaded.",
  "data": {
    "apartment": "Apartment"
  },
  "errors": null
}
```
Model references: `Apartment`.

### PUT `/api/apartments/{apartment}`
Update apartment details.

Authorization:
- Owner/admin/manager only.

Request body:
```json
{
  "yearly_price": 1300000,
  "status": "vacant",
  "is_public": true
}
```
Model references: `ApartmentUpdateRequest`.

Response:
```json
{
  "success": true,
  "message": "Apartment updated.",
  "data": {
    "apartment": "Apartment"
  },
  "errors": null
}
```
Model references: `Apartment`.

### DELETE `/api/apartments/{apartment}`
Delete an apartment.

Authorization:
- Owner/admin/manager only.
- Blocked if apartment is occupied or has tenants.

Request: none

Response:
```json
{
  "success": true,
  "message": "Apartment deleted.",
  "data": null,
  "errors": null
}
```

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
Model references: `AssignTenantRequest`.

Notes:
- `rent_amount` defaults to apartment `yearly_price` when omitted.

Response:
```json
{
  "success": true,
  "message": "Tenant assigned and lease created.",
  "data": {
    "tenant": "User",
    "lease": "Lease",
    "apartment": "Apartment"
  },
  "errors": null
}
```
Model references: `User`, `Lease`, `Apartment`.

## Tenants

### GET `/api/tenants`
List tenants for buildings the authenticated user can manage.

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Tenants loaded.",
  "data": {
    "tenants": [
      {
        "tenant": "User",
        "active_lease": "LeaseSummary"
      }
    ]
  },
  "errors": null
}
```
Model references: `User`, `LeaseSummary`.

### GET `/api/tenants/{tenant}`
Get a tenant profile with lease and payment history.

Authorization:
- Owner/admin/manager only.
- Tenant must have a lease in a building the user can manage.

Request: none

Response:
```json
{
  "success": true,
  "message": "Tenant loaded.",
  "data": {
    "tenant": "User",
    "leases": "Lease[]",
    "payments": "Payment[]"
  },
  "errors": null
}
```
Model references: `User`, `Lease[]`, `Payment[]`.

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
Model references: `PaymentCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Payment recorded.",
  "data": {
    "payment": "Payment"
  },
  "errors": null
}
```
Model references: `Payment`.

### GET `/api/payments`
List payments for buildings the admin/manager owns/manages.

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Payments loaded.",
  "data": {
    "payments": "PaymentSummary[]"
  },
  "errors": null
}
```
Model references: `PaymentSummary[]`.

### GET `/api/tenant/payments`
List payments for the authenticated tenant.

Authorization:
- Tenant only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Payments loaded.",
  "data": {
    "payments": "PaymentSummary[]"
  },
  "errors": null
}
```
Model references: `PaymentSummary[]`.

## Public Listings + Rental Requests

Public routes are throttled via `throttle:60,1`.

### GET `/api/public/apartments`
List vacant public apartments with building summary.

Request: none

Response:
```json
{
  "success": true,
  "message": "Public apartments loaded.",
  "data": {
    "apartments": "ApartmentSummary[]",
    "building": "BuildingSummary"
  },
  "errors": null
}
```
Model references: `ApartmentSummary[]`, `BuildingSummary`.

### GET `/api/public/buildings-for-sale`
List buildings marked for sale with their prices.

Request: none

Response:
```json
{
  "success": true,
  "message": "Buildings for sale loaded.",
  "data": {
    "buildings": "BuildingSummary[]"
  },
  "errors": null
}
```
Model references: `BuildingSummary[]`.

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
Model references: `PublicRentalRequestCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Rental request created.",
  "data": {
    "rental_request": "RentalRequest"
  },
  "errors": null
}
```
Model references: `RentalRequest`.

Alias:
- POST `/api/public/request-interest`

### GET `/api/rental-requests`
List rental requests scoped to buildings the admin/manager owns/manages.

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Rental requests loaded.",
  "data": {
    "rental_requests": "RentalRequestSummary[]"
  },
  "errors": null
}
```
Model references: `RentalRequestSummary[]`.

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
Model references: `RentalRequestUpdateRequest`.

Response:
```json
{
  "success": true,
  "message": "Rental request updated.",
  "data": {
    "rental_request": "RentalRequest"
  },
  "errors": null
}
```
Model references: `RentalRequest`.

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
Model references: `ConversationCreateRequest`.

Notes:
- Either `building_id` or `apartment_id` is required.
- The authenticated user is auto-added as a participant.

Response:
```json
{
  "success": true,
  "message": "Conversation created.",
  "data": {
    "conversation": "Conversation"
  },
  "errors": null
}
```
Model references: `Conversation`.

### GET `/api/conversations`
List conversations the user participates in.

Request: none

Response:
```json
{
  "success": true,
  "message": "Conversations loaded.",
  "data": {
    "conversations": "ConversationSummary[]"
  },
  "errors": null
}
```
Model references: `ConversationSummary[]`.

### GET `/api/conversations/{conversation}/messages`
List all messages for a conversation.

Authorization:
- Participant only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Messages loaded.",
  "data": {
    "messages": "Message[]"
  },
  "errors": null
}
```
Model references: `Message[]`.

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
Model references: `MessageCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Message sent.",
  "data": {
    "message": "Message"
  },
  "errors": null
}
```
Model references: `Message`.

### POST `/api/conversations/{conversation}/read`
Marks all messages not sent by the current user as read (sets `read_at`).

Authorization:
- Participant only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Messages marked as read.",
  "data": {
    "read_at": "string"
  },
  "errors": null
}
```
Model references: none (read receipt only).

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
Model references: `MaintenanceRequestCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Maintenance request created.",
  "data": {
    "maintenance_request": "MaintenanceRequest"
  },
  "errors": null
}
```
Model references: `MaintenanceRequest`.

### GET `/api/maintenance-requests`
List maintenance requests.

Authorization:
- Tenant: only their own requests.
- Owner/admin/manager: requests for their buildings.

Request: none

Response:
```json
{
  "success": true,
  "message": "Maintenance requests loaded.",
  "data": {
    "maintenance_requests": "MaintenanceRequestSummary[]"
  },
  "errors": null
}
```
Model references: `MaintenanceRequestSummary[]`.

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
Model references: `MaintenanceRequestUpdateRequest`.

Response:
```json
{
  "success": true,
  "message": "Maintenance request updated.",
  "data": {
    "maintenance_request": "MaintenanceRequest"
  },
  "errors": null
}
```
Model references: `MaintenanceRequest`.

## Media Uploads (Images/Videos)

All media uploads are stored using the configured filesystem disk (`FILESYSTEM_DISK`). For production, set this to `s3_public`.

Common request fields:
- `file` (multipart file, required)
- `collection` (optional): `images` or `videos` (defaults to `images`)

### GET `/api/buildings/{building}/media`
List media for a building.

Authorization:
- Owner/admin/manager for the building.

Request: none

Response:
```json
{
  "success": true,
  "message": "Media loaded.",
  "data": {
    "media": "Media[]"
  },
  "errors": null
}
```
Model references: `Media[]`.

### POST `/api/buildings/{building}/media`
Upload building media (images/videos).

Authorization:
- Owner/admin/manager for the building.

Multipart form-data:
```
file: <image or video>
collection: images|videos
```
Model references: `MediaUploadRequest`.

Response:
```json
{
  "success": true,
  "message": "Media uploaded.",
  "data": {
    "media": "Media"
  },
  "errors": null
}
```
Model references: `Media`.

### GET `/api/apartments/{apartment}/media`
List media for an apartment.

Authorization:
- Owner/admin/manager for the building.
- Tenant can view only if assigned to the apartment.

Request: none

Response:
```json
{
  "success": true,
  "message": "Media loaded.",
  "data": {
    "media": "Media[]"
  },
  "errors": null
}
```
Model references: `Media[]`.

### POST `/api/apartments/{apartment}/media`
Upload apartment media (images/videos).

Authorization:
- Owner/admin/manager for the building.

Multipart form-data:
```
file: <image or video>
collection: images|videos
```
Model references: `MediaUploadRequest`.

Response:
```json
{
  "success": true,
  "message": "Media uploaded.",
  "data": {
    "media": "Media"
  },
  "errors": null
}
```
Model references: `Media`.

### GET `/api/maintenance-requests/{maintenanceRequest}/media`
List media for a maintenance request.

Authorization:
- Tenant owner of the request.
- Owner/admin/manager for the building.

Request: none

Response:
```json
{
  "success": true,
  "message": "Media loaded.",
  "data": {
    "media": "Media[]"
  },
  "errors": null
}
```
Model references: `Media[]`.

### POST `/api/maintenance-requests/{maintenanceRequest}/media`
Upload maintenance request media (images/videos).

Authorization:
- Tenant owner of the request.
- Owner/admin/manager for the building.

Multipart form-data:
```
file: <image or video>
collection: images|videos
```
Model references: `MediaUploadRequest`.

Response:
```json
{
  "success": true,
  "message": "Media uploaded.",
  "data": {
    "media": "Media"
  },
  "errors": null
}
```
Model references: `Media`.

### GET `/api/profile/media`
Fetch the authenticated user's profile photo.

Authorization:
- Authenticated user.

Request: none

Response:
```json
{
  "success": true,
  "message": "Profile photo loaded.",
  "data": {
    "media": "Media"
  },
  "errors": null
}
```
Model references: `Media`.

### POST `/api/profile/media`
Upload or replace the authenticated user's profile photo.

Authorization:
- Authenticated user.

Multipart form-data:
```
file: <image>
collection: profile
```
Model references: `MediaUploadRequest`.

Response:
```json
{
  "success": true,
  "message": "Profile photo uploaded.",
  "data": {
    "media": "Media"
  },
  "errors": null
}
```
Model references: `Media`.

## Reviews (Buildings + Apartments)

Any authenticated user can create reviews. Reviews are stored with a polymorphic `reviewable` target so they can be attached to any entity type (currently buildings and apartments). Reviews include a 1–5 star rating and comment.
Verified reviews are automatically marked when the user has an active or past lease for the apartment.

### GET `/api/buildings/{building}/reviews`
List reviews for a building.

Authorization:
- Authenticated user.

Request: none

Response:
```json
{
  "success": true,
  "message": "Building reviews loaded.",
  "data": {
    "reviews": "Review[]"
  },
  "errors": null
}
```
Model references: `Review[]`.

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
Model references: `ReviewCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Building review created.",
  "data": {
    "review": "Review"
  },
  "errors": null
}
```
Model references: `Review`.

### GET `/api/apartments/{apartment}/reviews`
List reviews for an apartment.

Authorization:
- Authenticated user.

Request: none

Response:
```json
{
  "success": true,
  "message": "Apartment reviews loaded.",
  "data": {
    "reviews": "Review[]"
  },
  "errors": null
}
```
Model references: `Review[]`.

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
Model references: `ReviewCreateRequest`.

Response:
```json
{
  "success": true,
  "message": "Apartment review created.",
  "data": {
    "review": "Review"
  },
  "errors": null
}
```
Model references: `Review`.

## Dashboards

### GET `/api/dashboard/admin`
Admin/manager dashboard metrics (scoped to managed/owned buildings).

Authorization:
- Owner/admin/manager only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Admin dashboard loaded.",
  "data": {
    "metrics": "AdminDashboardMetrics"
  },
  "errors": null
}
```
Model references: `AdminDashboardMetrics`.

### GET `/api/dashboard/tenant`
Tenant dashboard metrics.

Authorization:
- Tenant only.

Request: none

Response:
```json
{
  "success": true,
  "message": "Tenant dashboard loaded.",
  "data": {
    "metrics": "TenantDashboardMetrics"
  },
  "errors": null
}
```
Model references: `TenantDashboardMetrics`.

Alias:
- GET `/api/tenant/dashboard`

## Background Commands (Operational)

These are Artisan commands executed by the scheduler; not HTTP endpoints.

### `leases:expire`
- Runs daily.
- Expires active leases with `end_date < today`.
- Sets apartment to `vacant` and `is_public = true` if no other active lease exists.
- Generates quit notice and emails tenant to vacate within one month.

### `leases:send-renewal-reminders`
- Runs daily.
- Sends reminder email to tenants exactly 90 days before `end_date`.
- Uses queued job `SendRenewalReminderEmail`.

### `demo:seed`
- Seeds connected demo data for manual testing.
- Creates buildings, apartments, managers, tenants, leases, payments, maintenance requests, rental requests, reviews, and conversations.
- Options:
  - `--buildings` (default `2`)
  - `--apartments` (default `6`)
  - `--managers` (default `1`)
  - `--tenants` (default `3`)
  - `--payments` (default `2`)
  - `--maintenance` (default `1`)
  - `--conversations` (default `1`)
  - `--messages` (default `3`)
  - `--rental-requests` (default `2`)
  - `--building-reviews` (default `2`)
  - `--apartment-reviews` (default `2`)

## Tenancy Agreement + Quit Notice (Behavioral)

When a tenant is assigned to an apartment:
- A tenancy agreement is generated and emailed to the tenant.
- Agreement includes a clause stating that a quit notice will be issued automatically if the lease expires without renewal.

When a lease expires without renewal:
- A quit notice is generated and emailed to the tenant.
- Apartment becomes immediately available to the public (`status = vacant`, `is_public = true`).
