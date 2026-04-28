// Centralized route and API endpoints for the Homelet frontend.

export const routes = {
  // Public routes
  root: '/',
  login: '/login',
  register: '/register',
  registerBuilding: '/register-building',
  buildingPublic: (id: string | number) => `/building/${id}`,
  apartmentPublic: (id: string | number) => `/apartment/${id}`,
  rentRequest: (apartmentId: string | number) => `/rent/request/${apartmentId}`,
  homeDashboard: '/dashboard',

  // Admin routes
  adminRoot: '/admin',
  adminBuildings: '/admin/buildings',
  adminBuildingRequests: '/admin/building-requests',
  adminBuildingRequestNew: '/admin/building-requests/new',
  adminBuildingRequest: (id: string | number) =>
    `/admin/building-requests/${id}`,
  adminBuilding: (id: string | number) => `/admin/buildings/${id}`,
  adminBuildingEdit: (id: string | number) => `/admin/buildings/${id}/edit`,
  adminBuildingTenants: (buildingId: string | number) =>
    `/admin/buildings/${buildingId}/tenants`,
  adminBuildingApartments: (buildingId: string | number) =>
    `/admin/buildings/${buildingId}/apartments`,
  adminBuildingApartmentsNew: (buildingId: string | number) =>
    `/admin/buildings/${buildingId}/apartments/new`,
  adminApartment: (id: string | number) => `/admin/apartments/${id}`,
  adminApartmentEdit: (id: string | number) => `/admin/apartments/${id}/edit`,
  adminTenants: '/admin/tenants',
  adminTenant: (id: string | number) => `/admin/tenants/${id}`,
  adminUsers: '/admin/users',
  adminPayments: '/admin/payments',
  adminExpenses: '/admin/expenses',
  adminMaintenance: '/admin/maintenance',
  adminMaintenanceRequest: (id: string | number) => `/admin/maintenance/${id}`,
  adminRentalRequests: '/admin/rental-requests',
  adminChat: '/admin/chat',

  // Tenant routes
  tenantRoot: '/tenant',
  tenantPayments: '/tenant/payments',
  tenantMaintenance: '/tenant/maintenance',
  tenantMaintenanceRequest: (id: string | number) =>
    `/tenant/maintenance/${id}`,
  tenantChat: '/tenant/chat',
};

export type DashboardRouteKey = 'admin' | 'tenant' | 'home';
export const authRedirectParam = 'redirect';

export const routeForDashboard = (dashboard?: DashboardRouteKey) => {
  switch (dashboard) {
    case 'tenant':
      return routes.tenantRoot;
    case 'home':
      return routes.homeDashboard;
    case 'admin':
    default:
      return routes.adminRoot;
  }
};

export const withRedirect = (baseRoute: string, redirectTo: string) => {
  const params = new URLSearchParams({
    [authRedirectParam]: redirectTo,
  });

  return `${baseRoute}?${params.toString()}`;
};

export const getRequestedRedirect = (search: string) => {
  const redirectTo = new URLSearchParams(search).get(authRedirectParam);

  if (!redirectTo || !redirectTo.startsWith('/')) {
    return null;
  }

  return redirectTo;
};

export const getRedirectTarget = (search: string, fallback: string) => {
  return getRequestedRedirect(search) ?? fallback;
};

