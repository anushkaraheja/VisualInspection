import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DeviceData } from './useZoneDevice';



interface DeviceResponse {
  success: boolean;
  device: DeviceData;
  tenantType: string;
}

// Hook to fetch a device by ID
export const useDevice = (teamSlug: string, deviceId: string | null) => {
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantType, setTenantType] = useState<string | null>(null);

  const fetchDevice = useCallback(async () => {
    if (!teamSlug || !deviceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // The API will handle conditional fetching of PPE items based on tenant type
      const response = await axios.get<DeviceResponse>(`/api/teams/${teamSlug}/devices/${deviceId}`);
      
      // Store the device data and tenant type from the response
      setDevice(response.data.device);
      setTenantType(response.data.tenantType);
    } catch (err) {
      console.error('Error fetching device:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch device');
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug, deviceId]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  return {
    device,
    isLoading,
    error,
    refetch: fetchDevice,
    tenantType, // Return tenant type to client components
    isPPE: tenantType === 'PPE' // Helper flag for components
  };
};

// Hook to fetch all devices for a team
export const useDevices = (teamSlug: string) => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantType, setTenantType] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!teamSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Endpoint would be implemented to return all devices with tenant type info
      const response = await axios.get<{
        success: boolean;
        devices: DeviceData[];
        tenantType: string;
      }>(`/api/teams/${teamSlug}/devices`);
      
      setDevices(response.data.devices);
      setTenantType(response.data.tenantType);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    error,
    refetch: fetchDevices,
    tenantType,
    isPPE: tenantType === 'PPE'
  };
};
