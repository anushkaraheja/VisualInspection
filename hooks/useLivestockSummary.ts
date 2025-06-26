import { useState, useEffect, useCallback, useRef } from 'react';
import useTeam from './useTeam';

interface TypeDistribution {
  type: string;
  count: number;
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
}

interface SummaryData {
  totalRecords: number;
  totalAnimals: number;
  avgConfidence: number;
  statusCounts: StatusCounts;
  typeDistribution: TypeDistribution[];
  typeCount: number;
}

interface SummaryFilters {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  zoneId?: string;
  deviceId?: string;
}

interface LivestockSummaryResult {
  isLoading: boolean;
  error: string | null;
  data: SummaryData | null;
  fetchSummary: (filters?: SummaryFilters) => Promise<void>;
}

export function useLivestockSummary(initialFilters?: SummaryFilters): LivestockSummaryResult {
  const { team } = useTeam();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryData | null>(null);
  
  // Use refs to track fetch state
  const initialFetchPerformed = useRef(false);
  const fetchInProgress = useRef(false);
  
  // Build query params for API request
  const buildQueryParams = useCallback((filters?: SummaryFilters): URLSearchParams => {
    const params = new URLSearchParams();
    
    if (!filters) return params;
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.locationId) params.append('locationId', filters.locationId);
    if (filters.zoneId) params.append('zoneId', filters.zoneId);
    if (filters.deviceId) params.append('deviceId', filters.deviceId);
    
    return params;
  }, []);

  // Fetch summary data
  const fetchSummary = useCallback(async (filters?: SummaryFilters) => {
    if (!team?.slug || fetchInProgress.current) {
      return;
    }
    
    console.debug("[useLivestockSummary] Starting fetch");
    fetchInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const params = buildQueryParams(filters);
      const url = `/api/teams/${team.slug}/livestock-summary?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch livestock summary data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || null);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch summary data');
      }
    } catch (err: any) {
      const errMessage = err.message || 'An error occurred while fetching summary data';
      console.error('[useLivestockSummary] Error fetching data:', errMessage, err);
      setError(errMessage);
      setData(null);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [team?.slug, buildQueryParams]);

  // Initial data fetch
  useEffect(() => {
    if (team?.slug && !initialFetchPerformed.current) {
      console.debug("[useLivestockSummary] Performing initial fetch");
      initialFetchPerformed.current = true;
      fetchSummary(initialFilters);
    }
  }, [team?.slug, fetchSummary, initialFilters]);

  return {
    isLoading,
    error,
    data,
    fetchSummary
  };
}
