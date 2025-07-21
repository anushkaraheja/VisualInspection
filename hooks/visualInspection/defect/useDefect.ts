import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { Defect } from '@prisma/client';
import type { ApiResponse } from 'types';

const useProduct = (defectId?: string) => {
  const shouldFetch = !!defectId;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Defect>>(
    shouldFetch ? `/api/teams/visualInspection/defects?id=${defectId}` : null,
    fetcher
  );

  return {
    defect: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export default useProduct;