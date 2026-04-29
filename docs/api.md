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
- Platform roles: `user`, `admin` (managed with Spatie permissions).
- Building roles live on `building_users.role`: `landlord`, `manager`, `caretaker`.
- Role names are globally unique in this project. The Spatie `guard_name` column remains in the schema but is ignored at the application level.

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
    "dashboard": "home",
    "dashboard_context": {
      "primary_dashboard": "home",
      "is_platform_admin": false,
      "is_building_user": false,
      "has_active_lease": false,
      "available_dashboards": ["home"]
    },
    "user": "User"
  },
  "errors": null
}
```

Notes:

- Every newly registered account is automatically assigned the platform `user` role.
- `dashboard` is the recommended frontend landing area (`admin`, `tenant`, or `home`).
- Dashboard selection priority is:
  1. Platform admin -> `admin`
  2. Building user (`landlord`, `manager`, `caretaker`, or building owner) -> `admin`
  3. User with an active lease -> `tenant`
  4. Everyone else -> `home`
- If a building user also has an active lease, `dashboard` remains `admin` and `dashboard_context.available_dashboards` includes both `admin` and `tenant`.
- `phone` is required and normalized to digits only.
- `email` is optional, but unique when supplied.
  Model references: `User`.

### POST `/api/auth/login`

Login and receive an auth token.

Request body:

```json
{
  "identifier": "jane@example.com",
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
    "dashboard": "admin",
    "dashboard_context": {
      "primary_dashboard": "admin",
      "is_platform_admin": false,
      "is_building_user": true,
      "has_active_lease": true,
      "available_dashboards": ["admin", "tenant"]
    },
    "user": "User"
  },
  "errors": null
}
```

Model references: `User`.

### GET `/api/auth/me`

Returns the current authenticated user.

Request: none

Authorization:

- Bearer token required.

Response:

```json
{
  "success": true,
  "message": "Profile loaded.",
  "data": {
    "dashboard": "admin",
    "dashboard_context": {
      "primary_dashboard": "admin",
      "is_platform_admin": false,
      "is_building_user": true,
      "has_active_lease": true,
      "available_dashboards": ["admin", "tenant"]
    },
    "user": "User"
  },
  "errors": null
}
```

Model references: `User`.

Unauthenticated response:

- `401` JSON response with `{"message":"Unauthenticated."}`.

### POST `/api/auth/logout`

Invalidates the current auth token.

Request: none

Response:

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null,
  "errors": null
}
```

Notes:

- `identifier` accepts either an email address or a phone number.

## Users

### GET `/api/users`

List platform users.

Authorization:

- Platform admin only.

Query params:

- `q` optional search term matched against `name`, `email`, and `phone`.

Response:

```json
{
  "success": true,
  "message": "Users loaded.",
  "data": {
    "users": "User[]"
  },
  "errors": null
}
```

Model references: `User[]`.

### POST `/api/users/{user}/impersonate`

Create an impersonation token for a non-admin user.

Authorization:

- Platform admin only.

Path params:

- `user` target user id.

Rules:

- The target user must not be a platform admin.
- Admins can only impersonate other users, not themselves.

Response:

```json
{
  "success": true,
  "message": "Impersonation started.",
  "data": {
    "token": "string",
    "dashboard": "tenant",
    "dashboard_context": {
      "primary_dashboard": "tenant",
      "is_platform_admin": false,
      "is_building_user": false,
      "has_active_lease": true,
      "available_dashboards": ["tenant"]
    },
    "user": "User",
    "impersonation": {
      "impersonator": {
        "id": 1,
        "name": "Platform Admin"
      },
      "impersonated_user": {
        "id": 24,
        "name": "Jane Doe"
      }
    }
  },
  "errors": null
}
```

Notes:

- The frontend should preserve the original admin token locally so `Stop Impersonate` can restore the admin session.
- The returned `dashboard` should be used for the first redirect after impersonation.

## Buildings

### POST `/api/buildings`

Create a building.

Authorization:

- Platform admin only.
- Normal users must submit a building registration request instead.

Request body:

```json
{
  "owner_id": 12,
  "name": "Sunrise Apartments",
  "address_line1": "12 Main St",
  "address_line2": "Suite 4",
  "city": "Lagos",
  "state": "Lagos",
  "postal_code": "100001",
  "country": "NG",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "formatted_address": "12 Main St, Lagos, NG",
  "description": "Modern apartments",
  "contact_email": "leasing@sunrise.com",
  "contact_phone": "+2348012345678",
  "for_sale": false,
  "sale_price": null
}
```

Model references: `BuildingCreateRequest`.

Notes:

- Building address data is persisted in the shared `addresses` table.
- On create or update, the API finds or creates a matching address record and stores `address_id` on the building.
- Building responses include the embedded `address` object and legacy top-level address fields for compatibility.

Response:

```json
{
  "success": true,
  "message": "Building created.",
  "data": {
    "building": "Building"
  },
  "errors": null
}
```

