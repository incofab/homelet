# Model Structures

This document defines the model and request structures used by the API. It is the source of truth for frontend typing.

## Conventions

- Types are written as `string`, `number`, `boolean`, `array`, or `object`.
- Nullable fields are `type|null`.
- Dates use `YYYY-MM-DD` strings unless stated otherwise.
- Timestamps use ISO 8601 strings (e.g. `2026-03-01T12:00:00Z`).
- Money in API payloads is integer kobo (use `number`).
- Fields marked “derived” are not stored directly but are returned by the API.

## Entity Models

### User
```
User: {
  id: number, eg 1
  name: string, eg "Jane Doe"
  email: string, eg "jane@example.com"
  phone: string|null, eg "1234567890"
  role: string, eg "owner" (derived)
}
```

### Building
```
Building: {
  id: number, eg 1
  owner_id: number, eg 1
  name: string, eg "Sunrise Apartments"
  address_line1: string, eg "12 Main St"
  address_line2: string|null, eg "Suite 4"
  city: string, eg "Lagos"
  state: string, eg "Lagos"
  country: string, eg "NG"
  description: string|null, eg "Modern apartments"
  for_sale: boolean, eg false
  sale_price: number|null, eg 120000000
}
```

### BuildingSummary
```
BuildingSummary: {
  id: number, eg 1
  name: string, eg "Sunrise Apartments"
  city: string, eg "Lagos"
  state: string, eg "Lagos"
  country: string, eg "NG"
  for_sale: boolean, eg false
  sale_price: number|null, eg 120000000
}
```

### BuildingRegistrationRequest
```
BuildingRegistrationRequest: {
  id: number, eg 1
  user_id: number|null, eg 1
  building_id: number|null, eg 1
  status: string, eg "pending"
  approved_by: number|null, eg 1
  rejected_by: number|null, eg 1
  approved_at: string|null, eg "2026-03-08T12:00:00Z"
  rejected_at: string|null, eg "2026-03-08T12:00:00Z"
  rejection_reason: string|null, eg "Missing documents"
  owner_name: string|null, eg "Jane Doe"
  owner_email: string|null, eg "jane@example.com"
  owner_phone: string|null, eg "1234567890"
  name: string, eg "Sunrise Apartments"
  address_line1: string, eg "12 Main St"
  address_line2: string|null, eg "Suite 4"
  city: string, eg "Lagos"
  state: string, eg "Lagos"
  country: string, eg "NG"
  description: string|null, eg "Modern apartments"
  for_sale: boolean, eg false
  sale_price: number|null, eg 120000000
}
```

### Apartment
```
Apartment: {
  id: number, eg 1
  building_id: number, eg 1
  unit_code: string, eg "A1"
  type: string, eg "one_bedroom"
  yearly_price: number, eg 1200000
  description: string|null, eg "Large 1BR"
  floor: string|null, eg "2"
  status: string, eg "vacant"
  is_public: boolean, eg true
  amenities: array<string>|null, eg ["wifi", "parking"]
}
```

### ApartmentSummary
```
ApartmentSummary: {
  id: number, eg 1
  building_id: number, eg 1
  unit_code: string, eg "A1"
  type: string, eg "one_bedroom"
  yearly_price: number, eg 1200000
  status: string, eg "vacant"
  is_public: boolean, eg true
}
```

### Lease
```
Lease: {
  id: number, eg 5
  apartment_id: number, eg 1
  tenant_id: number, eg 20
  rent_amount: number, eg 1200000
  start_date: string, eg "2026-03-01"
  end_date: string|null, eg "2027-02-28"
  status: string, eg "active"
}
```

### LeaseSummary
```
LeaseSummary: {
  id: number, eg 5
  status: string, eg "active"
  apartment: { id: number, unit_code: string }, eg { "id": 1, "unit_code": "A1" }
  building: { id: number, name: string }, eg { "id": 1, "name": "Sunrise Apartments" }
}
```

### Payment
```
Payment: {
  id: number, eg 10
  lease_id: number, eg 1
  tenant_id: number, eg 20
  amount: number, eg 150000
  payment_method: string, eg "online"
  transaction_reference: string|null, eg "TRX-12345"
  payment_date: string, eg "2026-03-01"
  status: string, eg "paid"
  metadata: object|null, eg { "channel": "card", "processor": "paystack" }
}
```

