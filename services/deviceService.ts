import fetcher from '@/lib/fetcher';

export interface DeviceConnection {
  connectionType: string;
  rtspUrl?: string;
  fps?: number;
  resolution?: string;
  authenticated?: boolean;
  username?: string;
  password?: string;
  streamOptions?: {
    main?: string;
    sub?: string;
  };
}

export interface Device {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  ipAddress?: string;
  macAddress?: string;
  model?: string;
  manufacturer?: string;
  config?: DeviceConnection | null;
  zone: {
    name: string;
    location: {
      name: string;
    };
  };
  lastPing?: string;
}

export interface DeviceStatusSummary {
  cameras: {
    total: number;
    online: number;
    offline: number;
  };
  zones: number;
}

export const getDevicesByZone = async (zoneId: string): Promise<Device[]> => {
  try {
    return await fetcher(`/api/zones/${zoneId}/devices`);
  } catch (error) {
    console.error(`Error fetching devices for zone ${zoneId}:`, error);
    return [];
  }
};

export const getDeviceStatusSummary =
  async (): Promise<DeviceStatusSummary> => {
    try {
      return await fetcher('/api/devices/status-summary');
    } catch (error) {
      console.error('Error fetching device status summary:', error);
      return {
        cameras: { total: 0, online: 0, offline: 0 },
        zones: 0,
      };
    }
  };