Model references: `Building`.

### GET `/api/buildings`

List buildings accessible to the authenticated user.

Authorization:

- Platform admin can see all buildings.
- Platform user can see buildings where they are a `landlord`, `manager`, or `caretaker`.

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

- Platform admin, landlord, manager, or caretaker.

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

- Platform admin, landlord, or manager.

Notes:

- If `for_sale` is `true`, `sale_price` is required (integer kobo).

Request body:

```json
{
  "name": "Sunrise Apartments",
  "address_line1": "12 Main St",
  "address_line2": "Suite 4",
  "city": "Lagos",
  "state": "Lagos",
  "postal_code": "100001",
  "country": "NG",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "formatted_address": "12 Main St, Lagos, NG",
  "description": "Renovated units",
  "contact_email": "leasing@sunrise.com",
  "contact_phone": "+2348012345678",
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

- Platform admin or landlord.

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
- Guests must sign up or log in before accessing the building registration request form.

Behavior:

- The request is always created with `pending` status.
- Owner contact details are copied from the authenticated user profile at submission time.
- The response includes platform admin contact details from `config/homelet.php` so the frontend can show approval follow-up instructions.

Request body:

```json
{
  "name": "Sunrise Apartments",
  "address_line1": "12 Main St",
  "address_line2": "Suite 4",
  "city": "Lagos",
  "state": "Lagos",
  "postal_code": "100001",
  "country": "NG",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "formatted_address": "12 Main St, Lagos, NG",
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
    "request": "BuildingRegistrationRequest",
    "admin_contacts": {
      "email": "admin@homelet.test",
      "phone": "+234 800 000 0000",
      "whatsapp": "+234 800 000 0000",
      "support_hours": "Monday to Friday, 9:00 AM - 5:00 PM WAT"
    }
  },
  "errors": null
}
```

Model references: `BuildingRegistrationRequest`, `PlatformAdminContacts`.

### GET `/api/building-registration-requests`

List the authenticated user's building registration requests.

Authorization:

- Authenticated user.
- Returns only requests submitted by the authenticated user.

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

### GET `/api/building-registration-requests/{buildingRegistrationRequest}`

Get one of the authenticated user's building registration requests.

Authorization:

- Authenticated user.
- The request must belong to the authenticated user.

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

### GET `/api/admin/building-registration-requests`

List all building registration requests (platform admin only).

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

Get a single building registration request (platform admin only).

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

Behavior:

- Only `pending` requests can be approved.
- Reuses the linked user when present; otherwise resolves or creates the owner from the stored owner phone/email.
- Creates the building and marks the request as `approved` in the same workflow.

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

Behavior:

- Only `pending` requests can be rejected.
- Stores the rejection reason and timestamps the rejection.

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

## Building Roles

### POST `/api/buildings/{building}/managers`

Assign a building role to a user (by email). If the user does not exist, it is created.

Behavior:

- A landlord can assign `landlord`, `manager`, and `caretaker`.
- A building can have multiple landlords.
- If the email does not exist yet, the API creates the user with a generated password before attaching the role.

Authorization:

- Platform admin can assign `landlord`, `manager`, or `caretaker`.
- Landlords can assign `landlord`, `manager`, or `caretaker`.

Request body:

```json
{
  "email": "manager@example.com",
  "name": "Manager Name",
  "role": "manager"
}
```

Model references: `BuildingManagerCreateRequest`.

Response:

```json
{
  "success": true,
  "message": "Building role assigned.",
  "data": {
    "user": "User",
    "role": "manager"
  },
  "errors": null
}
```

Model references: `User`.

### DELETE `/api/buildings/{building}/managers/{user}`

Remove a building role assignment.

Authorization:

- Platform admin can remove `manager` and `caretaker` roles.
- Landlords can remove `manager` and `caretaker` roles.
- Only the primary building owner (`buildings.owner_id`) can remove other landlords.
- The primary landlord (`buildings.owner_id`) cannot be removed from the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Building role removed.",
  "data": null,
  "errors": null
}
```

## Apartments

### POST `/api/buildings/{building}/apartments`

Create one or more apartments in a building.

Use `status` and `is_public` to control availability and whether the unit appears in public listings at creation time. For quick setup, omit optional descriptive fields and update the apartments later with `PUT /api/apartments/{apartment}`.

Authorization:

- Platform admin, landlord, or manager.

Single-apartment request body:

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

Bulk request body:

```json
{
  "apartments": [
    {
      "unit_code": "A1",
      "yearly_price": 1200000
    },
    {
      "unit_code": "A2",
      "type": "two_bedroom",
      "yearly_price": 1500000,
      "floor": "2",
      "status": "vacant",
      "is_public": true
    }
  ]
}
```

Notes:

- `apartments` accepts 1 to 50 items.
- Each bulk item requires only `unit_code` and `yearly_price`.
- `type` defaults to `custom`, `status` defaults to `vacant`, and `is_public` defaults to `true` when omitted.

