import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { useEffect } from 'react';

export interface SystemStatus {
  device: {
    status: 'connected' | 'optimal';
    cameras: number;
    latency: number;
  };
  accessControl: {
    status: 'connected' | 'optimal';
    entryPoints: number;
  };
  workforce: {
    status: 'connected' | 'optimal';
    workers: number;
  };
  database: {
    status: 'connected' | 'optimal';
    lastSync: string;
  };
  aiEngine: {
    status: 'connected' | 'optimal';
    fps: number;
    accuracy: number;
  };
}

/**
 * Hook to fetch system status for a team
 * @param teamSlug The team slug to fetch system status for
 */
export function useSystemStatus(teamSlug: string | undefined) {
  const { data, error, isLoading } = useSWR<SystemStatus>(
    teamSlug ? `/api/teams/${teamSlug}/system-status` : null,
    fetcher,
    { refreshInterval: 60000 } // refresh every minute
  );


  return {
    data,
    isLoading,
    error,
  };
}
