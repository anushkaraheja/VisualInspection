import useSWR from 'swr';
import axios from 'axios';
import type { Batch } from '@prisma/client';
import type { ApiResponse } from 'types';

const fetcher = async (url: string): Promise<Batch[]> => {
  const res = await axios.get<ApiResponse<Batch[]>>(url);
  if (!res.data.success) {
    throw new Error(res.data.error.message || 'Batches not found');
  }
  return res.data.data;
};

const useBatches = () => {
  const { data, error, isLoading, mutate } = useSWR('/api/teams/visualInspection/batches', fetcher);

  return {
    batches: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export default useBatches;