Model references: `ApartmentCreateRequest`.

Response:

```json
{
  "success": true,
  "message": "Apartment created.",
  "data": {
    "apartment": "Apartment",
    "apartments": ["Apartment"],
    "created_count": 1
  },
  "errors": null
}
```

For bulk creates, `message` is `Apartments created.`, `apartment` is the first created apartment, `apartments` contains every created apartment, and `created_count` is the number created.

Model references: `Apartment`, `Apartment[]`.

### GET `/api/buildings/{building}/apartments`

List apartments for a building.

Authorization:

- Platform admin, landlord, manager, or caretaker.

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

- Platform admin, landlord, manager, or caretaker for the building.
- Tenant can view only if assigned to the apartment.

Request: none

Notes:

- Includes the apartment `building` and `media` relations.
- Includes `current_tenant` and `tenant` when a lease exists, with `id`, `lease_id`, `rent_amount`, `name`, `email`, `phone`, `lease_start`, `lease_end`, and `lease_status`.

Response:

```json
{
  "success": true,
  "message": "Apartment loaded.",
  "data": {
    "apartment": {
      "...": "Apartment",
      "current_tenant": {
        "id": 34,
        "lease_id": 91,
        "rent_amount": 1200000,
        "name": "Jane Tenant",
        "email": "jane@example.com",
        "phone": "08012345678",
        "lease_start": "2026-01-01",
        "lease_end": "2027-01-01",
        "lease_status": "active"
      },
      "tenant": {
        "id": 34,
        "lease_id": 91,
        "rent_amount": 1200000,
        "name": "Jane Tenant",
        "email": "jane@example.com",
        "phone": "08012345678",
        "lease_start": "2026-01-01",
        "lease_end": "2027-01-01",
        "lease_status": "active"
      }
    }
  },
  "errors": null
}
```

Model references: `Apartment`.

### GET `/api/public/apartments/{apartment}`

Get a public apartment with embedded building contact details, media, and reviews.

Authorization:

- Public.

Request: none

Response:

```json
{
  "success": true,
  "message": "Public apartment loaded.",
  "data": {
    "apartment": "Apartment"
  },
  "errors": null
}
```

Model references: `Apartment`.

### PUT `/api/apartments/{apartment}`

Update apartment details.

This endpoint supports admin edit screens for updating availability and public visibility without recreating the apartment.

Authorization:

- Platform admin, landlord, or manager.

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

- Platform admin, landlord, or manager.
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

### POST `/api/apartments/{apartment}/assign-tenant/lookup`

Confirm whether the entered tenant phone/email already belongs to an existing user before assignment.

Authorization:

- Owner/admin/manager only.

Behavior:

- Uses the same phone/email matching rules as final tenant assignment.
- Returns the matched user when one exists.
- Returns validation errors if the provided phone and email belong to different users.

Request body:

```json
{
  "tenant_email": "tenant@example.com",
  "tenant_phone": "08012345678"
}
```

Model references: `LookupTenantRequest`.

Notes:

- At least one of `tenant_phone` or `tenant_email` is required.
- `tenant_phone` is normalized to digits only when provided.
- `tenant_email` is normalized to lowercase when provided.

Response:

```json
{
  "success": true,
  "message": "Tenant lookup completed.",
  "data": {
    "exists": true,
    "requires_name": false,
    "tenant": "User"
  },
  "errors": null
}
```

Model references: `User`.

### POST `/api/apartments/{apartment}/assign-tenant`

Assign a tenant to an apartment and create an active lease.

Authorization:

- Owner/admin/manager only.

Behavior:

- Creates the user if missing. New accounts still receive the default platform `user` role.
- Creates active lease with `end_date = start_date + 1 year`.
- Can optionally record an initial manual payment in the same transaction.
- Sets apartment status to `occupied`.
- Entire operation is transactional.
- Rejects mismatched phone/email combinations that point to different users.

Request body:

```json
{
  "tenant_email": "tenant@example.com",
  "tenant_phone": "08012345678",
  "tenant_name": "Tenant Name",
  "start_date": "2026-03-01",
  "rent_amount": 1200000,
  "record_payment": true,
  "payment_amount": 600000,
  "payment_date": "2026-03-01",
  "payment_due_date": "2026-03-05",
  "payment_status": "paid",
  "payment_reference": "PAY-001"
}
```

Model references: `AssignTenantRequest`.

Notes:

- `tenant_phone` is required and normalized to digits only.
- `tenant_email` is optional.
- `tenant_name` is required when the phone/email do not match an existing user.
- `rent_amount` is the annual rent amount and defaults to apartment `yearly_price` when omitted.
- Set `record_payment` to `true` to create a manual payment immediately after the lease is created.
- When `record_payment` is `true`, `payment_amount` and `payment_date` are required.
- `payment_due_date`, `payment_status`, and `payment_reference` are optional.

