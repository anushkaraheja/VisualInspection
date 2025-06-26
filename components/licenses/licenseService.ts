import {
  CreateLicenseData,
  License,
  UpdateLicenseData,
  PurchaseLicenseData,
} from 'types/license';

// Fetch licenses for a team
export const fetchLicenses = async (teamSlug: string): Promise<License[]> => {
  const response = await fetch(`/api/teams/${teamSlug}/licenses`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error fetching licenses');
  }

  const data = await response.json();
  return data.data;
};

// Create a new license
export const createLicense = async (
  teamSlug: string,
  data: CreateLicenseData
): Promise<License> => {
  const response = await fetch(`/api/teams/${teamSlug}/licenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error creating license');
  }

  return response.json();
};

// Get a license by ID
export const getLicense = async (
  teamSlug: string,
  id: string
): Promise<License> => {
  const response = await fetch(`/api/teams/${teamSlug}/licenses/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error fetching license');
  }

  const data = await response.json();
  return data.data;
};

// Update a license
export const updateLicense = async (
  teamSlug: string,
  id: string,
  data: UpdateLicenseData
): Promise<License> => {
  const response = await fetch(`/api/teams/${teamSlug}/licenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error updating license');
  }

  return response.json();
};

// Delete a license
export const deleteLicense = async (
  teamSlug: string,
  id: string
): Promise<void> => {
  const response = await fetch(`/api/teams/${teamSlug}/licenses/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error deleting license');
  }

  return response.json();
};

// Purchase a license
export const purchaseLicense = async (
  teamSlug: string,
  data: PurchaseLicenseData
): Promise<any> => {
  if (!data || !data.licenseId) {
    throw new Error('Invalid license data: licenseId is required');
  }

  const payload = {
    licenseId: data.licenseId,
    quantity: data.quantity || 1,
    // Ensure we don't send null or undefined
    metadata: data.metadata || {},
  };

  const response = await fetch(`/api/teams/${teamSlug}/purchasedLicenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error purchasing license');
  }

  return response.json();
};
