import type { Building, BuildingRegistrationRequest, Tenant, UserProfile } from "./models";

export interface AuthResponse {
  token: string;
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
}

export interface BuildingRegistrationRequestResponse {
  request: BuildingRegistrationRequest;
}

export interface BuildingRegistrationApproveResponse {
  request: BuildingRegistrationRequest;
  building?: Building;
  owner?: UserProfile & { email?: string };
}

export interface AdminDashboardResponse {
  counts: {
    buildings: number;
    apartments: number;
    vacant: number;
    occupied: number;
  };
  expiring_leases_next_90_days: number;
  total_income_paid: number;
  pending_payments: number;
}

export interface TenantDashboardResponse {
  active_lease?: {
    id: number;
    status: string;
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
  active_lease?: Tenant["active_lease"];
}
