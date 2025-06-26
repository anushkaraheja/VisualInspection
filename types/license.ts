export enum RenewalPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  ANNUALLY = 'ANNUALLY',
  BIANNUALLY = 'BIANNUALLY',
}

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface License {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  type: string; // Changed from LicenseType to string
  features: string[];
  maxUsers?: number | null;
  maxLocations?: number | null;
  status: LicenseStatus;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  renewalPeriod: RenewalPeriod;
  userLocationId?: string | null;
}

export interface PurchasedLicense {
  id: string;
  teamId: string;
  licenseId: string;
  purchasedAt: string | Date;
  expiresAt?: string | Date | null;
  metadata?: any | null;
  isActive: boolean;
  lastRenewalDate?: string | Date | null;
  nextRenewalDate?: string | Date | null;
  notes?: string | null;
  License: License;
  userLicense?: UserLicense[];
  locationLicense?: LocationLicense[]; // Add this new field
}

export interface UserLicense {
  id: string;
  userId: string;
  assignedAt: string | Date;
  expiresAt?: string | Date | null;
  purchasedLicenseId: string;
}

// Add this new interface
export interface LocationLicense {
  id: string;
  locationId: string;
  assignedAt: string | Date;
  expiresAt?: string | Date | null;
  isActive: boolean;
  purchasedLicenseId: string;
}

export interface CreateLicenseData {
  name: string;
  description?: string;
  price: number;
  type: string; // Changed from LicenseType to string
  features?: string[];
  maxUsers?: number;
  maxLocations?: number;
  renewalPeriod: RenewalPeriod;
  metadata?: any;
}

export interface UpdateLicenseData {
  name?: string;
  description?: string;
  price?: number;
  type?: string; // Changed from LicenseType to string
  features?: string[];
  maxUsers?: number;
  maxLocations?: number;
  status?: LicenseStatus;
  renewalPeriod?: RenewalPeriod;
  metadata?: any;
}

export interface PurchaseLicenseData {
  licenseId: string;
  quantity: number;
  metadata?: any;
}
