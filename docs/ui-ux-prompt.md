# UI/UX Design Prompt — Tenanta

You are an expert product UI/UX designer. Create a modern, aesthetically pleasing, and scalable UI design system and screen set for a multi-tenant property management platform called **Tenanta (working title)**. The product serves **landlords/building admins**, **managers**, **tenants**, and **public visitors**. It is a **mobile-first** experience that must scale beautifully to tablet and desktop. The frontend will likely be built with **Flutter**, but the design should be platform-agnostic.

## Product Summary

A SaaS platform for managing buildings, apartments, leases, payments, maintenance, rental requests, and messaging.

Core capabilities:

- Landlords/Building Admins: create/manage buildings & apartments, assign managers, onboard tenants, track leases & payments, handle maintenance, handle rental requests, chat with tenants.
- Managers: perform admin tasks under assigned buildings.
- Tenants: view lease details, payment history, make online payments, request maintenance, chat.
- Public: browse available apartments, view details, submit rental interest.

## Information Architecture (Screens)

Design the following screen groups. Include responsive variants for mobile and desktop.

### Public (Unauthenticated)

- Landing / Public Listings
- Buildings For Sale (homepage section)
- Apartment Detail (public)
- Apartment Reviews (read-only)
- Rental Request Form
- Auth: Register, Login

### Admin / Manager

- Dashboard (metrics, expiring leases, pending payments)
- Buildings list
- Building detail (managers list + add/remove, reviews, media, set for sale)
- Create/Edit building
- Apartments list by building
- Apartment detail (media, reviews, lease summary)
- Create/Edit apartment
- Assign tenant flow (creates lease)
- Tenants list
- Lease detail/summary
- Payments list + record manual payment
- Maintenance requests list + update status
- Rental requests list + update status
- Chat: conversation list + message thread
- Profile/settings (avatar upload, logout)

### Tenant

- Dashboard (active lease info, days to expiry, payment summary)
- Payments history + make online payment
- Maintenance request create + upload media
- Chat: conversation list + thread
- Profile

## UX Guidance

- Prioritize clarity and speed for property managers; prioritize reassurance and transparency for tenants.
- Provide clear status badges (vacant/occupied/maintenance, lease status, payment status, request status).
- Include empty states, loading states, error states, and success confirmations.
- Use data-rich but scannable layouts: cards, tables, and summary widgets.
- Provide multi-step flows where needed (e.g., create building, add apartment, assign tenant).
- Make media upload flows obvious and safe with previews.

## Visual Direction

Aim for premium, calm, and trustworthy, with a clean real-estate feel.

- Mood: modern, reliable, calm, premium.
- Avoid overly playful or neon styles.
- Use a balanced palette with clear contrast.
- Support light mode as the primary design. Optional dark mode variants are welcome.

## Deliverables

Provide a complete design system and key screens:

1. **Design System**

- Color palette with semantic tokens (primary, secondary, surface, text, success, warning, danger, info)
- Typography scale (display, heading, body, caption)
- Spacing/size scale
- Icon style and size guidance
- Elevation/shadow rules
- Button styles (primary, secondary, ghost, destructive)
- Form components and validation states
- Table styles and empty states
- Status badges/chips
- Cards and data widgets
- Navigation patterns (mobile tab bar + desktop sidebar)

2. **Key Screen Designs**

- Provide the layouts for the listed screens (mobile + desktop for the most important flows: dashboard, buildings list, building detail, apartment detail, payments, maintenance, chat, public listing, apartment detail).

3. **Component Library**

- Cards, list items, modals, drawers, date pickers, file upload, pagination, search/filter, tags.

4. **Interaction Notes**

- Animations/transitions (subtle, meaningful)
- Empty/loading/error/success states
- Form validation behaviors

## Data & Content Hints

Include realistic content examples:

- Building: name, location, occupancy rate
- Apartment: unit code, type, price, status, amenities
- Tenant: name, lease dates, payment summary
- Payments: amount, date, status, method
- Maintenance: priority, status, timeline
- Rental requests: contact details, interest message

## Constraints

- Must be fully responsive across mobile and desktop.
- Ensure accessibility: readable contrast, legible typography, clear touch targets.
- Must support role-based navigation (admin/manager/tenant).

## Output Format

Deliver:

- A high-level style guide
- Screen-by-screen layouts
- Component definitions
- Interaction notes

Make the design visually distinctive and polished, while still pragmatic for a production SaaS product.
