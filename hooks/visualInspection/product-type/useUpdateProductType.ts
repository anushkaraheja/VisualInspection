import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import type { ProductType } from '@prisma/client';
import type { ApiResponse } from 'types';

const updateProductType = async (
    url: string,
    { arg }: { arg: { id: string; name: string } }
): Promise<ProductType> => {
    const response = await axios.put<ApiResponse<ProductType>>(url, arg);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update product type');
    }
    return response.data.data;
};

const useUpdateProductType = () => {
    const { trigger, isMutating, error } = useSWRMutation(
        '/api/teams/visualInspection/product-types',
        updateProductType
    );

    return {
        updateProductType: trigger,
        isUpdating: isMutating,
        error,
    };
};

export default useUpdateProductType;