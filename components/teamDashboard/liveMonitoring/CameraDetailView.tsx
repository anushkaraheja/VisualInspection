import React, { useEffect, useState } from 'react';
import PPELiveMonitoring from './PPELiveMonitoring';
import RecentDetections from '../ppe/RecentDetections';
import CameraStatusTile from '../ppe/CameraStatusTile';
import { IoIosArrowBack } from 'react-icons/io';
import { useTenantType } from 'utils/tenantAccess';
import { WithLoadingAndError } from '@/components/shared';
import FarmLiveMonitoring from './FarmLiveMonitoring';
import { useRouter } from 'next/router';
import { useDevice } from 'hooks/useDevices';
import { DeviceStatus } from '@prisma/client';
import { DeviceData } from 'hooks/useZoneDevice';

/**
 * Filter devices by location name
 * @param devices Array of device data
 * @param locationName Location name to filter by
 * @returns Filtered array of devices
 */
const getDevicesByLocation = (
  devices: DeviceData[] | undefined,
  locationName: string
): DeviceData[] => {
  if (!Array.isArray(devices) || devices.length === 0) {
    return [];
  }
  
  if (locationName === 'All Locations') {
    return devices;
  }
  
  return devices.filter((device) => 
    device.zone?.location.name === locationName
  );
};

interface CameraDetailViewProps {
  selectedDevice: string;
  selectedDeviceDetails: DeviceData | undefined;
  deviceData: DeviceData[] | undefined;
  onBackClick: () => void;
  reloadCameraStatus: () => void;
  onCameraSelect: (id: string) => void;
}

const CameraDetailView: React.FC<CameraDetailViewProps> = ({
  selectedDevice,
  selectedDeviceDetails,
  deviceData,
  onBackClick,
  reloadCameraStatus,
  onCameraSelect,
}) => {
  const { isLoading, hasAccess: isFarmTenant } = useTenantType('Farm');
  const [safeDeviceData, setSafeDeviceData] = useState<DeviceData[]>([])

  const router = useRouter();
  const { slug } = router.query;
  const teamSlug = typeof slug === 'string' ? slug : '';

  const {
    device,
    isLoading: isDeviceLoading,
    error: deviceError,
    tenantType,
    isPPE
  } = useDevice(teamSlug, selectedDevice || null);

  
  // Use device data as fallback when selectedDeviceDetails is undefined
  const deviceDetails = selectedDeviceDetails || device;
  const locationName = deviceDetails?.zone?.location.name || 'All Locations';
  

  
  // Use the function to get filtered device data
  // setSafeDeviceData(getDevicesByLocation(deviceData, locationName));
  
  useEffect(() => {
    if (device) {
      reloadCameraStatus();
      setSafeDeviceData(getDevicesByLocation(deviceData, locationName));
    }
  }, [deviceData, device, locationName]);

  const isComponentLoading = isLoading || isDeviceLoading;
  const combinedError = deviceError;

  const cameraConnection = device?.config?.apiEndpoint
  const cameraStatus = device?.status?.toLowerCase() || DeviceStatus.OFFLINE;

  const totalCameras = safeDeviceData.length;

  const locationCameras =
    locationName === 'All Locations'
      ? totalCameras
      : safeDeviceData.filter((cam) => cam.zone?.location.name === locationName).length;

  const onlineDevices = safeDeviceData.filter(
    (cam) => cam.status === DeviceStatus.ONLINE
  );
  const onlineCameraIndex = onlineDevices.findIndex(
    (cam) => cam.id === selectedDevice
  );

  return (
    <WithLoadingAndError isLoading={isComponentLoading} error={combinedError}>
      <div className="mb-4">
        <button
          onClick={onBackClick}
          className="flex items-start md:text-lg text-gray-600 dark:text-gray-300"
        >
          <IoIosArrowBack className="h-5 w-5 md:text-lg mr-2 mt-1" />
          <div className="flex flex-col items-start">
            <p className="text-lg font-semibold text-gray-900 dark:text-textColor">
              {deviceDetails?.name || 'Unknown Camera'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {deviceDetails?.zone?.name || 'Unknown Zone'}
            </p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-surfaceColor shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {isFarmTenant ?
                <FarmLiveMonitoring
                  teamSlug={teamSlug}
                  cameraId={selectedDevice}
                  device={device}
                  apiEndpoint={cameraConnection || ''}
                  status={cameraStatus}
                  isLoading={isDeviceLoading}
                  error={deviceError}
                /> :
                <PPELiveMonitoring
                  isFarmTenant={isFarmTenant}
                  status={deviceDetails?.status as DeviceStatus || DeviceStatus.OFFLINE}
                  cameraIndex={onlineCameraIndex !== -1 ? onlineCameraIndex : 0}
                  apiEndpoint={deviceDetails?.config.apiEndpoint || cameraConnection}
                />
              }
            </div>
          </div>

          {isFarmTenant ? <div>
            {/* create recent count table */}
          </div> : <div className="mt-6">
            <RecentDetections />
          </div>}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surfaceColor shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col">
                <h2 className="font-medium text-[22px] leading-8 font-['Poppins'] text-gray-900 dark:text-textColor">
                  Camera Status
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
                  {locationName} ({locationCameras})
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="max-h-[600px] overflow-y-auto pr-1">
                {safeDeviceData.length > 0 ? (
                  safeDeviceData.map((device) => (
                    <CameraStatusTile
                      key={device.id || 'unknown'}
                      id={device.id || 'unknown'}
                      name={device.name || 'Unknown Camera'}
                      location={device.zone?.location.name || 'Unknown Location'}
                      status={device.status as DeviceStatus}
                      zone={device.zone?.name || 'Unknown Zone'}
                      isSelected={device.id === selectedDevice}
                      onClick={onCameraSelect}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No camera data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
};

export default CameraDetailView;