Response:

```json
{
  "success": true,
  "message": "Tenant assigned.",
  "data": {
    "tenant": "User",
    "lease": "Lease",
    "payment": "Payment|null",
    "apartment": "Apartment"
  },
  "errors": null
}
```

Model references: `User`, `Lease`, `Payment`, `Apartment`.

## Lease Lifecycle

### PUT `/api/leases/{lease}/extend`

Extend an active lease by changing the existing lease `end_date`.

Authorization:

- Platform admin always has access.
- Landlords and managers can extend leases for apartments in buildings they manage.

Behavior:

- Only leases with `status=active` can be extended.
- Updates the same lease record. No new lease is created.
- Accepts either `new_end_date` or `duration_in_months`.

Request body:

```json
{
  "duration_in_months": 6
}
```

or

```json
{
  "new_end_date": "2027-06-30"
}
```

Model references: `ExtendLeaseRequest`.

Validation notes:

- Provide either `new_end_date` or `duration_in_months`, not both.
- `new_end_date` must be after the current lease `end_date`.
- `duration_in_months` must be at least `1`.

Response:

```json
{
  "success": true,
  "message": "Lease extended.",
  "data": {
    "lease": "Lease",
    "apartment": "Apartment"
  },
  "errors": null
}
```

Model references: `Lease`, `Apartment`.

### POST `/api/leases/{lease}/renew`

Renew an active or expired lease by closing the current lease and creating a brand new active lease.

Authorization:

- Platform admin always has access.
- Landlords and managers can renew leases for apartments in buildings they manage.

Behavior:

- Accepts leases with `status=active` or `status=expired`.
- Defaults `start_date` to the day after the current lease `end_date`.
- Accepts either `end_date` or `duration_in_months` for the new lease period.
- Marks the previous lease as `renewed` when it was active, otherwise keeps it `expired`.
- Creates a new active lease for the same apartment and tenant.
- Can optionally record the first manual payment for the renewed lease in the same transaction.

Request body:

```json
{
  "start_date": "2027-01-01",
  "new_rent_amount": 1350000,
  "duration_in_months": 12,
  "record_payment": true,
  "payment_amount": 675000,
  "payment_date": "2027-01-01",
  "payment_due_date": "2027-01-05",
  "payment_status": "paid",
  "payment_reference": "RENEW-001"
}
```

or

```json
{
  "end_date": "2027-12-31"
}
```

Model references: `RenewLeaseRequest`.

Validation notes:

- Provide either `end_date` or `duration_in_months`, not both.
- Only the most recent lease by `end_date` for the tenant in that building can be renewed.
- `start_date` must be after the current lease `end_date`.
- `end_date` must be after the renewal `start_date`.
- `new_rent_amount` defaults to the current lease rent when omitted.
- When `record_payment` is `true`, `payment_amount` and `payment_date` are required.

Response:

```json
{
  "success": true,
  "message": "Lease renewed.",
  "data": {
    "previous_lease": "Lease",
    "lease": "Lease",
    "payment": "Payment|null",
    "apartment": "Apartment"
  },
  "errors": null
}
```

Model references: `Lease`, `Payment`, `Apartment`.

## Tenants

### GET `/api/tenants`

List tenants for buildings the authenticated user can manage.

Authorization:

- Platform admin, landlord, or manager.

Request: none

Response:

```json
{
  "success": true,
  "message": "Tenants loaded.",
  "data": {
    "tenants": {
      "data": [
        {
          "id": 14,
          "name": "Jane Doe",
          "email": "jane@example.com",
          "phone": "08012345678",
          "current_lease": {
            "id": 5,
            "status": "active",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "next_due_date": "2026-12-31",
            "days_remaining": 266,
            "days_exceeded": null,
            "is_overdue": false,
            "apartment": {
              "id": 8,
              "unit_code": "A1",
              "building": {
                "id": 3,
                "name": "Sunrise Apartments"
              }
            }
          },
          "active_lease": {
            "id": 5,
            "status": "active",
            "end_date": "2026-12-31"
          }
        }
      ]
    }
  },
  "errors": null
}
```

Notes:

- `current_lease` is the tenant's latest lease in scope, whether active or expired.
- `next_due_date` currently maps to the lease end date.
- `days_remaining` is returned when the lease has not passed its due date.
- `days_exceeded` is returned when the lease due date has already passed.

### GET `/api/buildings/{building}/tenants`

List only the tenants attached to a specific building.

Authorization:

