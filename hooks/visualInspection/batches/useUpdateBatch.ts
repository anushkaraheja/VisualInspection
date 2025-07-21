import useSWRMutation from 'swr/mutation';
import axios from 'axios';
import type { Batch, BatchStatus } from '@prisma/client';
import type { ApiResponse } from 'types';

type UpdateBatchInput = {
  id: string;
  productCount?: number;
  status?: BatchStatus;
  productIds?: string[];
};

const updateBatch = async (url: string, { arg }: { arg: UpdateBatchInput }): Promise<Batch> => {
  const res = await axios.put<ApiResponse<Batch>>(url, arg);
  if (!res.data.success) {
    throw new Error(res.data.error.message || 'Batch not updated');
  }
  return res.data.data;
};

const useUpdateBatch = () => {
  return useSWRMutation('/api/teams/visualInspection/batches', updateBatch);
};

export default useUpdateBatch;