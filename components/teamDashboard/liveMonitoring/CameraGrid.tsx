import React from 'react';
import CameraCard from './CameraCard';
import EmptyCameraState from './EmptyCameraState';
import ShimmerCard from './ShimmerCard';
import Pagination from './Pagination';
import { DeviceData } from 'hooks/useZoneDevice';

interface CameraGridProps {
  camerasData:
    | {
        data: DeviceData[];
        meta: {
          totalCount: number;
          currentPage: number;
          pageSize: number;
          totalPages: number;
        };
      }
    | undefined;
  camerasError: Error | undefined;
  camerasLoading: boolean;
  locationFilter: string;
  zoneFilter: string;
  isReloading: boolean;
  onReload: () => void;
  onCameraSelect: (id: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  camerasPerPage: number;
  primaryColor: string;
}

const CameraGrid: React.FC<CameraGridProps> = ({
  camerasData,
  camerasError,
  camerasLoading,
  locationFilter,
  zoneFilter,
  isReloading,
  onReload,
  onCameraSelect,
  currentPage,
  onPageChange,
  camerasPerPage,
  primaryColor,
}) => {
  // Generate the filter description for the empty state
  const getFilterDescription = () => {
    if (locationFilter === 'All' && zoneFilter === 'All') {
      return 'All Cameras';
    } else if (zoneFilter === 'All') {
      return `All in ${locationFilter}`;
    } else {
      return `${zoneFilter} ${locationFilter !== 'All' ? `(${locationFilter})` : ''}`;
    }
  };

  // Generate shimmer cards for loading state
  const renderShimmerCards = () => {
    return Array(camerasPerPage)
      .fill(0)
      .map((_, index) => <ShimmerCard key={`shimmer-${index}`} />);
  };

  const cameras = camerasData?.data || [];
  const totalCameras = camerasData?.meta?.totalCount || 0;
  const totalPages = camerasData?.meta?.totalPages || 1;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {camerasLoading && renderShimmerCards()}

        {!camerasLoading && camerasError && (
          <div className="col-span-full bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
              Error loading cameras
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {camerasError.message ||
                'There was a problem loading the camera data.'}
            </p>
          </div>
        )}

        {!camerasLoading &&
          !camerasError &&
          (!cameras || cameras.length === 0) && (
            <EmptyCameraState
              filterDescription={getFilterDescription()}
              isReloading={isReloading}
              onReload={onReload}
            />
          )}

        {!camerasLoading &&
          !camerasError &&
          cameras &&
          cameras.length > 0 &&
          cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onClick={onCameraSelect}
            />
          ))}
      </div>

      {/* Pagination control */}
      {!camerasLoading && !camerasError && totalCameras > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          primaryColor={primaryColor}
          totalItems={totalCameras}
          itemsPerPage={camerasPerPage}
        />
      )}
    </div>
  );
};

export default CameraGrid;
