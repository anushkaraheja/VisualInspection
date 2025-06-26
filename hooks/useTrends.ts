import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

export interface TrendDataPoint {
  week: string;
  date: string;
  [key: string]: string | number; // Allow dynamic PPE type keys
}

/**
 * Hook to fetch trend data for a team
 * @param teamSlug The team slug to fetch trends for
 * @param period The period to fetch trends for ('week' or 'month')
 */
export function useTrends(
  teamSlug: string | undefined,
  period: 'week' | 'month' = 'week'
) {
  const { data, error, isLoading } = useSWR<TrendDataPoint[]>(
    teamSlug ? `/api/teams/${teamSlug}/trends?period=${period}` : null,
    fetcher,
    { refreshInterval: 3600000 } // refresh every hour
  );


  return {
    data,
    isLoading,
    error,
  };
}
