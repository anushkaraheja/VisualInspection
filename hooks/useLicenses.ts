import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import { License } from 'types/license';

interface LicensesResponse {
  data: License[];
}

export const useLicenses = (teamSlug: string) => {
  const { data, error, mutate } = useSWR<LicensesResponse>(
    teamSlug ? `/api/teams/${teamSlug}/licenses` : null,
    fetcher
  );

  return {
    licenses: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