### PaymentSummary
```
PaymentSummary: {
  id: number, eg 10
  lease_id: number, eg 1
  amount: number, eg 150000
  payment_method: string, eg "online"
  payment_date: string, eg "2026-03-01"
  status: string, eg "paid"
}
```

### RentalRequest
```
RentalRequest: {
  id: number, eg 1
  apartment_id: number, eg 1
  name: string, eg "Prospective Tenant"
  email: string, eg "lead@example.com"
  phone: string|null, eg "1234567890"
  message: string|null, eg "Interested in the unit"
  status: string, eg "new"
}
```

### RentalRequestSummary
```
RentalRequestSummary: {
  id: number, eg 1
  apartment_id: number, eg 1
  name: string, eg "Prospective Tenant"
  email: string, eg "lead@example.com"
  phone: string|null, eg "1234567890"
  status: string, eg "new"
}
```

### Conversation
```
Conversation: {
  id: number, eg 1
  building_id: number|null, eg 1
  apartment_id: number|null, eg 2
  participants: array<{ id: number, name: string }>, eg [{ "id": 10, "name": "Manager Name" }]
}
```

### ConversationSummary
```
ConversationSummary: {
  id: number, eg 1
  building_id: number|null, eg 1
  apartment_id: number|null, eg 2
  last_message: { id: number, body: string, created_at: string }|null, eg { "id": 100, "body": "Hello", "created_at": "2026-03-01T12:00:00Z" }
}
```

### Message
```
Message: {
  id: number, eg 100
  conversation_id: number, eg 1
  sender_id: number, eg 11
  body: string, eg "Hello there"
  read_at: string|null, eg "2026-03-01T12:05:00Z"
  created_at: string, eg "2026-03-01T12:00:00Z"
}
```

### MaintenanceRequest
```
MaintenanceRequest: {
  id: number, eg 1
  apartment_id: number, eg 1
  tenant_id: number, eg 20
  title: string, eg "Leaking pipe"
  description: string, eg "Pipe under sink is leaking."
  status: string, eg "open"
}
```

### MaintenanceRequestSummary
```
MaintenanceRequestSummary: {
  id: number, eg 1
  apartment_id: number, eg 1
  title: string, eg "Leaking pipe"
  status: string, eg "open"
}
```

### Media
```
Media: {
  id: number, eg 2
  model_type: string, eg "building"
  model_id: number, eg 1
  collection: string, eg "images"
  url: string|null, eg "https://cdn.example.com/media/2.jpg"
}
```

### Review
```
Review: {
  id: number, eg 2
  rating: number, eg 5
  comment: string, eg "Verified tenant review."
  verified: boolean, eg true
}
```

### AdminDashboardMetrics
```
AdminDashboardMetrics: {
  counts: {
    buildings: number, eg 1
    apartments: number, eg 10
    vacant: number, eg 3
    occupied: number, eg 7
  }
  expiring_leases_next_90_days: number, eg 2
  total_income_paid: number, eg 3500000
  pending_payments: number, eg 4
}
```

### TenantDashboardMetrics
```
TenantDashboardMetrics: {
  active_lease: { id: number, status: string, end_date: string|null }|null, eg { "id": 1, "status": "active", "end_date": "2026-12-31" }
  days_to_expiry: number|null, eg 90
  last_payment: { id: number, status: string, payment_date: string }|null, eg { "id": 10, "status": "paid", "payment_date": "2026-03-01" }
  payment_summary: {
    paid: number, eg 3
    pending: number, eg 1
    failed: number, eg 0
  }
}
```

## Request Models

### RegisterRequest
```
RegisterRequest: {
  name: string, eg "Jane Doe"
  email: string, eg "jane@example.com"
  phone: string|null, eg "1234567890"
  password: string, eg "secret"
  password_confirmation: string, eg "secret"
}
```

### LoginRequest
```
LoginRequest: {
  email: string, eg "jane@example.com"
  password: string, eg "secret"
}
```

