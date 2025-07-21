import postFetcher from '@/lib/postFetcher';
import useSWRMutation from 'swr/mutation';
import type { Product } from '@prisma/client';
import type { ApiError, ApiResponse } from 'types/base.ts';

const createProduct = async(
    url: string, 
    { arg } : { arg: { name: string; productTypeId: string; batchId?: string } }
): Promise<Product> => {
    const data = await postFetcher(url, arg) as {
        success: true;
        data: Product;
        error: never;
      } | {
        success: false;
        data: never;
        error: ApiError;
      };    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create product ');
    }
    return data.data;
};