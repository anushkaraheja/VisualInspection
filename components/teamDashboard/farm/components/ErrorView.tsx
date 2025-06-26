import React from 'react';
import { Error as ErrorComponent } from '@/components/shared';

interface ErrorViewProps {
    error: string;
    onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => (
    <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6">
        <ErrorComponent message={error} />
        <div className="mt-4">
            <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                onClick={onRetry}
            >
                Retry Loading Data
            </button>
        </div>
    </div>
);
