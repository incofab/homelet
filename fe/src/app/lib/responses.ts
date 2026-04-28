import type {
  Building,
  BuildingRegistrationRequest,
  Lease,
  MaintenanceRequest,
  Payment,
  RentalRequest,
  Tenant,
  UserProfile,
} from './models';

export interface DashboardContext {
  primary_dashboard: 'admin' | 'tenant' | 'home';
  is_platform_admin: boolean;
  is_building_user: boolean;
  has_active_lease: boolean;
  available_dashboards: Array<'admin' | 'tenant' | 'home'>;
}

export interface AuthResponse {
  token: string;
  dashboard?: 'admin' | 'tenant' | 'home';
  dashboard_context?: DashboardContext;
  impersonation?: {
    impersonator?: {
      id: number;
      name: string;
    };
    impersonated_user?: {
      id: number;
      name: string;
    };
  };
  user: UserProfile & { email?: string; role?: string };
}

export interface CreateBuildingResponse {
  building: {
    id: number;
    name: string;
  };
}

export interface CreateApartmentResponse {
  apartment: {
    id: number;
    unit_code?: string;
  };
  apartments?: Array<{
    id: number;
    unit_code?: string;
  }>;
  created_count?: number;
}

export interface BuildingRegistrationRequestResponse {
  request: BuildingRegistrationRequest;
  admin_contacts?: PlatformAdminContacts;
}

export interface PlatformAdminContacts {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  support_hours?: string | null;
}

export interface BuildingRegistrationApproveResponse {
  request: BuildingRegistrationRequest;
  building?: Building;
  owner?: UserProfile & { email?: string };
}

export interface RentalRequestWorkflowResponse {
  rental_request: RentalRequest;
  tenant?: UserProfile & { email?: string | null; phone?: string | null };
  lease?: Lease;
  payment?: Payment | null;
}

export interface MaintenanceRequestResponse {
  maintenance_request: MaintenanceRequest;
}

export interface AdminDashboardResponse {
  counts: {
    buildings: number;
    apartments: number;
    vacant: number;
    occupied: number;
    tenants: number;
  };
  expiring_leases_next_90_days: number;
  total_income_paid: number;
  pending_payments: number;
  overdue_payments: number;
  maintenance_requests: number;
}

export interface TenantDashboardResponse {
  active_lease?: {
    id: number;
    status: string;
    rent_amount?: number;
    apartment_id?: number;
    start_date?: string;
    end_date?: string;
    apartment?: { unit_code?: string; building?: { name?: string } };
    apartment_unit?: string;
    building_name?: string;
  };
  days_to_expiry?: number;
  last_payment?: {
    id: number;
    status: string;
    payment_date?: string;
    amount?: number;
  };
  payment_summary?: {
    paid: number;
    pending: number;
    failed: number;
  };
}

export interface TenantListItem {
  tenant: Tenant;
  active_lease?: Tenant['active_lease'];
}