### BuildingCreateRequest
```
BuildingCreateRequest: {
  name: string, eg "Sunrise Apartments"
  address_line1: string, eg "12 Main St"
  address_line2: string|null, eg "Suite 4"
  city: string, eg "Lagos"
  state: string, eg "Lagos"
  country: string, eg "NG"
  description: string|null, eg "Modern apartments"
  for_sale: boolean, eg false
  sale_price: number|null, eg 120000000
}
```

### BuildingRegistrationRequestCreateRequest
```
BuildingRegistrationRequestCreateRequest: {
  name: string, eg "Sunrise Apartments"
  address_line1: string, eg "12 Main St"
  address_line2: string|null, eg "Suite 4"
  city: string, eg "Lagos"
  state: string, eg "Lagos"
  country: string, eg "NG"
  description: string|null, eg "Modern apartments"
  for_sale: boolean, eg false
  sale_price: number|null, eg 120000000
  owner_name: string|null, eg "Jane Doe" (required for public requests)
  owner_email: string|null, eg "jane@example.com" (required for public requests)
  owner_phone: string|null, eg "1234567890" (required for public requests)
  owner_password: string|null, eg "secret" (required for public requests)
  owner_password_confirmation: string|null, eg "secret" (required for public requests)
}
```

### BuildingUpdateRequest
```
BuildingUpdateRequest: {
  name: string, eg "Sunrise Apartments"
  description: string, eg "Renovated units"
  for_sale: boolean, eg true
  sale_price: number|null, eg 120000000
}
```

### BuildingManagerCreateRequest
```
BuildingManagerCreateRequest: {
  email: string, eg "manager@example.com"
  name: string, eg "Manager Name"
}
```

### ApartmentCreateRequest
```
ApartmentCreateRequest: {
  unit_code: string, eg "A1"
  type: string, eg "one_bedroom"
  yearly_price: number, eg 1200000
  description: string|null, eg "Large 1BR"
  floor: string|null, eg "2"
  status: string, eg "vacant"
  is_public: boolean, eg true
  amenities: array<string>|null, eg ["wifi", "parking"]
}
```

### ApartmentUpdateRequest
```
ApartmentUpdateRequest: {
  yearly_price: number, eg 1300000
  status: string, eg "vacant"
  is_public: boolean, eg true
}
```

### AssignTenantRequest
```
AssignTenantRequest: {
  tenant_email: string, eg "tenant@example.com"
  tenant_name: string, eg "Tenant Name"
  start_date: string, eg "2026-03-01"
  rent_amount: number, eg 1200000
}
```

### PaymentCreateRequest
```
PaymentCreateRequest: {
  lease_id: number, eg 1
  amount: number, eg 150000
  payment_method: string, eg "online"
  transaction_reference: string|null, eg "TRX-12345"
  payment_date: string, eg "2026-03-01"
  status: string, eg "paid"
  metadata: object|null, eg { "channel": "card", "processor": "paystack" }
}
```

### PublicRentalRequestCreateRequest
```
PublicRentalRequestCreateRequest: {
  apartment_id: number, eg 1
  name: string, eg "Prospective Tenant"
  email: string, eg "lead@example.com"
  phone: string|null, eg "1234567890"
  message: string|null, eg "Interested in the unit"
}
```

### RentalRequestUpdateRequest
```
RentalRequestUpdateRequest: {
  status: string, eg "contacted"
}
```

### ConversationCreateRequest
```
ConversationCreateRequest: {
  building_id: number|null, eg 1
  apartment_id: number|null, eg 2
  participant_ids: array<number>, eg [10, 11]
}
```

### MessageCreateRequest
```
MessageCreateRequest: {
  body: string, eg "Hello there"
}
```

### MaintenanceRequestCreateRequest
```
MaintenanceRequestCreateRequest: {
  apartment_id: number, eg 1
  title: string, eg "Leaking pipe"
  description: string, eg "Pipe under sink is leaking."
}
```

### MaintenanceRequestUpdateRequest
```
MaintenanceRequestUpdateRequest: {
  status: string, eg "in_progress"
}
```

### ReviewCreateRequest
```
ReviewCreateRequest: {
  rating: number, eg 5
  comment: string, eg "Verified tenant review."
}
```

### MediaUploadRequest (multipart)
```
MediaUploadRequest: {
  file: binary, eg <image or video>
  collection: string, eg "images" | "videos" | "profile"
}
```
