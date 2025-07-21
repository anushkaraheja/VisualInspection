import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import type { ProductType } from '@prisma/client';
import type { ApiResponse } from 'types';

const deleteProductType = async (
    url: string,
    { arg }: { arg: { id: string } }
): Promise<ProductType> => {
    const response = await axios.delete<ApiResponse<ProductType>>(url, { data: arg });
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update product type');
    }
    return response.data.data;
};

const useDeleteProductType = () => {
    const { trigger, isMutating, error } = useSWRMutation(
        '/api/teams/visualInspection/product-types',
        deleteProductType
    );

    return {
        deleteProductType: trigger,
        isDeleting: isMutating,
        error,
    };
};

export default useDeleteProductType;