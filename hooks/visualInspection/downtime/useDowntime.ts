import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { Downtime } from '@prisma/client';
import type { ApiResponse } from 'types';

const useDowntime = (downtimeId?: string) => {
  const shouldFetch = Boolean(downtimeId);
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Downtime>>(
    shouldFetch ? `/api/teams/visualInspection/downtime?id=${downtimeId}` : null,
    fetcher
  );

  return {
    downtime: data?.data,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export default useDowntime;