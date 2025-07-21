import useSWR from 'swr';
import type { Downtime } from '@prisma/client';
import type { ApiResponse } from 'types';
import fetcher from '@/lib/fetcher';

const useDowntimes = () => {
    const { data, error, isLoading, mutate } = useSWR<ApiResponse<Downtime[]>>(
        '/api/teams/visualInspection/downtime',
        fetcher
    );
    return {
        downtimes: data?.data, 
        isLoading, 
        isError: error, 
        mutate,
    };
};

export default useDowntimes;