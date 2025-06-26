import useSWR from 'swr';
import axios from 'axios';

// Interface for zone risk data to match the mock data format
export interface ZoneRiskData {
  id: string;
  name: string;
  location: string;
  violations: number;
  complianceRate: number;
}

const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export default function useHighRiskZones(teamSlug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ZoneRiskData[]>(
    teamSlug ? `/api/teams/${teamSlug}/high-risk-zones` : null,
    fetcher
  );

  return {
    zones: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