- Platform admin, landlord, manager, or caretaker with access to the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Building tenants loaded.",
  "data": {
    "building": {
      "id": 3,
      "name": "Sunrise Apartments"
    },
    "tenants": {
      "data": [
        {
          "id": 14,
          "name": "Jane Doe",
          "current_lease": {
            "id": 5,
            "status": "expired",
            "next_due_date": "2026-03-31",
            "days_remaining": null,
            "days_exceeded": 9,
            "is_overdue": true
          }
        }
      ]
    }
  },
  "errors": null
}
```

Model references: `User`, `LeaseSummary`.

### GET `/api/tenants/{tenant}`

Get a tenant profile with lease and payment history.

Authorization:

- Platform admin always has access.
- Landlords and managers can view tenants in their buildings.
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
    "payments": "Payment[]",
    "balance": {
      "total_lease_rent": 1200000,
      "total_paid": 400000,
      "outstanding_balance": 800000
    }
  },
  "errors": null
}
```

Model references: `User`, `Lease[]`, `Payment[]`.

Notes:

- Lease history can include `active`, `expired`, `renewed`, or `terminated` records.
- Lease history is ordered by `end_date` descending.
- `balance.outstanding_balance` is derived from total lease rent minus payments with `paid` status.

## Payments

### POST `/api/payments`

Record a payment.

Authorization:

- Tenant can submit `online` payments for their own lease.
- Platform admin, landlord, and manager can submit `manual` payments.

Behavior:

- The recorded payment is always attached to the lease tenant.
- The assign-tenant flow reuses the same payment recording rules when `record_payment=true`.

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

List payments visible to the authenticated operator.

Authorization:

- Platform admin sees all payments.
- Landlords and managers see payments for their buildings.

Request: none

Response:

```json
{
  "success": true,
  "message": "Payments loaded.",
  "data": {
    "payments": [
      {
        "id": 10,
        "lease_id": 1,
        "amount": 150000,
        "payment_method": "online",
        "method": "online",
        "payment_date": "2026-03-01",
        "due_date": "2026-03-01",
        "status": "paid",
        "tenant": {
          "name": "Jane Doe"
        },
        "apartment": {
          "id": 4,
          "unit_code": "A-102"
        }
      }
    ]
  },
  "errors": null
}
```

Model references: `PaymentSummary[]`.

### GET `/api/tenant/payments`

List payments for the authenticated tenant.

Authorization:

- Any authenticated user with lease payments.

Request: none

Response:

```json
{
  "success": true,
  "message": "Payments loaded.",
  "data": {
    "payments": [
      {
        "id": 10,
        "lease_id": 1,
        "amount": 150000,
        "payment_method": "online",
        "method": "online",
        "payment_date": "2026-03-01",
        "due_date": "2026-03-01",
        "status": "paid",
        "tenant": {
          "name": "Jane Doe"
        },
        "apartment": {
          "id": 4,
          "unit_code": "A-102"
        }
      }
    ]
  },
  "errors": null
}
```

Model references: `PaymentSummary[]`.

## Expenses

### GET `/api/expenses`

List expenses visible to the authenticated operator.

Authorization:

- Platform admin sees all expenses.
- Landlords and managers see expenses for their buildings.

Query parameters:

- `building_id` optional integer filter.
- `category_id` optional integer filter.

Request: none

Response:

```json
{
  "success": true,
  "message": "Expenses loaded.",
  "data": {
    "expenses": [
      {
        "id": 8,
        "building_id": 2,
        "expense_category_id": 4,
        "recorded_by": 6,
        "title": "Generator service",
        "vendor_name": "PowerFix Ltd",
        "amount": 120000,
        "expense_date": "2026-04-10",
        "payment_method": "bank_transfer",
        "reference": "EXP-100",
        "description": "Quarterly generator servicing",
        "notes": "Paid same day",
        "building": {
          "id": 2,
          "name": "Sunrise Apartments"
        },
        "category": {
          "id": 4,
          "building_id": 2,
          "name": "Repairs",
          "color": "#2563EB"
        },
        "recorder": {
          "id": 6,
          "name": "John Manager"
        },
        "permissions": {
          "can_update": true,
          "can_delete": true,
          "update_denial_reason": null,
          "delete_denial_reason": null
        }
      }
    ]
  },
  "errors": null
}
```

Model references: `Expense[]`.

### POST `/api/expenses`

Record an expense for a building.

Authorization:

- Platform admin, landlord, or manager for the selected building.

Validation notes:

- `expense_category_id` is optional.
- When provided, the category must belong to the selected building.
- `payment_method` can be `cash`, `bank_transfer`, `card`, `cheque`, or `other`.

Request body:

```json
{
  "building_id": 2,
  "expense_category_id": 4,
  "title": "Generator service",
  "vendor_name": "PowerFix Ltd",
  "amount": 120000,
  "expense_date": "2026-04-10",
  "payment_method": "bank_transfer",
  "reference": "EXP-100",
  "description": "Quarterly generator servicing",
  "notes": "Paid same day"
}
```

Model references: `ExpenseCreateRequest`.

Response:

```json
{
  "success": true,
  "message": "Expense recorded.",
  "data": {
    "expense": {
      "id": 8,
      "permissions": {
        "can_update": true,
        "can_delete": true,
        "update_denial_reason": null,
        "delete_denial_reason": null
      }
    }
  },
  "errors": null
}
```

