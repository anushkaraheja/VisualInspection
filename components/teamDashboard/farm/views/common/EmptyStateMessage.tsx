import React from 'react';

interface EmptyStateMessageProps {
    message: string;
    description?: string;
}

export const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ 
    message, 
    description = 'No livestock detections found for the selected filters.' 
}) => (
    <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-textColor" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{message}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-textColor">
            {description}
        </p>
    </div>
);
