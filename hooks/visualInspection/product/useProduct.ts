import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { Product } from '@prisma/client';
import type { ApiResponse } from 'types';

const useProduct = (productId?: string) => {
  const shouldFetch = !!productId;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Product>> (
    shouldFetch ? `/api/teams/visualInspection/products?id=${productId}` : null,
    fetcher
  );

  return {
    product: data?.data,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export default useProduct;