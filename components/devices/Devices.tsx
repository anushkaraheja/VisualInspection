import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import Link from 'next/link';
import { Table } from '../shared/table/Table';
import { TableBodyType } from '../shared/table/TableBody';
import { useCamerasFiltered, useAllLocationZones } from '../teamDashboard/liveMonitoring/hooks';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { WithLoadingAndError } from '../shared';
import { DeviceStatus } from '@prisma/client';

const Devices: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [locationFilter, setLocationFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [isFilteringData, setIsFilteringData] = useState(false); // Add a new state to track filtering operations
  const itemsPerPage = 10;
  const router = useRouter();
  const { slug, location: locationParam, zone: zoneParam } = router.query;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the existing hook to fetch locations and zones
  const {
    allZones,
    locationsWithZones,
    isLoading: zonesLoading,
    error: zonesError
  } = useAllLocationZones(slug as string | undefined);

  // Apply location and zone filters from URL query parameters
  useEffect(() => {
    if (allZones?.length && (locationParam || zoneParam)) {
      // Find the location name if we have a location ID
      if (locationParam) {
        const locationObj = locationsWithZones?.find(loc => loc.locationId === locationParam);
        if (locationObj?.locationName) {
          setLocationFilter(locationObj.locationName);
        }
      }
      
      // Find the zone name if we have a zone ID
      if (zoneParam) {
        const zoneObj = allZones?.find(zone => zone.id === zoneParam);
        if (zoneObj?.name) {
          setZoneFilter(zoneObj.name);
        }
      }
    }
  }, [allZones, locationsWithZones, locationParam, zoneParam]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use the useCamerasFiltered hook to fetch cameras/devices with pagination
  const { 
    data: deviceData, 
    error: camerasError, 
    isLoading: camerasLoading 
  } = useCamerasFiltered(
    slug as string | undefined,
    allZones || [],
    locationFilter,
    zoneFilter,
    currentPage,
    itemsPerPage
  );

  // Get display text for the filter button
  const getFilterDisplayText = () => {
    if (locationFilter === 'All' && zoneFilter === 'All') {
      return 'All Devices';
    } else if (zoneFilter === 'All') {
      return `All in ${locationFilter}`;
    } else {
      return `${zoneFilter} ${locationFilter !== 'All' ? `(${locationFilter})` : ''}`;
    }
  };

  // Handle filter changes
  const handleFilterChange = (location: string, zone: string) => {
    setIsFilteringData(true); // Set filtering flag to true when filter changes
    setLocationFilter(location);
    setZoneFilter(zone);
    setCurrentPage(1); // Reset to first page when filter changes
    
    // Update URL query parameters
    const query: any = { slug };
    
    // Find location ID if needed
    if (location !== 'All') {
      const locationObj = locationsWithZones?.find(loc => loc.locationName === location);
      if (locationObj?.locationId) {
        query.location = locationObj.locationId;
      }
    }
    
    // Find zone ID if needed
    if (zone !== 'All') {
      const zoneObj = allZones?.find(z => z.name === zone && 
        (location === 'All' || z.locationId === query.location));
      if (zoneObj?.id) {
        query.zone = zoneObj.id;
      }
    }
    
    // Update URL without reloading page
    router.push(
      {
        pathname: router.pathname,
        query
      },
      undefined,
      { shallow: true }
    ).then(() => {
      // Reset filtering flag after URL is updated and data should be loaded
      setTimeout(() => setIsFilteringData(false), 100);
    });
  };

  // Map camera/device data to the format expected by the Table component
  const formatDevicesForTable = (): TableBodyType[] => {
    if (!deviceData?.data) return [];

    return deviceData.data.map((device) => ({
      id: device.id,
      cells: [
        { text: device.name },
        { text: typeof device.zone === 'string' ? device.zone : device.zone?.name || 'N/A' },
        { text: typeof device.location === 'string' ? device.location : device.location?.name || 'N/A' },
        { text: device.ipAddress || 'N/A' },
        {
          badge: {
            text: device.status.toUpperCase(),
            color: device.status === DeviceStatus.ONLINE ? 'success' : 'error'
          }
        },
        {
          buttons: [
            {
              text: 'View',
              onClick: () => router.push(`/teams/${slug}/devices/${device.id}`)
            },
            {
              text: 'Edit',
              onClick: () => router.push(`/teams/${slug}/devices/${device.id}/edit`)
            }
          ]
        }
      ]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Ensure locationsWithZones is always an array
  const safeLocationsWithZones = Array.isArray(locationsWithZones) ? locationsWithZones : [];

  // Include location in the table columns
  const tableColumns = ['Name', 'Zone', 'Location', 'IP Address', 'Status', 'Actions'];
  
  const tableHeading = (
    <div className="flex w-full items-center justify-between">
      <h2 className="text-md font-normal">All Devices</h2>
    </div>
  );

  const tableDropDown = (
    <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <div className="flex items-center">
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>{getFilterDisplayText()}</span>
            </div>
            <FiChevronDown
              className={`ml-2 h-4 w-4 text-gray-500 transform transition-transform duration-150 ${showFilterDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20">
              <div className="max-h-96 overflow-y-auto py-1">
                {/* All Devices option */}
                <button
                  onClick={() => {
                    handleFilterChange('All', 'All');
                    setShowFilterDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm ${
                    locationFilter === 'All' && zoneFilter === 'All'
                      ? 'bg-gray-100 dark:bg-gray-700 text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All Devices
                </button>

                {safeLocationsWithZones.length > 0 && (
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                )}

                {/* Location and Zone options */}
                {safeLocationsWithZones.map((location) => (
                  <div key={location.locationId || 'unknown'}>
                    {/* Location header - shows all devices in this location */}
                    <button
                      onClick={() => {
                        handleFilterChange(location.locationName || 'Unknown', 'All');
                        setShowFilterDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm font-medium ${
                        locationFilter === location.locationName &&
                        zoneFilter === 'All'
                          ? 'bg-gray-100 dark:bg-gray-700 text-primary'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {location.locationName || 'Unknown Location'}
                    </button>

                    {/* Zone options within this location - only show if zones exist */}
                    {Array.isArray(location.zones) &&
                      location.zones.length > 0 && (
                        <div className="pl-4">
                          {location.zones.map((zone) => (
                            <button
                              key={zone.id || 'unknown'}
                              onClick={() => {
                                handleFilterChange(
                                  location.locationName || 'Unknown',
                                  zone.name || 'Unknown'
                                );
                                setShowFilterDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                locationFilter === location.locationName &&
                                zoneFilter === zone.name
                                  ? 'bg-gray-100 dark:bg-gray-700 text-primary'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {zone.name || 'Unknown Zone'}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Add separator between locations unless it's the last one */}
                    {location !==
                      safeLocationsWithZones[
                        safeLocationsWithZones.length - 1
                      ] && (
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                    )}
                  </div>
                ))}

                {/* Show message if no locations or zones are available */}
                {safeLocationsWithZones.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No locations found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  )

  const totalPages = deviceData?.meta?.totalPages || 1;
  const devices = deviceData?.data || [];

  return (
    <WithLoadingAndError
          isLoading={zonesLoading || camerasLoading}
          error={zonesError || camerasError}
        >
    <div className="space-y-3 h-full flex flex-col py-5 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Devices</h1>
        <Link href={`/teams/${slug}/devices/new`} passHref>
          <ButtonFromTheme>Add Device</ButtonFromTheme>
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="bg-white dark:bg-surfaceColor p-8 rounded-lg shadow-sm text-center border dark:border-borderColor">
          <h2 className="text-xl font-medium mb-4">No devices found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding your first device to monitor your equipment.
          </p>
          <Link href={`/teams/${slug}/devices/new`} passHref>
            <ButtonFromTheme>Add Your First Device</ButtonFromTheme>
          </Link>
        </div>
      ) : (
        <Table
          heading={tableHeading}
          cols={tableColumns}
          body={formatDevicesForTable()}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          showDropdown={false}
          customDropdown={tableDropDown}
        />
      )}
    </div>

    </WithLoadingAndError>
  );
};

export default Devices;
