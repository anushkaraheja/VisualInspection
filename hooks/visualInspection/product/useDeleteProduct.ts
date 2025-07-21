import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import type { Product } from '@prisma/client';
import type { ApiResponse } from 'types';

const deleteProduct = async (
    url: string,
    { arg }: { arg: { id: string } }
): Promise<Product> => {
    const response = await axios.delete<ApiResponse<Product>>(url, { data: arg });
    if (!response.data.success) {
        throw new Error(response.data.error.message);
    }
    return response.data.data;
};

const useDeleteProduct = () => {
    const { trigger, isMutating, error } = useSWRMutation(
        '/api/teams/visualInspection/products',
        deleteProduct
    );

    return {
        deleteProduct: trigger,
        isDeleting: isMutating,
        error,
    };
};

export default useDeleteProduct;