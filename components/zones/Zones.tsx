import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { WithLoadingAndError } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useCanAccess from 'hooks/useCanAccess';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import { ImPencil } from 'react-icons/im';
import { MdDeleteOutline } from 'react-icons/md';
import { BsDeviceSsd, BsCameraVideo } from 'react-icons/bs';
import useLocations from 'hooks/useLocationHooks';
import useZones from 'hooks/useZones';
import { useAllLocationZones } from '@/components/teamDashboard/liveMonitoring/hooks';
import LocationSelect from './LocationSelect';
import Link from 'next/link';

// Define Zone type similar to the one in zoneService
interface Zone {
  id: string;
  name: string;
  description?: string | null; // Updated to accept null values as well
  locationId: string;
  createdAt: string;
  updatedAt: string;
  devices?: any[];
  locationName?: string;
}

const Zones = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useTranslation('common');

  const {
    locations,
    isLoading: isLocationsLoading,
    isError: isLocationsError,
  } = useLocations(slug as string);
  const {
    allZones: zones,
    isLoading: isZonesLoading,
    error: zonesError,
  } = useAllLocationZones(slug as string);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  const { canAccess } = useCanAccess();
  const isAccessible = canAccess('location', ['update']);

  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const handleAddZone = () => {
    // Navigate to the new zone page
    router.push(`/teams/${slug}/zones/new`);
  };

  const handleEditZone = (zone: Zone) => {
    // Navigate to the edit zone page
    router.push(`/teams/${slug}/zones/${zone.id}/edit`);
  };

  const handleDeleteZone = async (zone: Zone) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        const response = await fetch(
          `/api/teams/${slug}/locations/${zone.locationId}/zones/${zone.id}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          console.log('Zone deleted successfully');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to delete zone');
        }
      } catch (error) {
        console.error('Error deleting zone:', error);
      }
    }
  };

  const navigateToDevices = (zone: Zone) => {
    router.push(
      `/teams/${slug}/devices?location=${zone.locationId}&zone=${zone.id}`
    );
  };

  const navigateToLiveMonitoring = (zone: Zone) => {
    if (zone.devices && zone.devices.length > 0) {
      // Navigate to first device in the zone
      router.push({
        pathname: `/teams/${slug}/live-monitoring`,
        query: { device: zone.devices[0].id },
      });
    } else {
      // If no devices, just show an alert
      alert('This zone has no devices to view');
    }
  };

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.description &&
        zone.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (zone.locationName &&
        zone.locationName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation =
      !locationFilter || zone.locationId === locationFilter;

    return matchesSearch && matchesLocation;
  });

  const groupedZones =
    locations?.reduce(
      (acc, location) => {
        acc[location.id] = filteredZones.filter(
          (zone) => zone.locationId === location.id
        );
        return acc;
      },
      {} as Record<string, Zone[]>
    ) || {};

  const customLocationDropdown = (
    <div className="relative w-full sm:w-48">
      <select
        className="bg-[#F9F9F9] dark:bg-surfaceColor border border-[#EFEFF4] dark:border-borderColor rounded-lg w-full opacity-100 block appearance-none px-4 py-2 pr-8 leading-tight focus:outline-none focus:shadow-none"
        value={locationFilter || ''}
        onChange={(e) => setLocationFilter(e.target.value)}
      >
        <option value="">All Locations</option>
        {locations?.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name} ({groupedZones[location.id]?.length || 0})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-textColor">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4"
        >
          <path
            fillRule="evenodd"
            d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );

  return (
    <WithLoadingAndError
      isLoading={isLocationsLoading || isZonesLoading}
      error={zonesError || isLocationsError}
    >
      <div className="space-y-3 h-full flex flex-col py-5 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-none tracking-tight font-montserrat">
              Zones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage zones across all locations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex justify-center items-center h-10 bg-white dark:bg-surfaceColor rounded-md w-full sm:w-auto">
              <MagnifyingGlassIcon className="h-5 text-center text-gray-400 dark:text-textColor ml-3" />
              <input
                type="search"
                placeholder="Search zones"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input border-0 input-xs h-full px-3 text-sm placeholder:font-poppins placeholder:text-sm placeholder:dark:text-textColor focus:border-0 active:border-0 focus:outline-none w-full sm:w-60 dark:bg-surfaceColor dark:text-textColor"
              />
            </div>

            {isAccessible && (
              <ButtonFromTheme
                className={`rounded-md text-white font-normal px-4 sm:px-8 h-10 flex items-center justify-center`}
                onClick={handleAddZone}
              >
                + Add New Zone
              </ButtonFromTheme>
            )}
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-grow max-h-[calc(100vh-220px)]">
          <div className="min-w-full md:w-auto">
            <Table
              heading={
                locationFilter
                  ? `Zones in ${locations?.find((l) => l.id === locationFilter)?.name || 'Selected Location'}`
                  : 'All Zones'
              }
              cols={[
                'Zone Name',
                'Description',
                'Location',
                'Device Count',
                'Actions',
              ]}
              body={filteredZones.map((zone) => {
                return {
                  id: zone.id,
                  cells: [
                    {
                      wrap: false,
                      element: (
                        <div className="flex items-center justify-start space-x-2">
                          <Link
                            href={`/teams/${slug}/zones/${zone.id}/view`}
                            className="underline max-w-[150px] truncate hover:text-blue-600"
                            title={zone.name}
                          >
                            {zone.name}
                          </Link>
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      element: (
                        <div
                          className="max-w-[250px] truncate"
                          title={zone.description ?? ''} // Convert null to empty string
                        >
                          {zone.description || '-'}
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      text: zone.locationName || '-',
                    },
                    {
                      wrap: false,
                      text: String(zone.devices?.length || 0),
                    },
                    {
                      wrap: false,
                      actions: [
                        {
                          text: t('View Cameras'),
                          icon: (
                            <BsCameraVideo className="text-[#606060] dark:text-textColor text-l" />
                          ),
                          onClick: () => navigateToLiveMonitoring(zone),
                        },
                        {
                          text: t('View Devices'),
                          icon: (
                            <BsDeviceSsd className="text-[#606060] dark:text-textColor text-l" />
                          ),
                          onClick: () => navigateToDevices(zone),
                        },
                        {
                          text: t('Edit Zone'),
                          icon: (
                            <ImPencil className="text-[#606060] dark:text-textColor text-l ml-1" />
                          ),
                          onClick: () => handleEditZone(zone),
                        },
                        {
                          text: t('Delete Zone'),
                          icon: (
                            <MdDeleteOutline className="text-[#606060] dark:text-textColor text-l ml-1" />
                          ),
                          onClick: () => handleDeleteZone(zone),
                        },
                      ],
                    },
                  ],
                };
              })}
              showDropdown={false} // Hide the default dropdown
              customDropdown={customLocationDropdown} // Use our custom dropdown
            />
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
};

export default Zones;
