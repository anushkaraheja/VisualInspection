import fetcher from '@/lib/fetcher';
import type {
  Location,
  UserLocation,
  User,
  Animal,
  TeamMember,
  Vendor,
  LocationVendor
} from '@prisma/client';
import useSWR, { mutate } from 'swr';
import type { ApiResponse } from 'types';
import { defaultHeaders } from '@/lib/common';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Zone } from '../services/zoneService';

export type UserLocationWithDetails = UserLocation & { User: User };

export type UserWithUserLocations = User & { UserLocation: UserLocation[] } & {
  TeamMember: TeamMember;
};

export type LocationVendorWithVendors = LocationVendor & {
  vendor: Vendor;
};

export type LocationWithAnimalsAndZonesAndVendors = Location & {
  Animal: Animal[];
  Zone: Zone[];
  locationVendors: LocationVendorWithVendors[];
};

const useLocations = (teamSlug: string) => {
  const url = `/api/teams/${teamSlug}/locations`;

  const { data, error } = useSWR<ApiResponse<LocationWithAnimalsAndZonesAndVendors[]>>(
    url,
    fetcher
  );

  const mutateLocations = async () => {
    mutate(url);
  };

  return {
    locations: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateLocations,
  };
};

// **NOT IN USE**
export const useUserLocations = (teamSlug: string, locationId: string) => {
  const url = `/api/teams/${teamSlug}/locations/${locationId}/users`;

  const { data, error } = useSWR<ApiResponse<UserLocationWithDetails[]>>(
    url,
    fetcher
  );

  const mutateUserLocations = async () => {
    mutate(url);
  };

  return {
    userLocations: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateUserLocations,
  };
};

export const useLocationDetails = (teamSlug: string, locationId: string) => {
  const url = `/api/teams/${teamSlug}/locations/${locationId}`;

  const { data, error } = useSWR<ApiResponse<LocationWithAnimalsAndZonesAndVendors>>(
    url,
    fetcher
  );

  const mutateLocationDetails = async () => {
    mutate(url);
  };

  return {
    locationDetails: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateLocationDetails,
  };
};

export const useLocationUsers = (teamSlug: string, locationId: string) => {
  const url = `/api/teams/${teamSlug}/locations/${locationId}/users`;

  const { data, error } = useSWR<ApiResponse<UserWithUserLocations[]>>(
    url,
    fetcher
  );

  const mutateLocationUsers = async () => {
    mutate(url);
  };

  return {
    locationUsers: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateLocationUsers,
  };
};

// Interface for location data
interface LocationData {
  locationName: string;
  address1: string;
  address2?: string;
  zip: string;
  state: string;
  city: string;
  phoneNumber: string;
  email?: string;
  bullsActive: number;
  bullsInactive: number;
  cowsActive: number;
  cowsInactive: number;
  calvesActive: number;
  calvesInactive: number;
  zones?: Zone[];
}

