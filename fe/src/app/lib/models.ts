export interface UserProfile {
  id: number;
  name: string;
}

export interface Building {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  address_line1?: string;
  address_line2?: string;
  description?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  for_sale?: boolean;
  sale_price?: number;
  year_built?: number;
  units?: number;
  apartments_count?: number;
  occupied_count?: number;
  managers_count?: number;
  media?: Media[];
  managers?: BuildingManager[];
}

export interface BuildingSummary {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  for_sale?: boolean;
  sale_price?: number;
}

export interface BuildingRegistrationRequest {
  id: number;
  user_id?: number | null;
  building_id?: number | null;
  status: string;
  approved_by?: number | null;
  rejected_by?: number | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  country: string;
  description?: string | null;
  for_sale?: boolean;
  sale_price?: number | null;
}

export interface BuildingManager {
  id: number;
  name: string;
  email?: string;
}

export interface ApartmentSummary {
  id: number;
  unit_code?: string;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  yearly_price?: number;
  status?: string;
  tenant?: { name?: string };
}

export interface Apartment {
  id: number;
  unit_code?: string;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  square_feet?: number;
  yearly_price?: number;
  status?: string;
  is_public?: boolean;
  tenant?: { name?: string };
}

export interface ApartmentDetail {
  id: number;
  unit_code?: string;
  building?: {
    id?: number;
    name?: string;
    city?: string;
    state?: string;
    address_line1?: string;
    address_line2?: string;
  };
  building_id?: number;
  type?: string;
  yearly_price?: number;
  status?: string;
  is_public?: boolean;
  description?: string;
  amenities?: string[];
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  square_feet?: number;
  current_tenant?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
    lease_id?: number;
    lease_start?: string;
    lease_end?: string;
    lease_status?: string;
    rent_amount?: number;
  };
  tenant?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
    lease_id?: number;
    lease_start?: string;
    lease_end?: string;
    lease_status?: string;
    rent_amount?: number;
  };
}

export interface Lease {
  id: number;
  apartment_id: number;
  tenant_id: number;
  rent_amount?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  apartment?: {
    id?: number;
    unit_code?: string;
    building?: {
      id?: number;
      name?: string;
    };
  };
  tenant?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface Payment {
  id: number;
  amount: number;
  status: string;
  payment_date?: string;
  paid_at?: string;
  due_date?: string;
  method?: string;
  created_at?: string;
  tenant?: { name?: string };
  apartment?: { unit_code?: string };
}

export interface TenantBalanceSummary {
  total_lease_rent: number;
  total_paid: number;
  outstanding_balance: number;
}

export interface ExpenseCategory {
  id: number;
  building_id: number;
  name: string;
  color?: string | null;
  description?: string | null;
}

export interface Expense {
  id: number;
  building_id: number;
  expense_category_id?: number | null;
  recorded_by: number;
  title: string;
  vendor_name?: string | null;
  amount: number;
  expense_date: string;
  payment_method?: string | null;
  reference?: string | null;
  description?: string | null;
  notes?: string | null;
  building?: { id?: number; name?: string };
  category?: ExpenseCategory | null;
  recorder?: { id?: number; name?: string };
}

export interface MaintenanceRequest {
  id: number;
  title?: string;
  description?: string;
  status: string;
  priority?: string;
  created_at?: string;
  media?: Media[];
  apartment?: { id?: number; unit_code?: string; building?: { id?: number; name?: string } };
  tenant?: { id?: number; name?: string; email?: string | null; phone?: string | null };
}

export interface RentalRequest {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  message?: string;
  created_at?: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  apartment?: {
    id?: number;
    unit_code?: string;
    yearly_price?: number;
    building?: { id?: number; name?: string };
  };
  tenant?: { id?: number; name?: string; email?: string | null; phone?: string | null };
  lease?: { id?: number; start_date?: string; end_date?: string; status?: string };
}

export interface Conversation {
  id: number;
  building_id?: number | null;
  apartment_id?: number | null;
  title?: string;
  subtitle?: string;
  unread_count?: number;
  apartment?: {
    id?: number;
    unit_code?: string;
    building?: { id?: number; name?: string } | null;
  } | null;
  participants?: {
    id: number;
    name?: string;
    role?: string;
    is_current_user?: boolean;
  }[];
  counterpart?: {
    id?: number | null;
    name?: string;
    names?: string[];
    count?: number;
  };
  last_message?: {
    body?: string;
    created_at?: string;
    is_mine?: boolean;
    sender?: { id?: number; name?: string } | null;
  };
}

export interface Message {
  id: number;
  body: string;
  created_at?: string;
  read_at?: string | null;
  is_mine?: boolean;
  sender?: { id?: number; name?: string; role?: string } | null;
}

export interface Media {
  id: number;
  url: string;
}

export interface Review {
  id: number;
  rating: number;
  verified?: boolean;
  comment?: string;
  author?: string;
  created_at?: string;
}

export interface Tenant {
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
  current_lease?: {
    id: number;
    status: string;
    start_date?: string;
    end_date?: string;
    next_due_date?: string | null;
    days_remaining?: number | null;
    days_exceeded?: number | null;
    is_overdue?: boolean;
    rent_amount?: number;
    apartment?: {
      id?: number;
      unit_code?: string;
      building?: {
        id?: number;
        name?: string;
      } | null;
    } | null;
  } | null;
  active_lease?: {
    id: number;
    status: string;
    end_date?: string;
    rent_amount?: number;
  } | null;
}

export interface TenantDetail {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface PublicApartment {
  id: number;
  unit_code?: string;
  type?: string;
  yearly_price?: number;
  status?: string;
  description?: string;
  amenities?: string[];
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  square_feet?: number;
  media?: Media[];
  building?: {
    id?: number;
    name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    contact_email?: string | null;
    contact_phone?: string | null;
  };
  reviews?: Array<Review & { user?: { name?: string } }>;
}

export interface PublicBuilding {
  id: number;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  public_apartments_count?: number;
  apartments?: PublicApartment[];
  media?: Media[];
}

export interface PublicBuildingForSale {
  id: number;
  name: string;
  city?: string;
  state?: string;
  for_sale?: boolean;
  sale_price?: number;
  units?: number;
  apartments_count?: number;
  occupancy_rate?: number;
  media?: Media[];
}
