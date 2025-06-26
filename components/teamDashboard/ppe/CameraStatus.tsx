import React from 'react';
import {
  BsCameraVideoFill,
  BsCameraVideo,
  BsCameraVideoOff,
} from 'react-icons/bs';
import { useRouter } from 'next/router';
import { useStatusSummary } from '../liveMonitoring/hooks';

// Define the interface directly in this file
interface CameraStatusData {
  total: number;
  online: number;
  offline: number;
}

interface CameraStatusCardProps {
  teamSlug?: string;
}

const CameraStatusCard: React.FC<CameraStatusCardProps> = ({ teamSlug }) => {
  // Use the teamSlug prop if provided, otherwise get it from router
  const router = useRouter();
  const slug = teamSlug || (router.query.slug as string);

  // Fetch camera status data from API using the existing hook
  const { data, error, isLoading } = useStatusSummary(slug);

  // Extract camera status from the response or use fallback values if data is not available yet
  const cameraStatus: CameraStatusData = data?.cameras || {
    total: 0,
    online: 0,
    offline: 0,
  };

  // Define the camera status tiles
  const statusTiles = [
    {
      title: 'Total Devices',
      value: cameraStatus?.total || 0,
      icon: BsCameraVideoFill,
      bgColor: 'bg-gray-50 dark:bg-surfaceColor',
      borderColor: 'border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-800 dark:text-gray-200',
      iconBgColor: 'bg-[#1D62F0]/10', // Blue background with 10% opacity
      iconColor: 'text-blue-600 dark:text-blue-400',
      showDot: false,
      headingColor: 'text-gray-800 dark:text-textColor',
    },
    {
      title: 'Online Devices',
      value: cameraStatus?.online || 0,
      icon: BsCameraVideo,
      bgColor: 'bg-[#F6FBF8] dark:bg-[#1E3A2A]/20',
      borderColor: 'border-[#52BA8780] dark:border-[#52BA8750]',
      textColor: 'text-green-800 dark:text-green-300',
      iconBgColor: 'bg-[#2FCD00]/10', // Using the green color with 10% opacity
      iconColor: 'text-green-600 dark:text-green-400',
      showDot: true,
      dotColor: 'bg-[#2FCD00]',
      headingColor: 'text-[#2FCD00] dark:text-[#2FCD00]',
    },
    {
      title: 'Offline Devices',
      value: cameraStatus?.offline || 0,
      icon: BsCameraVideoOff,
      bgColor: 'bg-[#FFF7F0] dark:bg-[#3A2A1E]/20',
      borderColor: 'border-[#FF950080] dark:border-[#FF950050]',
      textColor: 'text-amber-800 dark:text-amber-300',
      iconBgColor: 'bg-[#FF0000]/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      showDot: true,
      dotColor: 'bg-[#FF0000]',
      headingColor: 'text-[#FF0000] dark:text-[#FF0000]',
    },
  ];

  return (
    <div className="overflow-hidden rounded-md">
      <div className="px-4 py-2 sm:px-1 border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl leading-6 font-semibold text-black dark:text-textColor">
          Device Status
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Smart insight of current performance of your work
        </p>
      </div>

      <div className="p-3 sm:p-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {isLoading
            ? // Skeleton loading state
              statusTiles.map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-3 bg-white dark:bg-surfaceColor border border-[#EFEFF4] dark:border-gray-700 h-[84px] w-full animate-pulse"
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="ml-3 space-y-2 w-full">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            : statusTiles.map((tile, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-3 flex items-center bg-white dark:bg-surfaceColor border border-[#EFEFF4] dark:border-gray-700 hover:shadow-sm transition-all duration-200 h-[84px] w-full md:max-w-[330px]"
                >
                  <div className="mr-3">
                    <div
                      className={`h-12 w-12 rounded-full ${tile.iconBgColor} flex items-center justify-center`}
                    >
                      <tile.icon className={`h-6 w-6 ${tile.iconColor}`} />
                    </div>
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-medium ${tile.headingColor} flex items-center`}
                    >
                      {tile.showDot && (
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${tile.dotColor} mr-1.5`}
                        ></span>
                      )}
                      {tile.title}
                    </h4>
                    <p className={`text-xl mt-0.5 ${tile.textColor}`}>
                      {tile.value}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default CameraStatusCard;
