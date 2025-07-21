import useSWRMutation from 'swr/mutation';
import type { ProductType } from '@prisma/client';
import type { ApiResponse } from 'types';
import postFetcher from '@/lib/postFetcher';


const useCreateProductType = () => {
    const { trigger, isMutating, error } = useSWRMutation<ApiResponse<ProductType>>(
        '/api/teams/visualInspection/product-types',
        postFetcher
    );

    return {
        createProductType: trigger,
        isCreating: isMutating,
        error,
    };
};

export default useCreateProductType;