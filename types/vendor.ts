export interface Vendor {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  active: boolean;
  notes?: string;
  createdAt: string;
  livestockItems?: {
    livestockId: string;
    name: string;
    icon?: string;
  }[];
  locations?: {
    locationId: string;
    name: string;
  }[];
}
