import useSWRMutation from 'swr/mutation';
import axios from 'axios';
import type { Batch } from '@prisma/client';
import type { ApiResponse } from 'types';

type CreateBatchInput = {
  productCount: number;
  productIds: string[];
};

const createBatch = async (
  url: string,
  { arg }: { arg: CreateBatchInput }
): Promise<Batch> => {
  const res = await axios.post<ApiResponse<Batch>>(url, arg);
  if (!res.data.success) {
    throw new Error(res.data.error.message || 'Batch not created');
  }
  return res.data.data;
};

const useCreateBatch = () => {
  return useSWRMutation('/api/teams/visualInspection/batches', createBatch);
};

export default useCreateBatch;