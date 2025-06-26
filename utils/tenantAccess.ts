import { useRouter } from 'next/router';
import useTeams from 'hooks/useTeams';
import { useEffect, useState, useMemo } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { Team } from '@prisma/client';
import React from 'react';
import { defaultHeaders } from '@/lib/common';

/**
 * Types for tenant access control
 */
export interface TenantFeatureMap {
  [key: string]: string[]; // Maps tenant type names to arrays of allowed features
}

export interface TenantTypeAccess {
  isLoading: boolean;
  hasAccess: boolean;
  tenantType: string | null;
  error?: string;
}

export interface TenantFeatureAccess extends TenantTypeAccess {
  features: string[];
}

interface CacheEntry {
  timestamp: number;
  result: TenantFeatureAccess;
}

/**
 * Defines which features are available for each tenant type.
 * This can be extended as new tenant types and features are added.
 */
export const TENANT_FEATURES: TenantFeatureMap = {
  PPE: [
    'dashboard',
    'live-monitoring',
    'analytics',
    'reports',
    'configure-ppe',
    'alerts'
  ],
  VisualInspection: ['inventory', 'pos', 'customers', 'dashboard',],
  Farm: ['dashboard', 'records', 'alerts', 'live-monitoring', 'configure-livestock', 'vendors'],
  DEFAULT: ['dashboard'],
};

/**
 * Cache for tenant access results to prevent unnecessary recalculations
 */
const accessCache = new Map<string, CacheEntry>();

const CACHE_TTL = 60000; // 1 minute in milliseconds

/**
 * Hook to check if the current team has access to a specific feature
 * Integrates vendor settings check for Farm tenant type
 * @param feature The feature to check access for (optional)
 * @returns Object with loading state, access boolean, and tenant info
 */
export function useTenantAccess(feature?: string): TenantFeatureAccess {
  const router = useRouter();
  const teamSlug = router.query.slug as string | undefined;
  const { teams, isLoading: teamsLoading } = useTeams();
  const [accessState, setAccessState] = useState<TenantFeatureAccess>({
    isLoading: true,
    hasAccess: false,
    tenantType: null,
    features: [],
  });
  
  // Get vendor settings
  const { isTeamUsingVendors, isLoading: vendorSettingsLoading } = 
    useVendorSettings({ teamSlug: teamSlug || '' });

  // Generate a cache key based on the team slug, feature, and vendor settings
  const cacheKey = useMemo(
    () => `${teamSlug || ''}:${feature || 'all'}:${isTeamUsingVendors}`,
    [teamSlug, feature, isTeamUsingVendors]
  );

  // Check access and manage cache
  useEffect(() => {
    // If teams are still loading, vendor settings are loading, or no team slug, we're not ready
    if (teamsLoading || vendorSettingsLoading || !teamSlug) return;

    // Check cache first
    const cachedResult = accessCache.get(cacheKey);
    const now = Date.now();
    if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
      setAccessState(cachedResult.result);
      return;
    }

    // No valid cache, determine access
    const currentTeam = teams?.find((team) => team.slug === teamSlug);

    if (!currentTeam) {
      const result: TenantFeatureAccess = {
        isLoading: false,
        hasAccess: false,
        tenantType: null,
        features: [],
        error: 'Team not found',
      };
      setAccessState(result);
      accessCache.set(cacheKey, { timestamp: now, result });
      return;
    }

    const tenantType = currentTeam.TenantType?.name || 'DEFAULT';
    
    // Get base allowed features
    let allowedFeatures = [...(TENANT_FEATURES[tenantType] || TENANT_FEATURES.DEFAULT)];
    
    // If this is a Farm tenant and vendors are disabled, remove the vendors feature
    if (tenantType === 'Farm' && isTeamUsingVendors === false && allowedFeatures.includes('vendors')) {
      allowedFeatures = allowedFeatures.filter(f => f !== 'vendors');
    }

    const result: TenantFeatureAccess = {
      isLoading: false,
      hasAccess: !feature || allowedFeatures.includes(feature),
      tenantType,
      features: allowedFeatures,
    };

    setAccessState(result);
    accessCache.set(cacheKey, { timestamp: now, result });
  }, [teamsLoading, teams, teamSlug, feature, cacheKey, isTeamUsingVendors, vendorSettingsLoading]);

  return accessState;
}

/**
 * Hook to check if the current team is of a specific tenant type
 * @param tenantTypeName The tenant type to check for
 * @returns Object with loading state and boolean result
 */
export function useTenantType(tenantTypeName: string): TenantTypeAccess {
  const { isLoading, tenantType } = useTenantAccess();

  return {
    isLoading,
    hasAccess: tenantType === tenantTypeName,
    tenantType,
  };
}

/**
 * Utility to check if a specific tenant type has access to a feature
 * @param tenantType The tenant type to check
 * @param feature The feature to check access for
 * @returns boolean indicating if the tenant type has access
 */
export function hasTenantTypeAccess(
  tenantType: string | null,
  feature: string
): boolean {
  if (!tenantType) return false;

  const allowedFeatures =
    TENANT_FEATURES[tenantType] || TENANT_FEATURES.DEFAULT;
  return allowedFeatures.includes(feature);
}

