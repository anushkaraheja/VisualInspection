import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useOrgTheme from 'hooks/useOrgTheme';
import {
  BsCameraVideoFill,
  BsCameraVideo,
  BsCameraVideoOff,
} from 'react-icons/bs';
import { FiMapPin } from 'react-icons/fi';
import DashboardHeader from '../../shared/DashboardHeader';
import StatusTiles from './StatusTiles';
import CameraFilters from './CameraFilters';
import CameraGrid from './CameraGrid';
import CameraDetailView from './CameraDetailView';
import DashboardSection from '@/components/shared/DashboardSection';
import {
  useStatusSummary,
  useAllLocationZones,
  useCamerasFiltered as useDevicesFiltered,
} from './hooks';
import { Loading } from '@/components/shared';

export const LiveMonitoringPage: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const deviceId = router.query.device as string;
  const { theme } = useOrgTheme(teamSlug);
  const primaryColor = theme?.primaryColor || '#16355D';

  // State management
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [isReloading, setIsReloading] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const camerasPerPage = 8; // Setting 8 cameras per page as requested

  // Format today's date in the required format
  const formattedDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Use custom hooks for data fetching
  const {
    data: statusSummary,
    error: statusError,
    isLoading: statusLoading,
  } = useStatusSummary(teamSlug);

  // Fetch all locations with their zones
  const {
    locationsWithZones,
    allZones,
    isLoading: zonesLoading,
    error: zonesError,
  } = useAllLocationZones(teamSlug);

  // Fetch cameras with pagination - note we pass the current page to the hook
  const {
    data: devicesData,
    error: devicesError,
    isLoading: devicesLoading,
    mutate: reloadDevices,
  } = useDevicesFiltered(
    teamSlug,
    allZones,
    locationFilter,
    zoneFilter,
    currentPage,
    camerasPerPage
  );

  // Prepare status tiles config with improved error handling
  const statusTiles = [
    {
      title: 'Total Zones',
      value: allZones?.length || 0,
      icon: FiMapPin,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600 dark:text-purple-400',
      showDot: false,
      headingColor: 'text-gray-800 dark:text-textColor',
    },
    {
      title: 'Total Cameras',
      value: statusSummary?.cameras?.total || 0, // Added optional chaining for cameras property
      icon: BsCameraVideoFill,
      iconBgColor: 'bg-[#1D62F0]/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      showDot: false,
      headingColor: 'text-gray-800 dark:text-textColor',
    },
    {
      title: 'Online Cameras',
      value: statusSummary?.cameras?.online || 0, // Added optional chaining for cameras property
      icon: BsCameraVideo,
      iconBgColor: 'bg-[#2FCD00]/10',
      iconColor: 'text-green-600 dark:text-green-400',
      showDot: true,
      dotColor: 'bg-[#2FCD00]',
      headingColor: 'text-[#2FCD00] dark:text-[#2FCD00]',
    },
    {
      title: 'Offline Cameras',
      value: statusSummary?.cameras?.offline || 0, // Added optional chaining for cameras property
      icon: BsCameraVideoOff,
      iconBgColor: 'bg-[#FF0000]/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      showDot: true,
      dotColor: 'bg-[#FF0000]',
      headingColor: 'text-[#FF0000] dark:text-[#FF0000]',
    },
  ];

  // Add loading state for status tiles section
  const isStatusLoading = statusLoading || !statusSummary;

  // Set selectedCamera from URL query param if provided
  useEffect(() => {
    if (deviceId) {
      setSelectedCamera(deviceId);
    }
  }, [deviceId]);

  // Handle filters change
  const handleFilterChange = (
    newLocationFilter: string,
    newZoneFilter: string
  ) => {
    // Only change filters and reset camera selection if not showing a specific camera
    if (!deviceId) {
      setLocationFilter(newLocationFilter);
      setZoneFilter(newZoneFilter);
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  };

  // Handle camera selection with URL update
  const handleCameraSelect = (cameraId: string) => {
    // Update the URL with the selected camera
    router.push(
      {
        pathname: `/teams/${teamSlug}/live-monitoring`,
        query: { device: cameraId },
      },
      undefined,
      { shallow: true }
    );

    setSelectedCamera(cameraId);
  };

  // Handle back click - also update URL
  const handleBackClick = () => {
    router.push(
      {
        pathname: `/teams/${teamSlug}/live-monitoring`,
      },
      undefined,
      { shallow: true }
    );

    setSelectedCamera(null);
  };

  // Handle page change - this will trigger the hook to fetch a new page of cameras
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle reload cameras
  const handleReloadCameras = async () => {
    setIsReloading(true);
    try {
      await reloadDevices();
    } finally {
      setTimeout(() => setIsReloading(false), 500);
    }
  };

  // Time update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Modify this effect to not reset camera selection when coming from a direct URL
  useEffect(() => {
    // Only reset selected camera when filter changes if we're not viewing from URL
    if (!router.query.device) {
      setSelectedCamera(null);
    }
  }, [locationFilter, zoneFilter, router.query.device]);

  // Find selected camera details
  const selectedCameraDetails = devicesData?.data?.find(
    (cam) => cam.id === selectedCamera
  );




  // Error state
  const hasError = statusError || zonesError || devicesError;

  if (hasError) {
    return (
      <div className="bg-gray-100 dark:bg-backgroundColor min-h-screen p-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
            Error loading data
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            There was a problem loading the camera data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if(devicesLoading){
    return (
      <Loading/>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-backgroundColor min-h-screen relative">
      {/* Use DashboardHeader with calendar dropdown explicitly disabled */}
      <DashboardHeader
        title="Live Monitoring"
        primaryColor={primaryColor}
        currentTime={currentTime}
        formattedDate={formattedDate}
        showDatePicker={false}
      />

      <div
        className="px-4 sm:px-6 lg:px-8 relative"
        style={{ marginTop: '-100px' }}
      >
        {/* Always show the Overview section with StatusTiles - removed conditional rendering */}
        <DashboardSection title="Overview">
          {isStatusLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 bg-white dark:bg-surfaceColor border border-gray-200 dark:border-gray-700 h-[84px] w-full overflow-hidden"
                >
                  <div className="flex items-center h-full">
                    <div className="mr-4 flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 shimmer-effect"></div>
                    </div>
                    <div className="flex flex-col space-y-2 flex-grow">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded shimmer-effect"></div>
                      <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded shimmer-effect"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatusTiles tiles={statusTiles} />
          )}
        </DashboardSection>

        {/* Main Content */}
        {selectedCamera ? (
          <CameraDetailView
            selectedDevice={selectedCamera}
            selectedDeviceDetails={selectedCameraDetails}
            deviceData={devicesData?.data}
            onBackClick={handleBackClick}
            onCameraSelect={handleCameraSelect}
            reloadCameraStatus={reloadDevices}
          />
        ) : (
          <div>
            {/* Camera Filters */}
            <CameraFilters
              locationFilter={locationFilter}
              zoneFilter={zoneFilter}
              locationsWithZones={locationsWithZones}
              onFilterChange={handleFilterChange}
            />

            {/* Camera Grid with server pagination */}
            <CameraGrid
              camerasData={devicesData}
              camerasError={devicesError}
              camerasLoading={devicesLoading || zonesLoading}
              locationFilter={locationFilter}
              zoneFilter={zoneFilter}
              isReloading={isReloading}
              onReload={handleReloadCameras}
              onCameraSelect={handleCameraSelect}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              camerasPerPage={camerasPerPage}
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </div>
  );
};
