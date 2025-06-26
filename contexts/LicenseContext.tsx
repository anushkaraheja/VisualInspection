import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { License, PurchasedLicense } from 'types/license';
import { useLicenses } from 'hooks/useLicenses';
import { usePurchasedLicenses } from 'hooks/usePurchasedLicenses';

interface LicenseContextType {
  licenses: License[];
  purchasedLicenses: PurchasedLicense[] | undefined;
  groupedLicenses: Record<string, LicenseGroup> | undefined;
  isLoading: boolean;
  error: Error | null;
  refreshLicenses: () => void;
  fetchLicenseDetails: (licenseId: string) => Promise<PurchasedLicense | null>;
  calculateUsagePercentage: (used: number, total: number) => number;
  getUsageColor: (percentage: number) => string;
}

// Type for grouped license data
export interface LicenseGroup {
  license: License;
  count: number;
  purchases: PurchasedLicense[];
  usedCount: number;
  locationAssignedCount: number;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{
  teamSlug: string;
  children: React.ReactNode;
}> = ({ teamSlug, children }) => {
  const [error, setError] = useState<Error | null>(null);

  // Fetch licenses and purchased licenses
  const {
    licenses,
    isLoading: isLicensesLoading,
    mutate: mutateLicenses,
  } = useLicenses(teamSlug);
  const {
    purchasedLicenses,
    isLoading: isPurchasedLoading,
    mutate: mutatePurchased,
  } = usePurchasedLicenses(teamSlug);

  // Group purchased licenses by license ID for efficient access
  const groupedLicenses = React.useMemo(() => {
    if (!purchasedLicenses) return undefined;

    return purchasedLicenses.reduce(
      (acc, current) => {
        const licenseId = current.License.id;
        if (!acc[licenseId]) {
          acc[licenseId] = {
            license: current.License,
            count: 1,
            purchases: [current],
            usedCount: current.userLicense?.length || 0,
            locationAssignedCount: current.locationLicense?.length || 0,
          };
        } else {
          acc[licenseId].count++;
          acc[licenseId].purchases.push(current);
          acc[licenseId].usedCount += current.userLicense?.length || 0;
          acc[licenseId].locationAssignedCount +=
            current.locationLicense?.length || 0;
        }
        return acc;
      },
      {} as Record<string, LicenseGroup>
    );
  }, [purchasedLicenses]);

  // Function to refresh both licenses and purchased licenses
  const refreshLicenses = useCallback(() => {
    mutateLicenses();
    mutatePurchased();
  }, [mutateLicenses, mutatePurchased]);

  // Function to fetch detailed license data for a specific license
  const fetchLicenseDetails = useCallback(
    async (licenseId: string): Promise<PurchasedLicense | null> => {
      try {
        const response = await fetch(
          `/api/teams/${teamSlug}/licenses/${licenseId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch license details');
        }
        const data = await response.json();
        return data.data;
      } catch (err: any) {
        setError(err);
        console.error('Error fetching license details:', err);
        return null;
      }
    },
    [teamSlug]
  );

  // Helper function to calculate usage percentage
  const calculateUsagePercentage = (used: number, total: number): number => {
    if (total === 0) return 0;
    if (used === 0) return 0; // Show 0% when no licenses are used
    return Math.min(Math.round((used / total) * 100), 100);
  };

  // Helper function to get color based on usage percentage
  const getUsageColor = (percentage: number): string => {
    return 'rgb(34, 197, 94)'; // green-500
  };

  const isLoading = isLicensesLoading || isPurchasedLoading;

  const contextValue: LicenseContextType = {
    licenses: licenses || [],
    purchasedLicenses,
    groupedLicenses,
    isLoading,
    error,
    refreshLicenses,
    fetchLicenseDetails,
    calculateUsagePercentage,
    getUsageColor,
  };

  return (
    <LicenseContext.Provider value={contextValue}>
      {children}
    </LicenseContext.Provider>
  );
};

// Custom hook to use the license context
export const useLicenseContext = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicenseContext must be used within a LicenseProvider');
  }
  return context;
};
