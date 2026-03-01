# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Product Name: RentPilot (Working Title)

Backend: Laravel (API-Only)
Architecture: RESTful API + Role-Based Access Control
Auth: Laravel Sanctum (Token-Based)
Database: MySQL

---

# 1. PRODUCT OVERVIEW

## 1.1 Purpose

Build a multi-tenant SaaS backend system where:

- A user (landlord/building owner) can:
  - Register
  - Log in
  - Create buildings
  - Add apartments/units
  - Assign managers
  - Add tenants
  - Track payments
  - Receive system reminders

- Tenants:
  - Log in
  - View lease details
  - View payment history
  - Make payments
  - Receive reminders
  - Chat with landlord/manager

- Public users:
  - View available apartments
  - Submit rental interest request

---

# 2. CORE USER ROLES

### 2.1 Roles (RBAC Required)

1. **Super Admin** (System level – optional future)
2. **Building Admin (Landlord)** – owner of building
3. **Manager** – assigned by admin
4. **Tenant**
5. **Public Visitor (Unauthenticated)**

Use Role-Permission system.

---

# 3. SYSTEM ARCHITECTURE REQUIREMENTS

- Laravel 10+
- API only (no blade)
- RESTful
- Sanctum authentication
- Policies for authorization
- Events & Queues for email reminders
- Scheduled jobs (Laravel Scheduler)
- Use service layer pattern

---

# 4. CORE MODULES

---

# 5. AUTHENTICATION MODULE

### 5.1 Endpoints

POST /api/register
POST /api/login
POST /api/logout
GET /api/me

### 5.2 Fields

Users Table:

- id
- name
- email (unique)
- phone (optional)
- password
- role (enum: admin, manager, tenant)
- email_verified_at
- created_at
- updated_at

---

# 6. BUILDING MANAGEMENT MODULE

## 6.1 A Building Can Have:

- name
- address
- city
- state
- country
- description
- total_apartments (auto calculated)
- owner_id (FK → users.id)

## 6.2 Endpoints

POST /api/buildings
GET /api/buildings
GET /api/buildings/{id}
PUT /api/buildings/{id}
DELETE /api/buildings/{id}

Authorization:

- Only Admin (owner) can create
- Admin & assigned managers can update
- Only owner can delete

---

# 7. APARTMENT / UNIT MODULE

## 7.1 Apartment Types (Enum)

- one_room
- self_contain
- one_bedroom
- two_bedroom
- three_bedroom
- custom

## 7.2 Apartment Fields

- id
- building_id (FK)
- name/number (e.g. A1, Flat 3B)
- type (enum)
- yearly_price
- description
- size (optional)
- floor
- status (enum):
  - vacant
  - occupied
  - maintenance

- is_public (boolean)
- created_at
- updated_at

## 7.3 Endpoints

POST /api/buildings/{id}/apartments
GET /api/buildings/{id}/apartments
PUT /api/apartments/{id}
DELETE /api/apartments/{id}
GET /api/public/apartments (Only vacant + is_public=true)

---

# 8. TENANT MANAGEMENT MODULE

## 8.1 Tenant Profile

Tenants are users with role=tenant.

## 8.2 Tenant-Apartment Relationship

Create leases table:

leases:

- id
- apartment_id
- tenant_id
- rent_amount
- start_date
- end_date
- status (active, expired, terminated)
- created_at
- updated_at

## 8.3 Endpoints

POST /api/apartments/{id}/assign-tenant
GET /api/tenants
GET /api/tenants/{id}
GET /api/tenant/dashboard

When tenant assigned:

- Apartment status automatically becomes occupied
- Lease created automatically

---

# 9. PAYMENT MODULE

## 9.1 Payments Table

- id
- lease_id
- tenant_id
- amount
- payment_method (enum: manual, online)
- transaction_reference (nullable)
- payment_date
- status (pending, paid, failed)
- created_at

## 9.2 Tenant Can:

- View payment history
- Make payment (API only, integration ready)

