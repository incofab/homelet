// Centralized route and API endpoints for the Tenanta frontend.

export const routes = {
  // Public routes
  root: "/",
  login: "/login",
  register: "/register",
  registerBuilding: "/register-building",
  apartmentPublic: (id: string | number) => `/apartment/${id}`,

  // Admin routes
  adminRoot: "/admin",
  adminBuildings: "/admin/buildings",
  adminBuildingRequests: "/admin/building-requests",
  adminBuildingRequestNew: "/admin/building-requests/new",
  adminBuildingRequest: (id: string | number) => `/admin/building-requests/${id}`,
  adminBuilding: (id: string | number) => `/admin/buildings/${id}`,
  adminBuildingApartments: (buildingId: string | number) => `/admin/buildings/${buildingId}/apartments`,
  adminBuildingApartmentsNew: (buildingId: string | number) => `/admin/buildings/${buildingId}/apartments/new`,
  adminApartment: (id: string | number) => `/admin/apartments/${id}`,
  adminTenants: "/admin/tenants",
  adminPayments: "/admin/payments",
  adminMaintenance: "/admin/maintenance",
  adminRentalRequests: "/admin/rental-requests",
  adminChat: "/admin/chat",

  // Tenant routes
  tenantRoot: "/tenant",
  tenantPayments: "/tenant/payments",
  tenantMaintenance: "/tenant/maintenance",
  tenantChat: "/tenant/chat",
};

export const routePaths = {
  // Router path patterns
  apartmentPublic: "apartment/:id",
  login: "login",
  register: "register",
  registerBuilding: "register-building",
  adminBuildings: "buildings",
  adminBuildingRequests: "building-requests",
  adminBuildingRequestNew: "building-requests/new",
  adminBuildingRequest: "building-requests/:id",
  adminBuilding: "buildings/:id",
  adminBuildingApartments: "buildings/:buildingId/apartments",
  adminBuildingApartmentsNew: "buildings/:buildingId/apartments/new",
  adminApartment: "apartments/:id",
  adminTenants: "tenants",
  adminPayments: "payments",
  adminMaintenance: "maintenance",
  adminRentalRequests: "rental-requests",
  adminChat: "chat",
  tenantPayments: "payments",
  tenantMaintenance: "maintenance",
  tenantChat: "chat",
};

export const api = {
  // Public API
  publicApartments: "/public/apartments",
  publicBuildingsForSale: "/public/buildings-for-sale",
  publicRentalRequests: "/public/rental-requests",
  publicBuildingRegistrationRequests: "/public/building-registration-requests",
  buildingRegistrationRequests: "/building-registration-requests",

  // Auth API
  authLogin: "/auth/login",
  authRegister: "/auth/register",
  authLogout: "/auth/logout",
  authMe: "/auth/me",

  // Dashboard API
  dashboardAdmin: "/dashboard/admin",
  dashboardTenant: "/dashboard/tenant",

  // Buildings API
  buildings: "/buildings",
  building: (id: string | number) => `/buildings/${id}`,
  buildingApartments: (buildingId: string | number) => `/buildings/${buildingId}/apartments`,

  // Apartments API
  apartment: (id: string | number) => `/apartments/${id}`,
  apartmentMedia: (id: string | number) => `/apartments/${id}/media`,
  apartmentReviews: (id: string | number) => `/apartments/${id}/reviews`,

  // Tenants & payments API
  tenants: "/tenants",
  payments: "/payments",
  tenantPayments: "/tenant/payments",

  // Maintenance API
  maintenanceRequests: "/maintenance-requests",

  // Rental requests API
  rentalRequests: "/rental-requests",
  rentalRequest: (id: string | number) => `/rental-requests/${id}`,

  // Building registration admin API
  adminBuildingRegistrationRequests: "/admin/building-registration-requests",
  adminBuildingRegistrationRequest: (id: string | number) =>
    `/admin/building-registration-requests/${id}`,
  adminBuildingRegistrationApprove: (id: string | number) =>
    `/admin/building-registration-requests/${id}/approve`,
  adminBuildingRegistrationReject: (id: string | number) =>
    `/admin/building-registration-requests/${id}/reject`,

  // Messaging API
  conversations: "/conversations",
  conversationMessages: (id: string | number) => `/conversations/${id}/messages`,
  conversationRead: (id: string | number) => `/conversations/${id}/read`,
};
