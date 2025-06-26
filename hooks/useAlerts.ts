import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

// Status interface for dynamic team statuses
export interface ComplianceStatusInfo {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  isDefault?: boolean;
}

export interface Alert {
  id: string;
  workerId: string;
  timestamp: Date;
  zone: string;
  location: string;
  violations: string[];
  severity: 'NOT_SET' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: ComplianceStatusInfo; // Status will be guaranteed from server now
  comments?: { 
    text: string;
    timestamp: string; 
    user: string;
    statusFrom?: string;
    statusTo: string;
  }[];
}

// Fix ViolationStats interface to work with numeric operations
export interface ViolationStats {
  [key: string]: number | Record<string, number> | any;
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  limit: number;
  offset: number;
  stats: ViolationStats;
}

interface AllAlertsResponse {
  alerts: Alert[];
  total: number;
  limit: number;
  offset: number;
  stats: ViolationStats;
  zones: { 
    id: string; 
    name: string;
    locationId?: string;
    locationName?: string;
  }[];
  statuses: ComplianceStatusInfo[];
  severities: string[];
}

interface AllAlertsFilters {
  startDate?: Date;
  endDate?: Date;
  zone?: string;
  status?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch alerts for a team
 * @param teamSlug The team slug to fetch alerts for
 * @param limit Number of alerts to fetch
 * @param offset Pagination offset
 */
export function useAlerts(
  teamSlug: string | undefined,
  limit: number = 10,
  offset: number = 0
) {
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    teamSlug
      ? `/api/teams/${teamSlug}/alerts?limit=${limit}&offset=${offset}`
      : null,
    fetcher,
    { refreshInterval: 30000 } // refresh every 30 seconds
  );

  return {
    alerts: data?.alerts || [],
    stats: data?.stats || {},
    total: data?.total || 0,
    limit: data?.limit || limit,
    offset: data?.offset || offset,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all alerts for a team with optional filtering
 * @param teamSlug The team slug to fetch alerts for
 * @param filters Optional filters for the alerts
 */
export function useAllAlerts(teamSlug: string | undefined, filters: AllAlertsFilters = {}) {
  const { 
    startDate, 
    endDate, 
    zone, 
    status, 
    severity,
    limit = 25,
    offset = 0
  } = filters;

  // Build query string
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', String(limit));
  if (offset) queryParams.append('offset', String(offset));
  if (startDate) queryParams.append('startDate', startDate.toISOString());
  if (endDate) queryParams.append('endDate', endDate.toISOString());
  if (zone) queryParams.append('zone', zone);
  if (status) queryParams.append('status', status);
  if (severity) queryParams.append('severity', severity);

  const queryString = queryParams.toString();
  const url = teamSlug ? `/api/teams/${teamSlug}/alerts/all-alerts${queryString ? `?${queryString}` : ''}` : null;

  const { data, error, isLoading, mutate } = useSWR<AllAlertsResponse>(url, fetcher, {
    refreshInterval: 30000 // refresh every 30 seconds
  });

  return {
    alerts: data?.alerts || [],
    stats: data?.stats || {},
    total: data?.total || 0,
    limit: data?.limit || limit,
    offset: data?.offset || offset,
    zones: data?.zones || [],
    statuses: data?.statuses || [],
    severities: data?.severities || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to resolve an alert
 * @param teamSlug The team slug to resolve an alert for
 */
export function useResolveAlert(teamSlug: string | undefined) {
  const resolveAlert = async (alertId: string) => {
    if (!teamSlug) {
      console.error('Cannot resolve alert without team slug');
      return false;
    }

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/alerts/${alertId}/resolve`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error resolving alert:', error);
        return false;
      }


      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  };

  return resolveAlert;
}

/**
 * Hook to fetch team compliance statuses
 * @param teamSlug The team slug to fetch compliance statuses for
 */
export function useTeamComplianceStatuses(teamSlug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    statuses: ComplianceStatusInfo[];
  }>(
    teamSlug ? `/api/teams/${teamSlug}/compliance-statuses` : null,
    fetcher
  );

  return {
    statuses: data?.statuses || [],
    isLoading,
    error,
    mutate,
  };
}
