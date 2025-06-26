import fetcher from '@/lib/fetcher';
import useSWR from 'swr';

export interface RepeatOffender {
  id: string;
  workerId: string;
  employeeId: string;
  violations: number;
  lastViolation: Date;
  lastViolationType: string; // Ensure this is included in the interface
  zone: string;
  locationName: string;
  location: string;
  riskLevel: 'high' | 'medium' | 'low';
  violationTypes: string[];
}

interface UseRepeatOffendersOptions {
  minViolations?: number;
  limit?: number;
  // Update sortBy options - replace 'department' with 'location'
  sortBy?: 'violations' | 'lastViolation' | 'name' | 'location' | 'riskLevel';
  sortOrder?: 'asc' | 'desc';
}

// Default values
const DEFAULT_MIN_VIOLATIONS = 10;
const DEFAULT_LIMIT = 5;

export function useRepeatOffenders(
  teamSlug: string,
  options: UseRepeatOffendersOptions = {}
) {
  const {
    minViolations = DEFAULT_MIN_VIOLATIONS,
    limit = DEFAULT_LIMIT,
    sortBy = 'violations',
    sortOrder = 'desc',
  } = options;

  // Debug statements
  console.debug('[useRepeatOffenders] Hook called with:', {
    teamSlug,
    minViolations,
    limit,
    sortBy,
    sortOrder,
  });

  const url = teamSlug
    ? `/api/teams/${teamSlug}/repeat-offenders?minViolations=${minViolations}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    : null;

  console.debug('[useRepeatOffenders] Request URL:', url);

  const { data, error, isLoading, mutate } = useSWR<RepeatOffender[]>(
    url,
    fetcher
  );

  // Debug data received from API
  console.debug('[useRepeatOffenders] Response:', {
    success: !error,
    isLoading,
    offendersCount: data?.length || 0,
    error: error ? error.toString() : null,
  });

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