Model references: `Expense`.

### PUT `/api/expenses/{expense}`

Update an existing expense record.

Authorization:

- Platform admin can update any expense.
- A building user assigned the `landlord` role can update the expense while it remains the latest recorded expense for that building.
- The building owner can update the expense while it remains the latest recorded expense for that building.
- Manager for the building can update the expense while it remains the latest recorded expense for that building.
- The user who recorded the expense can update it while it remains the latest recorded expense for that building.

Validation notes:

- `expense_category_id` is optional.
- When provided, the category must belong to the selected building.
- `payment_method` can be `cash`, `bank_transfer`, `card`, `cheque`, or `other`.

Request body:

```json
{
  "building_id": 2,
  "expense_category_id": 4,
  "title": "Generator overhaul",
  "vendor_name": "PowerFix Ltd",
  "amount": 145000,
  "expense_date": "2026-04-10",
  "payment_method": "bank_transfer",
  "reference": "EXP-100",
  "description": "Quarterly generator servicing",
  "notes": "Updated after invoice reconciliation"
}
```

Response:

```json
{
  "success": true,
  "message": "Expense updated.",
  "data": {
    "expense": {
      "id": 8,
      "permissions": {
        "can_update": true,
        "can_delete": true,
        "update_denial_reason": null,
        "delete_denial_reason": null
      }
    }
  },
  "errors": null
}
```

Model references: `Expense`.

### DELETE `/api/expenses/{expense}`

Delete an existing expense record.

Authorization:

- Platform admin can delete any expense.
- A building user assigned the `landlord` role can delete the expense while it remains the latest recorded expense for that building.
- The building owner can delete the expense while it remains the latest recorded expense for that building.
- Manager for the building can delete the expense while it remains the latest recorded expense for that building.
- The user who recorded the expense can delete it while it remains the latest recorded expense for that building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Expense deleted.",
  "data": null,
  "errors": null
}
```

Notes:

- Expense list responses now include `permissions.can_update`, `permissions.can_delete`, `permissions.update_denial_reason`, and `permissions.delete_denial_reason` for each expense row.

### GET `/api/buildings/{building}/expense-categories`

List expense categories for a building.

Authorization:

- Platform admin, landlord, or manager for the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Expense categories loaded.",
  "data": {
    "categories": [
      {
        "id": 4,
        "building_id": 2,
        "name": "Repairs",
        "color": "#2563EB",
        "description": "Repairs and servicing"
      }
    ]
  },
  "errors": null
}
```

Model references: `ExpenseCategory[]`.

### POST `/api/buildings/{building}/expense-categories`

Create an expense category for a building.

Authorization:

- Platform admin, landlord, or manager for the building.

Request body:

```json
{
  "name": "Repairs",
  "color": "#2563EB",
  "description": "Repairs and servicing"
}
```

Model references: `ExpenseCategoryCreateRequest`.

Response:

```json
{
  "success": true,
  "message": "Expense category created.",
  "data": {
    "category": "ExpenseCategory"
  },
  "errors": null
}
```

Model references: `ExpenseCategory`.

### PUT `/api/buildings/{building}/expense-categories/{expenseCategory}`

Update an expense category for a building.

Authorization:

- Platform admin, landlord, or manager for the building.

Request body:

```json
{
  "name": "Utility Bills"
}
```

Model references: `ExpenseCategoryUpdateRequest`.

Response:

```json
{
  "success": true,
  "message": "Expense category updated.",
  "data": {
    "category": "ExpenseCategory"
  },
  "errors": null
}
```

Model references: `ExpenseCategory`.

### DELETE `/api/buildings/{building}/expense-categories/{expenseCategory}`

Delete an expense category for a building.

Authorization:

