import useSWRMutation from 'swr/mutation';
import axios from 'axios';
import type { Batch } from '@prisma/client';
import type { ApiResponse } from 'types';

const deleteBatch = async (
  url: string,
  { arg }: { arg: { id: string } }
): Promise<Batch> => {
  const res = await axios.delete<ApiResponse<Batch>>(url, { data: arg });
  if (!res.data.success) {
    throw new Error(res.data.error.message || 'Batch not deleted');
  }
  return res.data.data;
};

const useDeleteBatch = () => {
  return useSWRMutation('/api/teams/visualInspection/batches', deleteBatch);
};

export default useDeleteBatch;