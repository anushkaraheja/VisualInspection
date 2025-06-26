import fetcher from '@/lib/fetcher';
import { PurchasedLicense } from 'types/license';
import useSWR, { mutate } from 'swr';
import type { ApiResponse } from 'types';

export const usePurchasedLicenses = (teamSlug: string) => {
  const url = `/api/teams/${teamSlug}/purchased-licenses`;

  const { data, error } = useSWR<ApiResponse<PurchasedLicense[]>>(
    teamSlug ? url : null,
    fetcher,
    {
      // Add deeper include to make sure locationLicense is fetched
      revalidateOnFocus: false,
    }
  );

  const mutatePurchasedLicenses = async () => {
    mutate(url);
  };

  return {
    purchasedLicenses: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate: mutatePurchasedLicenses,
  };
};