- Platform admin, landlord, or manager for the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Expense category deleted.",
  "data": null,
  "errors": null
}
```

## Public Listings + Rental Requests

Public routes are throttled via `throttle:60,1`.

### GET `/api/public/apartments`

List vacant public apartments with building summary and building contact details.

Request: none

Response:

```json
{
  "success": true,
  "message": "Public apartments loaded.",
  "data": {
    "apartments": "ApartmentSummary[]"
  },
  "errors": null
}
```

Model references: `ApartmentSummary[]`, `BuildingSummary`.

Notes:

- Each apartment includes its `building` summary with contact details and normalized address fields.

### GET `/api/public/buildings`

List buildings that have at least one vacant public apartment.

Request: none

Response:

```json
{
  "success": true,
  "message": "Public buildings loaded.",
  "data": {
    "buildings": "BuildingSummary[]"
  },
  "errors": null
}
```

Model references: `BuildingSummary[]`.

Notes:

- Only buildings with at least one apartment where `is_public=true` and `status=vacant` are returned.
- `public_apartments_count` is the number of vacant public apartments currently available in the building.

### GET `/api/public/buildings/{building}`

Get a public building with contact details and its vacant public apartments.

Request: none

Response:

```json
{
  "success": true,
  "message": "Public building loaded.",
  "data": {
    "building": "Building"
  },
  "errors": null
}
```

Model references: `Building`, `ApartmentSummary[]`.

Notes:

- The embedded `apartments` collection only includes apartments where `is_public=true` and `status=vacant`.
- Buildings without any vacant public apartments return `404`.

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

### GET `/api/public/rent-request-apartments/{apartment}`

Load apartment details for a landlord/manager-shared rental request link.

Request: none

Response:

```json
{
  "success": true,
  "message": "Rental request apartment loaded.",
  "data": {
    "apartment": "ApartmentSummary",
    "can_request": true,
    "unavailable_message": null
  },
  "errors": null
}
```

Model references: `ApartmentSummary`, `BuildingSummary`.
Notes:

- This endpoint powers the public frontend route `/rent/request/{apartment_id}`.
- It can load a specific apartment by id even when the apartment is not in the public listing.
- The returned apartment includes its `building` summary with contact details and normalized address fields.
- `can_request` is `true` only when the apartment status is `vacant`.
- When the apartment is occupied or under maintenance, `can_request` is `false` and `unavailable_message` contains a friendly message for the intending tenant.

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
  "message": "Rental request submitted.",
  "data": {
    "rental_request": "RentalRequest"
  },
  "errors": null
}
```

Model references: `RentalRequest`.
Notes:

- `apartment_id` is the selected available apartment the applicant wants to rent.
- The apartment must still be `vacant`; unavailable apartments return a validation error.
- `email` is normalized to lowercase.
- `phone` is normalized to digits-only when supplied.

Alias:

- POST `/api/public/request-interest`

### GET `/api/rental-requests`

List rental requests visible to the authenticated operator.

Authorization:

- Platform admin sees all rental requests.
- Landlords and managers see requests for their buildings.

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

Update a rental request before a final decision.

Authorization:

- Platform admin, landlord, or manager.

Request body:

```json
{
  "status": "contacted"
}
```

Model references: `RentalRequestUpdateRequest`.
Rules:

- Only `new` and `contacted` are valid values here.
- Use the dedicated approve/reject endpoints for final actions.

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

### POST `/api/rental-requests/{rentalRequest}/approve`

Approve a rental request, create or reuse the tenant account, create a lease, and optionally record the first payment.

Authorization:

- Platform admin, landlord, or manager.

Request body:

```json
{
  "apartment_id": 12,
  "start_date": "2026-04-01",
  "rent_amount": 1200000,
  "record_payment": true,
  "payment_amount": 600000,
  "payment_date": "2026-04-01",
  "payment_due_date": "2026-04-05",
  "payment_status": "paid",
  "payment_reference": "RR-001"
}
```

Model references: `RentalRequestApproveRequest`.
Behavior notes:

- Approval is allowed only while the request is `new` or `contacted`.
- `apartment_id` is optional. When supplied, the manager assigns the request to that apartment for lease creation; otherwise the originally requested apartment is used.
- The selected approval apartment must be in the same building as the originally requested apartment and must belong to a building the operator can manage.
- The applicant is matched to an existing user by email/phone when possible; otherwise a tenant user is created.
- A new active lease is created for the apartment and the apartment is marked `occupied`.
- When `record_payment` is true, a manual payment is created against the new lease.
- The tenancy agreement email job is dispatched after lease creation.

Response:

```json
{
  "success": true,
  "message": "Rental request approved.",
  "data": {
    "rental_request": "RentalRequest",
    "tenant": "User",
    "lease": "Lease",
    "payment": "Payment|null"
  },
  "errors": null
}
```

Model references: `RentalRequest`, `User`, `Lease`, `Payment`.

### POST `/api/rental-requests/{rentalRequest}/reject`

Reject a rental request and notify the applicant.

Authorization:

- Platform admin, landlord, or manager.

Request body:

```json
{
  "rejection_reason": "The apartment is no longer available."
}
```

Model references: `RentalRequestRejectRequest`.
Behavior notes:

- Rejection is allowed only while the request is `new` or `contacted`.
- The request status is updated to `rejected`.
- A rejection email is sent when the request has an email address.
- An SMS notification is sent when the request has a phone number.

Response:

```json
{
  "success": true,
  "message": "Rental request rejected.",
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
- Platform admin, landlord, or manager only within building scope.
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
- `participant_ids` is optional for tenants.
- When a tenant omits `participant_ids`, the API automatically adds the building staff participants for that apartment/building conversation.

Response:

```json
{
  "success": true,
  "message": "Conversation created.",
  "data": {
    "conversation": "ConversationSummary"
  },
  "errors": null
}
```

Model references: `ConversationSummary`.

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

Each `ConversationSummary` item includes chat-ready display metadata:

- `title`: conversation name relative to the current user.
- `subtitle`: apartment/building context such as `A-12 · Sunset Towers`.
- `counterpart`: the other participant(s), including `name`, `names`, and `count`.
- `participants`: participant list with `is_current_user`.
- `last_message`: latest message preview with `sender` and `is_mine`.
- `unread_count`: number of unread incoming messages for the current user.

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

Each `Message` item includes:

- `sender`: `{ id, name, role }`
- `is_mine`: whether the message was sent by the authenticated user
- `read_at`: ISO-8601 timestamp when the message was marked as read, or `null`

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
  "message": "Conversation marked as read.",
  "data": {
    "updated": 3
  },
  "errors": null
}
```

