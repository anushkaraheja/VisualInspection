import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { Product } from '@prisma/client';
import type { ApiResponse } from 'types';

const useProducts = () => {
    const { data, error, isLoading, mutate } = useSWR<ApiResponse<Product[]>>(
        '/api/teams/visualInspection/products',
        fetcher
    );

    return {
        products: data?.data,
        isLoading,
        isError: error,
        mutate,
    };
};

export default useProducts;