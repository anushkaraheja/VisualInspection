import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

export interface PPEItem {
  id: string;
  name: string;
  description?: string;
}

export interface TeamPPEItem {
  id: string;
  teamId: string;
  ppeItemId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  ppeItem: PPEItem;
}

interface TeamPPEItemsResponse {
  success: boolean;
  data: TeamPPEItem[];
}

/**
 * Hook to fetch PPE items for a team
 * @param teamSlug The team slug to fetch PPE items for
 */
export function useTeamPPEItems(teamSlug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<TeamPPEItemsResponse>(
    teamSlug ? `/api/teams/${teamSlug}/ppe-items` : null,
    fetcher,
    {
      refreshInterval: 300000, // refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  // Extract the teamPPEItems array from the response
  const teamPPEItems = data?.data || [];

  return {
    teamPPEItems,
    isLoading,
    error,
    mutate,
  };
}
