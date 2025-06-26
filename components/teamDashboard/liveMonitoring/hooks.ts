import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { ZoneData, LocationWithZones } from './types';
import { DeviceData } from 'hooks/useZoneDevice';

/**
 * Hook to fetch device status summary
 */
export const useStatusSummary = (slug: string) => {
  return useSWR(`/api/teams/${slug}/status-summary`, fetcher);
};

/**
 * Hook to fetch team locations
 */
export const useTeamLocations = (teamSlug: string | undefined) => {
  return useSWR(
    () => (teamSlug ? `/api/teams/${teamSlug}/locations` : null),
    fetcher
  );
};

/**
 * Hook to fetch all team locations with their zones
 */
export const useAllLocationZones = (teamSlug: string | undefined) => {
  const {
    data: locationsResponse,
    error: locationsError,
    isLoading: locationsLoading,
  } = useTeamLocations(teamSlug);

  const {
    data: zonesResponse,
    error: zonesError,
    isLoading: zonesLoading,
  } = useSWR(() => {
    if (!teamSlug) return null;
    return `/api/teams/${teamSlug}/all-location-zones`;
  }, fetcher);

  // Extract location data for reference
  const locationsData = locationsResponse?.data || [];

  // Process zones data from the efficient API endpoint
  const allZones = zonesResponse?.data || [];

  // Group zones by location for compatibility with existing code
  const locationsWithZones = React.useMemo(() => {
    if (!allZones.length || !locationsData.length) return [];

    return locationsData.map((location) => ({
      locationId: location.id,
      locationName: location.name,
      zones: allZones.filter((zone) => zone.locationId === location.id),
    }));
  }, [allZones, locationsData]);

  return {
    locationsWithZones,
    allZones,
    isLoading: locationsLoading || zonesLoading,
    error: locationsError || zonesError,
  };
};

/**
 * Hook to fetch specific zone details with devices
 */
