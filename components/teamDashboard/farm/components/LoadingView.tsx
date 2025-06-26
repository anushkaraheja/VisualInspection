import React from 'react';
import { Loading } from '@/components/shared';

export const LoadingView: React.FC = () => (
    <div className="flex justify-center items-center p-12 bg-white dark:bg-surfaceColor rounded-lg shadow-sm mb-6">
        <Loading />
        <span className="ml-3 dark:text-textColor">Loading livestock detection data...</span>
    </div>
);
