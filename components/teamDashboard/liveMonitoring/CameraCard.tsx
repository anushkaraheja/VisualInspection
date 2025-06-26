import React from 'react';
import { DeviceData } from 'hooks/useZoneDevice';

interface CameraCardProps {
  camera: DeviceData;
  onClick: (id: string) => void;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, onClick }) => {
  // Ensure we have valid data with fallbacks
  const safeCamera = {
    id: camera?.id || 'unknown',
    name: camera?.name || 'Unknown Camera',
    zone: camera?.zone?.name || 'Unknown Zone',
    location: camera?.zone?.location?.name || 'Unknown Location',
    status: (camera?.status === 'ONLINE' ? 'online' : 'offline') as
      | 'online'
      | 'offline',
    ipAddress: camera?.ipAddress,
    config: camera?.config,
  };

  // Check if camera is online
  const isOnline = safeCamera.status === 'online';

  return (
    <div
      className="bg-white dark:bg-surfaceColor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={() => onClick(safeCamera.id)}
    >
      <div className="h-48 bg-white dark:bg-gray-800 relative overflow-hidden">
        {isOnline ? (
          <div className="h-full w-full relative">
            <div className="h-full w-full flex items-center justify-center">
              <svg
                className="h-14 w-14 text-gray-400 dark:text-gray-600 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            <div className="h-full w-full flex items-center justify-center">
              <svg
                className="h-14 w-14 text-gray-400 dark:text-gray-600 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`
            flex items-center gap-1 px-2.5 py-1 rounded-full 
            text-xs font-medium shadow-sm
            ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
          `}
          >
            <span
              className={`
              inline-block w-1.5 h-1.5 rounded-full 
              ${isOnline ? 'bg-white animate-pulse' : 'bg-white'}
            `}
            ></span>
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span
            className="
            inline-flex items-center px-2.5 py-1 rounded-full 
            text-xs font-medium bg-black/60 text-white 
            backdrop-blur-sm shadow-sm
          "
          >
            {safeCamera.zone}
          </span>
        </div>
      </div>
      <div className="p-5 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-base">
              {safeCamera.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 flex items-center">
              <svg
                className="h-3.5 w-3.5 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {/* Show location with fallback */}
              {safeCamera.location !== 'Unknown Location'
                ? safeCamera.location
                : 'Location Not Available'}
            </p>
          </div>
          {/* Removed the "View" button that appeared on hover */}
        </div>
      </div>
    </div>
  );
};

export default CameraCard;