// Hook for creating a new location
export const useCreateLocation = (teamSlug: string) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLocation = async (data: LocationData) => {
    setIsCreating(true);
    setError(null);

    try {
      const {
        locationName,
        address1,
        address2,
        zip,
        state,
        city,
        phoneNumber,
        email,
        bullsActive,
        bullsInactive,
        cowsActive,
        cowsInactive,
        calvesActive,
        calvesInactive,
        zones = [],
      } = data;

      const response = await fetch(`/api/teams/${teamSlug}/locations`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: locationName,
          addressL1: address1,
          addressL2: address2,
          zip,
          state,
          city,
          phone: phoneNumber,
          email,
          animals: [
            {
              name: 'Bulls',
              icon: 'bull',
              activeAnimal: bullsActive || 0,
              inactiveAnimal: bullsInactive || 0,
            },
            {
              name: 'Cows',
              icon: 'cow',
              activeAnimal: cowsActive || 0,
              inactiveAnimal: cowsInactive || 0,
            },
            {
              name: 'Calves',
              icon: 'calf',
              activeAnimal: calvesActive || 0,
              inactiveAnimal: calvesInactive || 0,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }

      const newLocation = await response.json();

      if (zones.length > 0) {
        for (const zone of zones) {
          await fetch(
            `/api/teams/${teamSlug}/locations/${newLocation.id}/zones`,
            {
              method: 'POST',
              headers: {
                ...defaultHeaders,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: zone.name,
                description: zone.description || '',
              }),
            }
          );
        }
      }

      toast.success('Location created successfully');
      return newLocation;
    } catch (err: any) {
      setError(err);
      toast.error(`Failed to create location: ${err.message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createLocation, isCreating, error };
};

// Hook for updating an existing location
export const useUpdateLocation = (teamSlug: string, locationId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateLocation = async (data: LocationData) => {
    setIsUpdating(true);
    setError(null);

    try {
      const {
        locationName,
        address1,
        address2,
        zip,
        state,
        city,
        phoneNumber,
        email,
        bullsActive,
        bullsInactive,
        cowsActive,
        cowsInactive,
        calvesActive,
        calvesInactive,
        zones = [],
      } = data;

      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}`,
        {
          method: 'PUT',
          headers: {
            ...defaultHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: locationName,
            addressL1: address1,
            addressL2: address2,
            zip,
            state,
            city,
            phone: phoneNumber,
            email,
            animals: [
              {
                name: 'Bulls',
                icon: 'bull',
                activeAnimal: bullsActive || 0,
                inactiveAnimal: bullsInactive || 0,
              },
              {
                name: 'Cows',
                icon: 'cow',
                activeAnimal: cowsActive || 0,
                inactiveAnimal: cowsInactive || 0,
              },
              {
                name: 'Calves',
                icon: 'calf',
                activeAnimal: calvesActive || 0,
                inactiveAnimal: calvesInactive || 0,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      const updatedLocation = await response.json();

      if (zones.length > 0) {
        const zonesResponse = await fetch(
          `/api/teams/${teamSlug}/locations/${locationId}/zones`,
          {
            headers: defaultHeaders,
          }
        );

        let existingZones: Zone[] = [];
        if (zonesResponse.ok) {
          existingZones = await zonesResponse.json();
        }

        for (const zone of zones) {
          if (zone.id && !zone.id.startsWith('temp-')) {
            await fetch(
              `/api/teams/${teamSlug}/locations/${locationId}/zones/${zone.id}`,
              {
                method: 'PUT',
                headers: {
                  ...defaultHeaders,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: zone.name,
                  description: zone.description || '',
                }),
              }
            );
          } else if (!existingZones.some((ez) => ez.name === zone.name)) {
            await fetch(
              `/api/teams/${teamSlug}/locations/${locationId}/zones`,
              {
                method: 'POST',
                headers: {
                  ...defaultHeaders,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: zone.name,
                  description: zone.description || '',
                }),
              }
            );
          }
        }
      }

      toast.success('Location updated successfully');
      return updatedLocation;
    } catch (err: any) {
      setError(err);
      toast.error(`Failed to update location: ${err.message}`);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateLocation, isUpdating, error };
};

// Hook for managing users in a location
export const useLocationUserManagement = (
  teamSlug: string,
  locationId: string
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Assign a single user to a location
  const assignUser = async (userId: string, isActive: boolean = true) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/users`,
        {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({
            userId,
            teamSlug,
            locationId,
            isChecked: isActive,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to assign user');
      }

      toast.success('User assigned successfully');
      return await response.json();
    } catch (err: any) {
      setError(err);
      toast.error(`Failed to assign user: ${err.message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Assign multiple users to a location
  const assignMultipleUsers = async (userIds: string[]) => {
    setIsProcessing(true);
    setError(null);
    const results: any[] = [];

    try {
      for (const userId of userIds) {
        const response = await assignUser(userId);
        if (response) {
          results.push(response);
        }
      }
      return results;
    } catch (err: any) {
      setError(err);
      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle user status in a location
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/teams/${teamSlug}/locations/${locationId}/users`,
        {
          method: 'PUT',
          headers: defaultHeaders,
          body: JSON.stringify({
            userId,
            teamSlug,
            locationId,
            isChecked: isActive,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to update user status'
        );
      }

      toast.success('User status updated successfully');
      return await response.json();
    } catch (err: any) {
      setError(err);
      toast.error(`Failed to update user status: ${err.message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    assignUser,
    assignMultipleUsers,
    toggleUserStatus,
    isProcessing,
    error,
  };
};

export default useLocations;