Model references: none.

## Maintenance Requests

### POST `/api/maintenance-requests`

Create a maintenance request.

Authorization:

- Authenticated user with an active lease for the apartment.

Request body:

```json
{
  "apartment_id": 1,
  "title": "Leaking pipe",
  "description": "Pipe under sink is leaking.",
  "priority": "high"
}
```

Model references: `MaintenanceRequestCreateRequest`.

Notes:

- `priority` is optional and must be one of `low`, `medium`, or `high`. It defaults to `low` when omitted.

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
- Platform admin: all requests.
- Landlord/manager/caretaker: requests for their buildings.

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

### GET `/api/maintenance-requests/{maintenanceRequest}`

Show a maintenance request.

Authorization:

- Tenant owner of the request.
- Platform admin, landlord, manager, or caretaker for the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Maintenance request loaded.",
  "data": {
    "maintenance_request": "MaintenanceRequest"
  },
  "errors": null
}
```

Model references: `MaintenanceRequest`.

### PUT `/api/maintenance-requests/{maintenanceRequest}`

Update maintenance request status.

Authorization:

- Platform admin, landlord, manager, or caretaker.

Request body:

```json
{
  "status": "in_progress"
}
```

Model references: `MaintenanceRequestUpdateRequest`.
Rules:

- `status` must be one of `open`, `in_progress`, or `resolved`.

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

- Platform admin, landlord, or manager for the building.

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
Behavior notes:

- Building media is returned in upload order, oldest first. The first uploaded image is the building cover/banner.

### POST `/api/buildings/{building}/media`

Upload building media (images/videos).

Authorization:

- Platform admin, landlord, or manager for the building.

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

### DELETE `/api/buildings/{building}/media/{media}`

Delete a building media item.

Authorization:

- Platform admin, landlord, or manager for the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Building media deleted.",
  "data": null,
  "errors": null
}
```

### GET `/api/apartments/{apartment}/media`

List media for an apartment.

Authorization:

- Platform admin, landlord, manager, or caretaker for the building.
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

- Platform admin, landlord, or manager for the building.

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

### DELETE `/api/apartments/{apartment}/media/{media}`

Delete an apartment media item.

Authorization:

- Platform admin, landlord, or manager for the building.

Request: none

Response:

```json
{
  "success": true,
  "message": "Apartment media deleted.",
  "data": null,
  "errors": null
}
```

### GET `/api/maintenance-requests/{maintenanceRequest}/media`

List media for a maintenance request.

Authorization:

- Tenant owner of the request.
- Platform admin, landlord, manager, or caretaker for the building.

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
- Platform admin, landlord, manager, or caretaker for the building.

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

Behavior:

- The response `review.verified` flag is `true` only when the reviewer has a lease in that building.

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

Behavior:

- The response `review.verified` flag is `true` only when the reviewer has a lease for that apartment.

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

Operations dashboard metrics.

Authorization:

- Platform admin sees all buildings.
- Landlords and managers see their building portfolio.

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

Notes:

- `metrics.counts` includes `buildings`, `apartments`, `vacant`, `occupied`, and `tenants`.
- `metrics` also includes `expiring_leases_next_90_days`, `total_income_paid`, `pending_payments`, `overdue_payments`, and `maintenance_requests`.

### GET `/api/dashboard/tenant`

Tenant dashboard metrics.

Authorization:

- Authenticated user with an active lease.

Request: none

Response:

```json
{
  "success": true,
  "message": "Tenant dashboard loaded.",
  "data": {
    "active_lease": "Lease",
    "days_to_expiry": 120,
    "last_payment": "Payment",
    "payment_summary": {
      "paid": 3,
      "pending": 1,
      "failed": 0
    }
  },
  "errors": null
}
```

Model references: `Lease`, `Payment`.

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

### `users:assign-admin {email}`

- Assigns the platform `admin` role to an existing user.
- This is the only supported path for granting platform admin access.

## Tenancy Agreement + Quit Notice (Behavioral)

When a tenant is assigned to an apartment:

- A tenancy agreement is generated and emailed to the tenant.
- Agreement includes a clause stating that a quit notice will be issued automatically if the lease expires without renewal.

When a lease expires without renewal:

- A quit notice is generated and emailed to the tenant.
- Apartment becomes immediately available to the public (`status = vacant`, `is_public = true`).