## 9.3 Endpoints

POST /api/payments
GET /api/payments
GET /api/tenant/payments

---

# 10. AUTOMATED EMAIL REMINDER SYSTEM

## 10.1 Requirement

- Every tenant pays yearly
- Send reminder 3 months before lease end_date

## 10.2 Implementation

- Laravel Scheduler runs daily
- Query leases where:
  end_date - 90 days = today
  status = active
- Dispatch email job

Use:

- Mailables
- Queued Jobs

Email content:

- Tenant name
- Apartment name
- Expiry date
- Renewal instructions

---

# 11. VACANCY & PUBLIC LISTING MODULE

## 11.1 Public Apartment Listing

Public route:
GET /api/public/apartments

Filter:

- status = vacant
- is_public = true

## 11.2 Apartment Public Data

- Building name
- Address
- Apartment type
- Yearly price
- Description
- Images (future support)

## 11.3 Rental Request

POST /api/public/request-interest

Fields:

- name
- email
- phone
- apartment_id
- message

Store in rental_requests table.

---

# 12. ROLE MANAGEMENT MODULE

## 12.1 Admin Can:

- Add manager
- Remove manager
- Assign manager to building

building_user pivot table:

- building_id
- user_id
- role (admin, manager)

---

# 13. CHAT MODULE

## 13.1 Requirements

Real-time not mandatory (API first).

Tables:

conversations:

- id
- building_id (nullable)
- apartment_id (nullable)

messages:

- id
- conversation_id
- sender_id
- message
- read_at
- created_at

## 13.2 Rules

- Tenant ↔ Admin/Manager
- Admin ↔ Manager
- Tenant cannot chat with other tenants

Endpoints:
POST /api/messages
GET /api/conversations
GET /api/conversations/{id}/messages

Future ready for WebSocket.

---

# 14. DASHBOARD METRICS

Admin Dashboard API:

Return:

- Total buildings
- Total apartments
- Vacant apartments
- Occupied apartments
- Expiring leases (next 3 months)
- Total income (sum payments)
- Pending payments

---

# 15. ADDITIONAL FEATURES (RECOMMENDED)

## 15.1 Maintenance Requests

tenants can:
POST /api/maintenance-requests

Fields:

- apartment_id
- title
- description
- status (open, in_progress, resolved)

## 15.2 Notification Table

notifications:

- id
- user_id
- type
- message
- read_at

---

# 16. BUSINESS RULES

1. Only one active lease per apartment
2. Lease must auto-expire
3. Payment must belong to active lease
4. Apartment cannot be deleted if occupied
5. Only owner can delete building

---

# 17. SECURITY REQUIREMENTS

- All endpoints protected by Sanctum
- Policies required
- Rate limit public routes
- Input validation via Form Requests
- Use UUID optional

---

# 18. DATABASE RELATIONSHIPS SUMMARY

User

- hasMany Buildings
- hasMany Leases (if tenant)
- hasMany Messages

Building

- belongsTo User (owner)
- hasMany Apartments
- belongsToMany Users (managers)

Apartment

- belongsTo Building
- hasOne Active Lease

Lease

- belongsTo Apartment
- belongsTo Tenant

Payment

- belongsTo Lease

---

# 19. FUTURE SCALABILITY

- Multi-currency support
- SMS reminders
- Online payment gateway
- File uploads (lease agreement)
- Analytics reports
- Subscription billing (SaaS model)

---

# 20. SUCCESS METRICS

- Tenant reminder emails sent correctly
- Admin can manage apartments easily
- Vacancy listing publicly accessible
- Tenants can see payment history clearly

---

# 21. ASSUMPTIONS MADE

- One tenant per apartment at a time
- Yearly rent only
- Email reminders only
- No escrow
- Payment gateway not implemented yet

---

# 22. MVP PRIORITY ORDER

1. Auth
2. Building
3. Apartment
4. Lease
5. Payment
6. Email reminder
7. Public vacancy listing
8. Chat
9. Maintenance
