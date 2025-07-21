import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { Defect } from '@prisma/client';
import type { ApiResponse } from 'types';


const useDefects = () => {
    const { data, error, isLoading, mutate } = useSWR<ApiResponse<Defect>>(
        '/api/teams/visualInspection/defects',
        fetcher
    );
    return {
        defects: data, 
        isLoading, 
        isError: error, 
        mutate,
    };
};

export default useDefects;