/**
 * Higher-order component to protect routes based on tenant features
 * @param Component The component to wrap with tenant access protection
 * @param requiredFeature The feature required to access this component
 * @param fallbackUrl Optional URL to redirect to if access is denied (defaults to dashboard)
 * @returns A new component with tenant access control
 */
export function withTenantAccess<P extends object>(
  Component: React.ComponentType<P>,
  requiredFeature: string,
  fallbackUrl?: string
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  // Defined as JSX function component with explicit return type
  const WrappedComponent: React.FC<P> = (props: P) => {
    const router = useRouter();
    const { isLoading, hasAccess, tenantType } =
      useTenantAccess(requiredFeature);
    const teamSlug = router.query.slug as string | undefined;

    // Default fallback is the 404
    const redirectUrl =
      fallbackUrl || (teamSlug ? `/teams/${teamSlug}/404` : '/');

    useEffect(() => {
      // Only redirect if we've confirmed no access and we have a team slug
      if (!isLoading && !hasAccess && teamSlug) {
        console.log(
          `Access denied: Tenant type "${tenantType}" doesn't have access to "${requiredFeature}"`
        );
        router.replace(redirectUrl);
      }
    }, [isLoading, hasAccess, router, redirectUrl, tenantType, teamSlug]);

    if (isLoading) {
      return null;
    }

    // Return null if no access (will redirect in the useEffect)
    if (!hasAccess) {
      return null;
    }

    // If we have access, render the component with proper jsx syntax
    return React.createElement(Component, props);
  };

  // Set the display name
  WrappedComponent.displayName = `withTenantAccess(${displayName})`;

  // Return the wrapped component
  return WrappedComponent;
}

// Type definition for team with TenantType included
interface TeamWithTenantType extends Team {
  TenantType?: {
    name: string;
  } | null;
}

// Type for the Prisma client (simplified for this context)
interface PrismaClient {
  team: {
    findUnique: (params: {
      where: { slug: string };
      include?: { TenantType: boolean };
    }) => Promise<TeamWithTenantType | null>;
  };
}

/**
 * For server-side rendering: redirects if tenant doesn't have required access
 * Use in getServerSideProps to protect routes on the server side
 */
export async function checkTenantAccessServerSide(
  context: GetServerSidePropsContext,
  requiredFeature: string,
  prisma: PrismaClient
) {
  const { params } = context;
  const teamSlug = params?.slug as string | undefined;

  if (!teamSlug) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    // Find the team and get tenant type
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      include: { TenantType: true },
    });

    if (!team) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const tenantType = team.TenantType?.name || 'DEFAULT';
    const allowedFeatures =
      TENANT_FEATURES[tenantType] || TENANT_FEATURES.DEFAULT;

    // If tenant doesn't have access to this feature, redirect
    if (!allowedFeatures.includes(requiredFeature)) {
      return {
        redirect: {
          destination: `/teams/${teamSlug}/dashboard`,
          permanent: false,
        },
      };
    }

    // Access is allowed, continue
    return {
      props: {
        tenantType,
      },
    };
  } catch (error) {
    console.error('Error checking tenant access:', error);
    return {
      redirect: {
        destination: `/teams/${teamSlug}/dashboard`,
        permanent: false,
      },
    };
  }
}

/**
 * Conditionally renders a component based on tenant access to a feature
 */
export const TenantFeature: React.FC<{
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback = null }) => {
  const { hasAccess, isLoading } = useTenantAccess(feature);

  if (isLoading) {
    // Return null during loading or use a skeleton component
    return null;
  }

  // Use standard return without JSX syntax in .ts file
  return hasAccess ? children : fallback;
};

/**
 * Hook to manage vendor settings for a team
 * @returns Object with vendor settings and methods to update them
 */
export function useVendorSettings({ teamSlug }: { teamSlug: string }): {
  isTeamUsingVendors: boolean | null;
  isLoading: boolean;
  error: string | null;
  updateVendorSettings: (useVendors: boolean) => Promise<void>;
} {
  const [useVendors, setUseVendors] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the current vendor settings
  useEffect(() => {
    if (!teamSlug) {
      setIsLoading(false);
      return;
    }

    const fetchVendorSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/teams/${teamSlug}/toggleVendorSetting`,
          {
            method: 'GET',
            headers: defaultHeaders,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error?.message || 'Failed to fetch vendor settings'
          );
        }

        const data = await response.json();
        setUseVendors(data.useVendors);
        setError(null);
      } catch (err: any) {
        setError(
          err.message || 'An error occurred while fetching vendor settings'
        );
        console.error('Error fetching vendor settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorSettings();
  }, [teamSlug]);

  // Function to update vendor settings
  const updateVendorSettings = async (newUseVendors: boolean) => {
    if (!teamSlug) {
      setError('No team selected');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/teams/${teamSlug}/toggleVendorSetting`,
        {
          method: 'PUT',
          headers: defaultHeaders,
          body: JSON.stringify({ useVendors: newUseVendors }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Failed to update vendor settings'
        );
      }

      const data = await response.json();
      setUseVendors(data.useVendors);
      setError(null);
    } catch (err: any) {
      setError(
        err.message || 'An error occurred while updating vendor settings'
      );
      console.error('Error updating vendor settings:', err);
      throw err; // Re-throw to let the component handle it
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isTeamUsingVendors: useVendors,
    isLoading,
    error,
    updateVendorSettings,
  };
}
