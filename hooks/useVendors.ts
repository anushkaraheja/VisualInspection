import { useState, useEffect } from 'react';
import { defaultHeaders } from '@/lib/common';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';

// Define TypeScript interfaces for data structures
export interface VendorAddress {
    zip: string;
    city: string;
    state: string;
    addressLine1: string;
    addressLine2?: string;
}

export interface LocationDetail {
    id: string;
    name: string;
    addressL1: string;
    addressL2?: string;
    city: string;
    state: string;
    zip: string;
    email?: string;
    phone: string;
    teamId: string;
    createdAt: string;
    updatedAt: string;
}

export interface LocationData {
    id: string;
    locationId: string;
    vendorId: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    location: LocationDetail;
}

export interface LivestockDetail {
    id: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LivestockItem {
    id: string;
    vendorId: string;
    livestockId: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    livestock: LivestockDetail;
}

export interface VendorDetails {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: VendorAddress;
    active: boolean;
    notes?: string;
    createdAt: string;
    locations: LocationData[];
    livestockItems: LivestockItem[];
}

export interface VendorFormData {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: {
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        zip: string;
    };
    notes: string;
    active: boolean;
}

export interface UseVendorDetailsResult {
    isLoading: boolean;
    error: Error | null;
    vendorDetails: VendorDetails | null;
}

/**
 * Hook for fetching all vendors for a team
 */
export const useVendors = (teamSlug: string) => {
    const url = `/api/teams/${teamSlug}/vendors`;
    
    const { data, error, mutate } = useSWR<ApiResponse<VendorDetails[]>>(
        teamSlug ? url : null,
        fetcher
    );
    
    return {
        vendors: data?.data || [],
        isLoading: !error && !data,
        isError: error,
        mutateVendors: mutate
    };
};

/**
 * Hook for fetching vendor details
 */
export const useVendorDetails = (teamSlug: string, vendorId: string): UseVendorDetailsResult => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);

    useEffect(() => {
        const fetchVendorDetails = async (): Promise<void> => {
            if (!teamSlug || !vendorId) return;
            
            try {
                setIsLoading(true);
                const response = await fetch(`/api/teams/${teamSlug}/vendors/${vendorId}`, {
                    method: 'GET',
                    headers: defaultHeaders,
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch vendor details');
                }
                
                const data = await response.json();
                setVendorDetails(data);
            } catch (err: any) {
                console.error('Error fetching vendor details:', err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (teamSlug && vendorId) {
            fetchVendorDetails();
        }
    }, [teamSlug, vendorId]);

    return { isLoading, error, vendorDetails };
};

/**
 * Hook for fetching team's active livestock items
 */
export const useTeamLivestock = (teamSlug: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [livestockItems, setLivestockItems] = useState<any[]>([]);

    const fetchTeamLivestock = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/teams/${teamSlug}/livestock-items`);
            if (!response.ok) {
                throw new Error('Failed to fetch team livestock items');
            }

            const data = await response.json();
            setLivestockItems(data.data);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (teamSlug) {
            fetchTeamLivestock();
        }
    }, [teamSlug]);

    return { livestockItems, isLoading, error, refetch: fetchTeamLivestock };
};

/**
 * Hook for creating a vendor
 */
export const useCreateVendor = (teamSlug: string) => {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createVendor = async (vendorData: any) => {
        setIsCreating(true);
        setError(null);
        try {
            const response = await fetch(`/api/teams/${teamSlug}/vendors`, {
                method: 'POST',
                headers: defaultHeaders,
                body: JSON.stringify(vendorData),
            });

            if (!response.ok) {
                throw new Error('Failed to create vendor');
            }

            return await response.json();
        } catch (err: any) {
            setError(err);
            return null;
        } finally {
            setIsCreating(false);
        }
    };

    return { createVendor, isCreating, error };
};

/**
 * Hook for updating a vendor
 */
export const useUpdateVendor = (teamSlug: string, vendorId: string) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateVendor = async (vendorData: any) => {
        setIsUpdating(true);
        setError(null);
        try {
            const response = await fetch(`/api/teams/${teamSlug}/vendors/${vendorId}`, {
                method: 'PUT',
                headers: defaultHeaders,
                body: JSON.stringify(vendorData),
            });

            if (!response.ok) {
                throw new Error('Failed to update vendor');
            }

            return await response.json();
        } catch (err: any) {
            setError(err);
            return null;
        } finally {
            setIsUpdating(false);
        }
    };

    return { updateVendor, isUpdating, error };
};

/**
 * Hook for deleting a vendor
 */
export const useDeleteVendor = (teamSlug: string) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteVendor = async (vendorId: string) => {
        setIsDeleting(true);
        setError(null);
        try {
            const response = await fetch(`/api/teams/${teamSlug}/vendors/${vendorId}`, {
                method: 'DELETE',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                throw new Error('Failed to delete vendor');
            }

            return true;
        } catch (err: any) {
            setError(err);
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    return { deleteVendor, isDeleting, error };
};

export default useVendors;
