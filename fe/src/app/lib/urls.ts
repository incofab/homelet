// Centralized route and API endpoints for the Tenanta frontend.

export const routes = {
  // Public routes
  root: '/',
  login: '/login',
  register: '/register',
  registerBuilding: '/register-building',
  buildingPublic: (id: string | number) => `/building/${id}`,
  apartmentPublic: (id: string | number) => `/apartment/${id}`,
  homeDashboard: '/dashboard',

  // Admin routes
  adminRoot: '/admin',
  adminBuildings: '/admin/buildings',
  adminBuildingRequests: '/admin/building-requests',
  adminBuildingRequestNew: '/admin/building-requests/new',
  adminBuildingRequest: (id: string | number) =>
    `/admin/building-requests/${id}`,
  adminBuilding: (id: string | number) => `/admin/buildings/${id}`,
  adminBuildingApartments: (buildingId: string | number) =>
    `/admin/buildings/${buildingId}/apartments`,
  adminBuildingApartmentsNew: (buildingId: string | number) =>
    `/admin/buildings/${buildingId}/apartments/new`,
  adminApartment: (id: string | number) => `/admin/apartments/${id}`,
  adminApartmentEdit: (id: string | number) => `/admin/apartments/${id}/edit`,
  adminTenants: '/admin/tenants',
  adminUsers: '/admin/users',
  adminPayments: '/admin/payments',
  adminMaintenance: '/admin/maintenance',
  adminRentalRequests: '/admin/rental-requests',
  adminChat: '/admin/chat',

  // Tenant routes
  tenantRoot: '/tenant',
  tenantPayments: '/tenant/payments',
  tenantMaintenance: '/tenant/maintenance',
  tenantChat: '/tenant/chat',
};

export type DashboardRouteKey = "admin" | "tenant" | "home";

export const routeForDashboard = (dashboard?: DashboardRouteKey) => {
  switch (dashboard) {
    case "tenant":
      return routes.tenantRoot;
    case "home":
      return routes.homeDashboard;
    case "admin":
    default:
      return routes.adminRoot;
  }
};

export const routePaths = {
  // Router path patterns
  buildingPublic: 'building/:id',
  apartmentPublic: 'apartment/:id',
  homeDashboard: 'dashboard',
  login: 'login',
  register: 'register',
  registerBuilding: 'register-building',
  adminBuildings: 'buildings',
  adminBuildingRequests: 'building-requests',
  adminBuildingRequestNew: 'building-requests/new',
  adminBuildingRequest: 'building-requests/:id',
  adminBuilding: 'buildings/:id',
  adminBuildingApartments: 'buildings/:buildingId/apartments',
  adminBuildingApartmentsNew: 'buildings/:buildingId/apartments/new',
  adminApartment: 'apartments/:id',
  adminApartmentEdit: 'apartments/:id/edit',
  adminTenants: 'tenants',
  adminUsers: 'users',
  adminPayments: 'payments',
  adminMaintenance: 'maintenance',
  adminRentalRequests: 'rental-requests',
  adminChat: 'chat',
  tenantPayments: 'payments',
  tenantMaintenance: 'maintenance',
  tenantChat: 'chat',
};

export const api = {
  // Public API
  publicApartments: '/public/apartments',
  publicApartment: (id: string | number) => `/public/apartments/${id}`,
  publicBuildings: '/public/buildings',
  publicBuilding: (id: string | number) => `/public/buildings/${id}`,
  publicBuildingsForSale: '/public/buildings-for-sale',
  publicRentalRequests: '/public/rental-requests',
  publicBuildingRegistrationRequests: '/public/building-registration-requests',
  buildingRegistrationRequests: '/building-registration-requests',

  // Auth API
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authLogout: '/auth/logout',
  authMe: '/auth/me',

  // Dashboard API
  dashboardAdmin: '/dashboard/admin',
  dashboardTenant: '/dashboard/tenant',

  // Buildings API
  buildings: '/buildings',
  building: (id: string | number) => `/buildings/${id}`,
  buildingApartments: (buildingId: string | number) =>
    `/buildings/${buildingId}/apartments`,

  // Apartments API
  apartment: (id: string | number) => `/apartments/${id}`,
  apartmentAssignTenantLookup: (id: string | number) =>
    `/apartments/${id}/assign-tenant/lookup`,
  apartmentAssignTenant: (id: string | number) =>
    `/apartments/${id}/assign-tenant`,
  apartmentMedia: (id: string | number) => `/apartments/${id}/media`,
  apartmentReviews: (id: string | number) => `/apartments/${id}/reviews`,

  // Tenants & payments API
  tenants: '/tenants',
  users: '/users',
  userImpersonate: (id: string | number) => `/users/${id}/impersonate`,
  payments: '/payments',
  tenantPayments: '/tenant/payments',

  // Maintenance API
  maintenanceRequests: '/maintenance-requests',

  // Rental requests API
  rentalRequests: '/rental-requests',
  rentalRequest: (id: string | number) => `/rental-requests/${id}`,

  // Building registration admin API
  adminBuildingRegistrationRequests: '/admin/building-registration-requests',
  adminBuildingRegistrationRequest: (id: string | number) =>
    `/admin/building-registration-requests/${id}`,
  adminBuildingRegistrationApprove: (id: string | number) =>
    `/admin/building-registration-requests/${id}/approve`,
  adminBuildingRegistrationReject: (id: string | number) =>
    `/admin/building-registration-requests/${id}/reject`,

  // Messaging API
  conversations: '/conversations',
  conversationMessages: (id: string | number) =>
    `/conversations/${id}/messages`,
  conversationRead: (id: string | number) => `/conversations/${id}/read`,
};