export const routePaths = {
  // Router path patterns
  buildingPublic: 'building/:id',
  apartmentPublic: 'apartment/:id',
  rentRequest: 'rent/request/:id',
  homeDashboard: 'dashboard',
  login: 'login',
  register: 'register',
  registerBuilding: 'register-building',
  adminBuildings: 'buildings',
  adminBuildingRequests: 'building-requests',
  adminBuildingRequestNew: 'building-requests/new',
  adminBuildingRequest: 'building-requests/:id',
  adminBuilding: 'buildings/:id',
  adminBuildingEdit: 'buildings/:id/edit',
  adminBuildingTenants: 'buildings/:buildingId/tenants',
  adminBuildingApartments: 'buildings/:buildingId/apartments',
  adminBuildingApartmentsNew: 'buildings/:buildingId/apartments/new',
  adminApartment: 'apartments/:id',
  adminApartmentEdit: 'apartments/:id/edit',
  adminTenants: 'tenants',
  adminTenant: 'tenants/:id',
  adminUsers: 'users',
  adminPayments: 'payments',
  adminExpenses: 'expenses',
  adminMaintenance: 'maintenance',
  adminMaintenanceRequest: 'maintenance/:id',
  adminRentalRequests: 'rental-requests',
  adminChat: 'chat',
  tenantPayments: 'payments',
  tenantMaintenance: 'maintenance',
  tenantMaintenanceRequest: 'maintenance/:id',
  tenantChat: 'chat',
};

export const api = {
  // Public API
  publicApartments: '/public/apartments',
  publicApartment: (id: string | number) => `/public/apartments/${id}`,
  publicRentRequestApartment: (id: string | number) =>
    `/public/rent-request-apartments/${id}`,
  publicBuildings: '/public/buildings',
  publicBuilding: (id: string | number) => `/public/buildings/${id}`,
  publicBuildingsForSale: '/public/buildings-for-sale',
  publicRentalRequests: '/public/rental-requests',
  buildingRegistrationRequests: '/building-registration-requests',
  buildingRegistrationRequest: (id: string | number) =>
    `/building-registration-requests/${id}`,

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
  buildingTenants: (buildingId: string | number) =>
    `/buildings/${buildingId}/tenants`,
  buildingApartments: (buildingId: string | number) =>
    `/buildings/${buildingId}/apartments`,
  buildingManagers: (buildingId: string | number) =>
    `/buildings/${buildingId}/managers`,
  buildingManager: (buildingId: string | number, userId: string | number) =>
    `/buildings/${buildingId}/managers/${userId}`,
  buildingMedia: (id: string | number) => `/buildings/${id}/media`,
  buildingMediaItem: (id: string | number, mediaId: string | number) =>
    `/buildings/${id}/media/${mediaId}`,

  // Apartments API
  apartment: (id: string | number) => `/apartments/${id}`,
  apartmentAssignTenantLookup: (id: string | number) =>
    `/apartments/${id}/assign-tenant/lookup`,
  apartmentAssignTenant: (id: string | number) =>
    `/apartments/${id}/assign-tenant`,
  apartmentMedia: (id: string | number) => `/apartments/${id}/media`,
  apartmentMediaItem: (id: string | number, mediaId: string | number) =>
    `/apartments/${id}/media/${mediaId}`,
  apartmentReviews: (id: string | number) => `/apartments/${id}/reviews`,

  // Tenants & payments API
  tenants: '/tenants',
  tenant: (id: string | number) => `/tenants/${id}`,
  users: '/users',
  userImpersonate: (id: string | number) => `/users/${id}/impersonate`,
  leaseExtend: (id: string | number) => `/leases/${id}/extend`,
  leaseRenew: (id: string | number) => `/leases/${id}/renew`,
  payments: '/payments',
  expenses: '/expenses',
  buildingExpenseCategories: (id: string | number) =>
    `/buildings/${id}/expense-categories`,
  buildingExpenseCategory: (
    buildingId: string | number,
    categoryId: string | number,
  ) => `/buildings/${buildingId}/expense-categories/${categoryId}`,
  tenantPayments: '/tenant/payments',

  // Maintenance API
  maintenanceRequests: '/maintenance-requests',
  maintenanceRequest: (id: string | number) => `/maintenance-requests/${id}`,
  maintenanceRequestMedia: (id: string | number) =>
    `/maintenance-requests/${id}/media`,

  // Rental requests API
  rentalRequests: '/rental-requests',
  rentalRequest: (id: string | number) => `/rental-requests/${id}`,
  rentalRequestApprove: (id: string | number) =>
    `/rental-requests/${id}/approve`,
  rentalRequestReject: (id: string | number) => `/rental-requests/${id}/reject`,

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
