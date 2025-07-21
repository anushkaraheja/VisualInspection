import useSWR from 'swr';
import axios from 'axios';
import type { Batch } from '@prisma/client';
import type { ApiResponse } from 'types';

const fetcher = async (url: string): Promise<Batch> => {
  const res = await axios.get<ApiResponse<Batch>>(url);
  if (!res.data.success) {
    throw new Error(res.data.error.message || 'Cannot find batch');
  }
  return res.data.data;
};

const useBatch = (id?: string) => {
  const shouldFetch = typeof id === 'string' && id.length > 0;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/teams/visualInspection/batches?id=${id}` : null,
    fetcher
  );

  return {
    batch: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export default useBatch;