export const useZoneDetails = (
  teamSlug: string | undefined,
  zoneId: string | undefined
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Define a proper interface for zoneDetails to avoid 'never' type issues
  interface ZoneDetail {
    id: string;
    name: string;
    description?: string | null;
    locationId: string;
    createdAt: string;
    updatedAt: string;
    location?: any;
    devices?: DeviceData[];
  }
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail | null>(null);

  useEffect(() => {
    const fetchZoneDetails = async () => {
      if (!teamSlug || !zoneId) return;

      try {
        setIsLoading(true);

        // First, fetch all locations
        const locationsResponse = await fetch(
          `/api/teams/${teamSlug}/locations`
        );

        if (!locationsResponse.ok) {
          throw new Error('Failed to fetch locations');
        }

        const locationsData = await locationsResponse.json();
        const locations = locationsData.data || [];

        // Find which location contains our zone
        let foundLocationId: string | null = null;
        let zoneDetail: ZoneDetail | null = null;

        for (const location of locations) {
          const zonesResponse = await fetch(
            `/api/teams/${teamSlug}/locations/${location.id}/zones`
          );

          if (zonesResponse.ok) {
            const zonesData = await zonesResponse.json();
            // Explicitly type zones as an array of ZoneDetail
            const zones = (zonesData.data || []) as ZoneDetail[];

            const foundZone = zones.find((zone) => zone.id === zoneId);
            if (foundZone) {
              foundLocationId = location.id;

              // Get full zone details with devices
              const zoneResponse = await fetch(
                `/api/teams/${teamSlug}/locations/${location.id}/zones/${zoneId}`
              );

              if (zoneResponse.ok) {
                const zoneData = await zoneResponse.json();
                // Explicitly cast to ZoneDetail type
                zoneDetail = zoneData.data as ZoneDetail;

                // Now TypeScript knows zoneDetail is a ZoneDetail object with location and devices properties
                if (zoneDetail) {
                  // Get location details
                  const locationResponse = await fetch(
                    `/api/teams/${teamSlug}/locations/${location.id}`
                  );

                  if (locationResponse.ok) {
                    const locationData = await locationResponse.json();
                    zoneDetail.location = locationData.data;
                  }

                  // Get devices in zone
                  const devicesResponse = await fetch(
                    `/api/teams/${teamSlug}/locations/${location.id}/zones/${zoneId}/devices`
                  );

                  if (devicesResponse.ok) {
                    const devicesData = await devicesResponse.json();
                    zoneDetail.devices = devicesData.data || [];
                  }
                }
              }

              break;
            }
          }
        }

        if (!zoneDetail) {
          throw new Error('Zone not found');
        }

        setZoneDetails(zoneDetail);
        setError(null);
      } catch (err) {
        console.error('Error fetching zone details:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchZoneDetails();
  }, [teamSlug, zoneId]);



  return { zoneDetails, isLoading, error };
};

/**
 * Hook to update a zone
 */
export const useUpdateZone = (teamSlug: string, zoneId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateZone = async (
    data: { name: string; description?: string },
    locationId: string
  ) => {
    if (!teamSlug || !zoneId || !locationId) {
      throw new Error('Required parameters missing');
    }

    try {
      setIsUpdating(true);

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
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update zone');
      }

      const updatedData = await response.json();
      setError(null);
      return updatedData.data;
    } catch (err) {
      console.error('Error updating zone:', err);
      setError(err as Error);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateZone, isUpdating, error };
};

/**
 * Simplified hook to fetch devices with proper server-side pagination.
 * This hook fetches devices from a single zone (or all zones if needed)
 * with pagination support.
 */
export const useCamerasFiltered = (
  teamSlug: string | undefined,
  zones: ZoneData[],
  locationFilter: string,
  zoneFilter: string,
  page: number = 1,
  pageSize: number = 8
) => {
  const relevantZones = React.useMemo(() => {
    const safeZones = Array.isArray(zones) ? zones : [];
    return safeZones.filter(
      (zone) =>
        (locationFilter === 'All' ||
          (zone?.locationName && zone.locationName === locationFilter)) &&
        (zoneFilter === 'All' || (zone?.name && zone.name === zoneFilter))
    );
  }, [zones, locationFilter, zoneFilter]);

  // Determine if we need to use the single-zone endpoint or the all-devices endpoint
  const useSpecificZone = zoneFilter !== 'All' && locationFilter !== 'All';

  const zoneId = useSpecificZone
    ? relevantZones.find((z) => z.name === zoneFilter)?.id
    : null;

  const specificZoneResult = useSWR(
    () => {
      if (!teamSlug || !useSpecificZone || !zoneId) return null;
      // Updated API path to include locationId
      const targetLocationId = relevantZones.find(
        (z) => z.id === zoneId
      )?.locationId;
      if (!targetLocationId) return null;
      return `/api/teams/${teamSlug}/locations/${targetLocationId}/zones/${zoneId}/devices?page=${page}&pageSize=${pageSize}`;
    },
    async (url) => {
      try {
        const response = await fetcher(url);

        if (!response || !response.data) {
          console.error('Invalid response format from API:', response);
          return {
            data: [],
            meta: { totalCount: 0, currentPage: page, pageSize, totalPages: 0 },
          };
        }

        // Return the device data directly without mapping
        return {
          data: response.data,
          meta: response.meta || {
            totalCount: response.data.length,
            currentPage: page,
            pageSize,
            totalPages: Math.ceil(response.data.length / pageSize),
          },
        };
      } catch (error) {
        console.error('Error fetching zone data:', error);
        throw error;
      }
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const multiZoneResult = useSWR(
    () => {
      if (!teamSlug || useSpecificZone) return null;

      // Always use the all-devices endpoint for multi-zone or multi-location requests
      return `/api/teams/${teamSlug}/all-devices?page=${page}&pageSize=${pageSize}&location=${locationFilter}&zone=${zoneFilter}`;
    },
    async (url) => {
      try {
        const response = await fetcher(url);



        if (!response || !response.data) {
          console.error('Invalid response format from API:', response);
          return {
            data: [],
            meta: { totalCount: 0, currentPage: page, pageSize, totalPages: 0 },
          };
        }

        // Return the device data directly without mapping
        return {
          data: response.data,
          meta: response.meta || {
            totalCount: response.data.length,
            currentPage: page,
            pageSize,
            totalPages: Math.ceil(response.data.length / pageSize),
          },
        };
      } catch (error) {
        console.error('Error in multiZone fetching:', error);
        // Return empty data instead of throwing
        return {
          data: [],
          meta: {
            totalCount: 0,
            currentPage: page,
            pageSize,
            totalPages: 0,
          },
        };
      }
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      onError: (error) => {
        console.error('SWR error in multiZone fetching:', error);
      },
    }
  );

  // Use the appropriate result based on whether we need a specific zone or multi-zone
  const result = useSpecificZone ? specificZoneResult : multiZoneResult;

  // Check if data is fully loaded before transforming
  const isDataLoading = result.isLoading || !result.data;

  const transformedData = React.useMemo(() => {
    // Don't try to transform if data is not available yet
    if (isDataLoading) return undefined;
    if (result.data?.data && result.data?.meta) {
      // Just return the data directly without mapping
      return {
        data: result.data.data as DeviceData[],
        meta: result.data.meta,
      };
    }
    
    const devices = Array.isArray(result.data) ? result.data : [];
    
    return {
      data: devices as DeviceData[],
      meta: {
        totalCount: devices.length,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(devices.length / pageSize),
      },
    };
  }, [result.data, isDataLoading, page, pageSize]);
  

  return {
    data: transformedData,
    error: result.error,
    isLoading: isDataLoading,
    mutate: result.mutate,
  };
};
