import { useState, useEffect, useCallback, useRef } from 'react';
import { DetectionStatus } from '@prisma/client';
import useTeam from './useTeam';

interface LivestockDetection {
  id: string;
  timestamp: string;
  type: string;
  count: number;
  manualCount?: number;
  averageConfidence: number;
  status: DetectionStatus;
  filterRunTimeMs: number;
  createdAt: string;
  updatedAt: string;
  vendor: string;
  vendorId: string;
  deviceName: string;
  deviceId: string;
  zoneName: string;
  zoneId: string;
  locationName: string;
  locationId: string;
  filterId: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface LivestockCountFilters {
  status?: DetectionStatus;
  type?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  zoneId?: string;
  deviceId?: string;
  page?: number;
  limit?: number;
}

interface LivestockCountResult {
  isLoading: boolean;
  error: string | null;
  data: LivestockDetection[];
  pagination: Pagination | null;
  fetchData: (filters?: LivestockCountFilters) => Promise<void>;
  updateDetection: (id: string, status: DetectionStatus, manualCount?: number) => Promise<boolean>;
}

export function useLivestockCount(initialFilters?: LivestockCountFilters): LivestockCountResult {
  const { team } = useTeam();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LivestockDetection[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Use refs to track fetch state and prevent duplicate requests
  const initialFetchPerformed = useRef(false);
  const fetchInProgress = useRef(false);
  const lastRequestKey = useRef<string>('');
  
  console.debug("[useLivestockCount] Hook initialized with team slug:", team?.slug);

  // Create a stable version of the buildQueryParams function
  const buildQueryParams = useCallback((filters?: LivestockCountFilters): URLSearchParams => {
    const params = new URLSearchParams();
    
    if (!filters) return params;
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.locationId) params.append('locationId', filters.locationId);
    if (filters.zoneId) params.append('zoneId', filters.zoneId);
    if (filters.deviceId) params.append('deviceId', filters.deviceId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    return params;
  }, []);

  // Generate a unique key for the request to detect duplicates
  const getRequestKey = useCallback((filters?: LivestockCountFilters): string => {
    if (!filters) return '';
    
    // Create a sorted string representation of the filters
    return Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }, []);

  const fetchData = useCallback(async (filters?: LivestockCountFilters) => {
    // Always ensure default limit is 25 if not specified
    const filtersWithDefaults = {
      ...filters,
      page: filters?.page || 1,
      limit: filters?.limit || 25
    };
    
    // Don't fetch if no team, fetch already in progress, or this exact request is a duplicate
    const requestKey = getRequestKey(filtersWithDefaults);
    if (!team?.slug || fetchInProgress.current || requestKey === lastRequestKey.current) {
      console.debug("[useLivestockCount] Skipping fetch", { 
        hasTeam: !!team?.slug, 
        fetchInProgress: fetchInProgress.current,
        isDuplicate: requestKey === lastRequestKey.current,
        requestKey,
        lastRequestKey: lastRequestKey.current
      });
      return;
    }
    
    console.debug("[useLivestockCount] Starting fetch with pagination", { 
      page: filtersWithDefaults.page, 
      limit: filtersWithDefaults.limit 
    });
    
    fetchInProgress.current = true;
    lastRequestKey.current = requestKey;
    setIsLoading(true);
    setError(null);
    
    try {
      const params = buildQueryParams(filtersWithDefaults);
      const url = `/api/teams/${team.slug}/livestock-count?${params.toString()}`;
      
      const response = await fetch(url);
      
      console.debug("[useLivestockCount] Fetch response", { 
        status: response.status, 
        ok: response.ok 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch livestock count data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setPagination(result.pagination || null);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      const errMessage = err.message || 'An error occurred while fetching data';
      console.error('[useLivestockCount] Error fetching data:', errMessage, err);
      setError(errMessage);
      setData([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [team?.slug, buildQueryParams, getRequestKey]);

  const updateDetection = useCallback(async (
    id: string, 
    status: DetectionStatus, 
    manualCount?: number
  ): Promise<boolean> => {
    if (!team?.slug) return false;
    
    try {
      const updateData: any = { id, status };
      
      if (status === DetectionStatus.MODIFIED && manualCount !== undefined) {
        updateData.manualCount = manualCount;
      }
      
      const response = await fetch(`/api/teams/${team.slug}/livestock-count`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update livestock detection');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the local data to reflect the change
        setData(prevData => 
          prevData.map(item => 
            item.id === id 
              ? { ...item, status, ...(manualCount !== undefined ? { manualCount } : {}) }
              : item
          )
        );
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to update data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating data');
      console.error('Error updating livestock detection:', err);
      return false;
    }
  }, [team?.slug]);

  // Initial data fetch with proper defaults
  useEffect(() => {
    if (team?.slug && !initialFetchPerformed.current) {
      console.debug("[useLivestockCount] Performing initial fetch with pagination");
      initialFetchPerformed.current = true;
      
      // Always use 25 as default limit if not specified
      const stableFilters = {
        ...initialFilters,
        page: initialFilters?.page || 1,
        limit: initialFilters?.limit || 25
      };
      
      fetchData(stableFilters);
    }
  }, [team?.slug, fetchData, initialFilters]);

  return {
    isLoading,
    error,
    data,
    pagination,
    fetchData,
    updateDetection
  };
}
