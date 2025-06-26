import { useState } from 'react';
import toast from 'react-hot-toast';
import { DeviceStatus, DeviceType } from '@prisma/client';

interface Location {
  id: string;
  name: string;
  teamId: string;
  createdAt: string; // Or Date if you plan to parse it immediately
  updatedAt: string; // Or Date
  addressL1: string;
  addressL2: string;
  city: string;
  email: string;
  phone: string;
  state: string;
  zip: string;
}

interface Zone {
  id: string;
  name: string;
  description: string;
  locationId: string;
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  location: Location;
}

interface DeviceConfig {
  fps: number;
  apiKey: string;
  rtspUrl: string;
  password: string;
  username: string;
  resolution: string;
  apiEndpoint: string;
  webSocketUrl: string;
  authenticated: boolean;
  connectionType: string; // You could use a literal type e.g., 'http' | 'rtsp' if known
}

export interface DeviceData {
  id: string;
  name: string;
  deviceType: DeviceType;
  serialNumber: string;
  model: string;
  manufacturer: string;
  ipAddress: string;
  macAddress: string;
  firmwareVersion: string;
  status: DeviceStatus;
  zoneId: string;
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  lastPing: string; // Or Date
  config: DeviceConfig;
  zone?: Zone; // Optional zone property
  location?: Location; // Added optional location property
  ppeItems?: string[]; // Optional array of strings for PPE item IDs
}

interface UseZoneDeviceProps {
  teamSlug: string;
  locationId: string;
}

export const useZoneDevice = ({ teamSlug, locationId }: UseZoneDeviceProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new device in a zone
   */
  const createDevice = async (zoneId: string, deviceData: DeviceData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}/devices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deviceData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create device');
      }

      const result = await response.json();
      toast.success('Device created successfully');
      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing device
   */
  const updateDevice = async (
    zoneId: string,
    deviceId: string,
    deviceData: DeviceData
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}/devices/${deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deviceData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update device');
      }

      const result = await response.json();
      toast.success('Device updated successfully');
      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a specific device by ID
   */
  const getDevice = async (
    zoneId: string,
    deviceId: string
  ): Promise<DeviceData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}/devices/${deviceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch device');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching device:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a device
   */
  const deleteDevice = async (zoneId: string, deviceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/zones/${zoneId}/devices/${deviceId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete device');
      }

      toast.success('Device deleted successfully');
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createDevice,
    updateDevice,
    getDevice,
    deleteDevice,
  };
};

export default useZoneDevice;
