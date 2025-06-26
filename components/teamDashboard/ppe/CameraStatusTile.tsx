import { DeviceStatus } from '@prisma/client';
import React from 'react';
import { BsCameraVideo, BsCameraVideoOff } from 'react-icons/bs';
import { FiWifi } from 'react-icons/fi';

interface CameraStatusTileProps {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  zone: string;
  connectionType?: string;
  ipAddress?: string;
  isSelected?: boolean;
  onClick: (id: string) => void;
}

const CameraStatusTile: React.FC<CameraStatusTileProps> = ({
  id,
  name,
  location,
  status,
  zone,
  connectionType,
  ipAddress,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      className={`
        p-2 border rounded-md mb-2 cursor-pointer transition-all duration-200
        ${
          isSelected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30'
        }
      `}
      onClick={() => onClick(id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {location}
          </p>
        </div>
        <div
          className={`
          flex items-center justify-center rounded-full p-1
          ${
            status === DeviceStatus.ONLINE
              ? 'text-green-500 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          }
        `}
        >
          {status === DeviceStatus.ONLINE ? (
            <BsCameraVideo className="h-4 w-4" />
          ) : (
            <BsCameraVideoOff className="h-4 w-4" />
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
          {zone}
          {connectionType && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-sm text-xs flex items-center">
              <FiWifi className="h-2.5 w-2.5 mr-0.5" />
              {connectionType}
            </span>
          )}
        </span>
        <span
          className={`
          inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
          ${
            status === DeviceStatus.ONLINE
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }
        `}
        >
          {status === DeviceStatus.ONLINE ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE}
        </span>
      </div>
      {ipAddress && (
        <div className="mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
            {ipAddress}
          </span>
        </div>
      )}
    </div>
  );
};

export default CameraStatusTile;
