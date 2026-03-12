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
    name?: string;
    email?: string;
    phone?: string;
    lease_start?: string;
    lease_end?: string;
    lease_status?: string;
  };
  tenant?: {
    name?: string;
    email?: string;
    phone?: string;
    lease_start?: string;
    lease_end?: string;
    lease_status?: string;
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

export interface MaintenanceRequest {
  id: number;
  title?: string;
  description?: string;
  status: string;
  priority?: string;
  created_at?: string;
  apartment?: { unit_code?: string; building?: { name?: string } };
  tenant?: { name?: string };
}

export interface RentalRequest {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  message?: string;
  created_at?: string;
  apartment?: { unit_code?: string; building?: { name?: string } };
}

export interface Conversation {
  id: number;
  unread_count?: number;
  apartment?: { unit_code?: string; building?: { name?: string } };
  participants?: { id: number; name?: string; role?: string }[];
  last_message?: { body?: string; created_at?: string };
}

export interface Message {
  id: number;
  body: string;
  created_at?: string;
  sender?: { id?: number; name?: string; role?: string };
  sender_role?: string;
  sender_type?: string;
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
  email: string;
  phone?: string;
  active_lease?: {
    id: number;
    status: string;
    end_date?: string;
  };
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
