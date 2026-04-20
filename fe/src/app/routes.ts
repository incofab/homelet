import { createBrowserRouter } from 'react-router';
import { AppShell } from './layouts/AppShell';
import { Root } from './layouts/Root';
import { AdminLayout } from './layouts/AdminLayout';
import { TenantLayout } from './layouts/TenantLayout';
import { routePaths, routes } from './lib/urls';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { BuildingDetailPublic } from './pages/public/BuildingDetailPublic';
import { ApartmentDetailPublic } from './pages/public/ApartmentDetailPublic';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { RegisterBuildingPublic } from './pages/public/RegisterBuildingPublic';
import { RentRequestPublic } from './pages/public/RentRequestPublic';
import { HomeDashboard } from './pages/user/HomeDashboard';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BuildingsList } from './pages/admin/BuildingsList';
import { BuildingDetail } from './pages/admin/BuildingDetail';
import { EditBuilding } from './pages/admin/EditBuilding';
import { RegisterBuildingRequest } from './pages/admin/RegisterBuildingRequest';
import { ApartmentsList } from './pages/admin/ApartmentsList';
import { ApartmentDetail } from './pages/admin/ApartmentDetail';
import { CreateApartment } from './pages/admin/CreateApartment';
import { EditApartment } from './pages/admin/EditApartment';
import { TenantsList } from './pages/admin/TenantsList';
import { TenantDetail } from './pages/admin/TenantDetail';
import { UsersList } from './pages/admin/UsersList';
import { PaymentsList } from './pages/admin/PaymentsList';
import { ExpensesList } from './pages/admin/ExpensesList';
import { MaintenanceList } from './pages/admin/MaintenanceList';
import { MaintenanceRequestDetail } from './pages/admin/MaintenanceRequestDetail';
import { RentalRequestsList } from './pages/admin/RentalRequestsList';
import { BuildingRegistrationRequestsList } from './pages/admin/BuildingRegistrationRequestsList';
import { BuildingRegistrationRequestDetail } from './pages/admin/BuildingRegistrationRequestDetail';
import { ChatAdmin } from './pages/admin/ChatAdmin';

// Tenant pages
import { TenantDashboard } from './pages/tenant/TenantDashboard';
import { TenantPayments } from './pages/tenant/TenantPayments';
import { TenantMaintenance } from './pages/tenant/TenantMaintenance';
import { TenantMaintenanceRequestDetail } from './pages/tenant/TenantMaintenanceRequestDetail';
import { ChatTenant } from './pages/tenant/ChatTenant';

export const router = createBrowserRouter([
  {
    Component: AppShell,
    children: [
      {
        path: routes.root,
        Component: Root,
        children: [
          { index: true, Component: LandingPage },
          { path: routePaths.buildingPublic, Component: BuildingDetailPublic },
          {
            path: routePaths.apartmentPublic,
            Component: ApartmentDetailPublic,
          },
          { path: routePaths.rentRequest, Component: RentRequestPublic },
          { path: routePaths.homeDashboard, Component: HomeDashboard },
          { path: routePaths.login, Component: LoginPage },
          { path: routePaths.register, Component: RegisterPage },
          {
            path: routePaths.registerBuilding,
            Component: RegisterBuildingPublic,
          },
        ],
      },
      {
        path: routes.adminRoot,
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: routePaths.adminBuildings, Component: BuildingsList },
          { path: 'buildings/new', Component: RegisterBuildingRequest },
          {
            path: routePaths.adminBuildingRequestNew,
            Component: RegisterBuildingRequest,
          },
          {
            path: routePaths.adminBuildingRequests,
            Component: BuildingRegistrationRequestsList,
          },
          {
            path: routePaths.adminBuildingRequest,
            Component: BuildingRegistrationRequestDetail,
          },
          { path: routePaths.adminBuilding, Component: BuildingDetail },
          { path: routePaths.adminBuildingEdit, Component: EditBuilding },
          { path: routePaths.adminBuildingTenants, Component: TenantsList },
          {
            path: routePaths.adminBuildingApartments,
            Component: ApartmentsList,
          },
          {
            path: routePaths.adminBuildingApartmentsNew,
            Component: CreateApartment,
          },
          { path: routePaths.adminApartment, Component: ApartmentDetail },
          { path: routePaths.adminApartmentEdit, Component: EditApartment },
          { path: routePaths.adminTenants, Component: TenantsList },
          { path: routePaths.adminTenant, Component: TenantDetail },
          { path: routePaths.adminUsers, Component: UsersList },
          { path: routePaths.adminPayments, Component: PaymentsList },
          { path: routePaths.adminExpenses, Component: ExpensesList },
          { path: routePaths.adminMaintenance, Component: MaintenanceList },
          {
            path: routePaths.adminMaintenanceRequest,
            Component: MaintenanceRequestDetail,
          },
          {
            path: routePaths.adminRentalRequests,
            Component: RentalRequestsList,
          },
          { path: routePaths.adminChat, Component: ChatAdmin },
        ],
      },
      {
        path: routes.tenantRoot,
        Component: TenantLayout,
        children: [
          { index: true, Component: TenantDashboard },
          { path: routePaths.tenantPayments, Component: TenantPayments },
          { path: routePaths.tenantMaintenance, Component: TenantMaintenance },
          {
            path: routePaths.tenantMaintenanceRequest,
            Component: TenantMaintenanceRequestDetail,
          },
          { path: routePaths.tenantChat, Component: ChatTenant },
        ],
      },
    ],
  },
]);
