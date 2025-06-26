import fetcher from '@/lib/fetcher';
import { DeviceData } from 'hooks/useZoneDevice';

// Update the Zone interface to match the Prisma schema
export interface Zone {
  id: string;
  name: string;
  description?: string | null;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  devices?: DeviceData[];
}

export const getDevicesByZone = async (
  teamSlug: string,
  zoneId: string
): Promise<DeviceData[]> => {
  try {
    // You might need to create a dedicated endpoint for this
    // For now, we'll assume we're using a direct zone/devices endpoint
    const response = await fetcher(
      `/api/teams/${teamSlug}/zones/${zoneId}/devices`
    );
    return response?.data || [];
  } catch (error) {
    console.error(`Error fetching devices for zone ${zoneId}:`, error);
    return [];
  }
};

export const getZonesByLocation = async (
  teamSlug: string,
  locationId: string
): Promise<Zone[]> => {
  try {
    const response = await fetcher(
      `/api/teams/${teamSlug}/locations/${locationId}/zones`
    );
    return response?.data || [];
  } catch (error) {
    console.error(`Error fetching zones for location ${locationId}:`, error);
    return [];
  }
};

export const createZone = async (
  teamSlug: string,
  locationId: string,
  data: { name: string; description?: string }
): Promise<Zone | null> => {
  try {
    const response = await fetch(
      `/api/teams/${teamSlug}/locations/${locationId}/zones`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create zone');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating zone:', error);
    return null;
  }
};

export const updateZone = async (
  teamSlug: string,
  locationId: string,
  zoneId: string,
  data: { name?: string; description?: string }
): Promise<Zone | null> => {
  try {
    const response = await fetch(
      `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update zone');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating zone:', error);
    return null;
  }
};

export const deleteZone = async (
  teamSlug: string,
  locationId: string,
  zoneId: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}`,
      {
        method: 'DELETE',
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting zone:', error);
    return false;
  }
};
