import useSWR from 'swr';
import type { ProductType } from '@prisma/client';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';

const useProductTypes = () => {
    const { data, error, isLoading, mutate } = useSWR<ApiResponse<ProductType[]>>(
        '/api/teams/visualInspection/product-types', 
        fetcher
    );
    
    return {
        productTypes: data?.data,
        isError: error, 
        isLoading,
        mutate
    };
};

export default useProductTypes;