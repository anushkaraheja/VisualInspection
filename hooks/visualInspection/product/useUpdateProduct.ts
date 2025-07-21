import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import type { Product } from '@prisma/client';
import type { ApiResponse } from 'types';

const updateProduct = async (
    url: string,
    { arg }: { arg: { id: string; name: string; productTypeId: string; batchId?: string } }
): Promise<Product> => {
    const response = await axios.put<ApiResponse<Product>>(url, arg);
    if (!response.data.success) {
        throw new Error(response.data.error.message);
    }
    return response.data.data;
};

const useUpdateProduct = () => {
    const { trigger, isMutating, error } = useSWRMutation(
        '/api/teams/visualInspection/products',
        updateProduct
    );

    return {
        updateProduct: trigger,
        isUpdating: isMutating,
        error,
    };
};

export default useUpdateProduct;