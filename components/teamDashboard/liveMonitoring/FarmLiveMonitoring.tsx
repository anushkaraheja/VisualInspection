import React from 'react';
import LiveStream from './liveStream';
import { WithLoadingAndError } from '@/components/shared';

interface FarmLiveMonitoringProps {
    cameraId?: string;
    teamSlug?: string;
    device?: any;
    apiEndpoint: string;
    status: string;
    isLoading: boolean;
    error: any;
}

const FarmLiveMonitoring: React.FC<FarmLiveMonitoringProps> = ({ 
    cameraId, 
    teamSlug, 
    apiEndpoint, 
    status,
    isLoading,
    error
}) => {
    
    return (
        <WithLoadingAndError isLoading={isLoading} error={error}>
            {status === 'online' && apiEndpoint ? (
                <LiveStream
                    webvis_url={apiEndpoint}
                />
            ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-500 dark:bg-gray-700">
                    <div className="text-center p-4">
                        <div className="text-white text-lg font-medium mb-1">
                            Camera Offline
                        </div>
                        <div className="text-gray-200 text-sm">
                            This camera is currently unavailable
                        </div>
                    </div>
                </div>
            )}
        </WithLoadingAndError>
    );
};

export default FarmLiveMonitoring;
