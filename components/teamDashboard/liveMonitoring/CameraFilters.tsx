import React, { useState, useEffect, useRef } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { LocationWithZones } from './types';

interface CameraFiltersProps {
  locationFilter: string;
  zoneFilter: string;
  locationsWithZones: LocationWithZones[];
  onFilterChange: (locationFilter: string, zoneFilter: string) => void;
}

const CameraFilters: React.FC<CameraFiltersProps> = ({
  locationFilter,
  zoneFilter,
  locationsWithZones,
  onFilterChange,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get display text for the filter button
  const getFilterDisplayText = () => {
    if (locationFilter === 'All' && zoneFilter === 'All') {
      return 'All Cameras';
    } else if (zoneFilter === 'All') {
      return `All in ${locationFilter}`;
    } else {
      return `${zoneFilter} ${locationFilter !== 'All' ? `(${locationFilter})` : ''}`;
    }
  };

  // Ensure locationsWithZones is always an array
  const safeLocationsWithZones = Array.isArray(locationsWithZones)
    ? locationsWithZones
    : [];

  return (
    <div className="mb-6 flex justify-between items-center">
      <h3 className="text-2xl leading-6 font-semibold text-black dark:text-textColor">
        Camera Monitoring
        <span className="block mt-1 text-sm font-normal text-gray-500 dark:text-textColor">
          Live feed from all connected cameras
        </span>
      </h3>
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
              {/* All Cameras option */}
              <button
                onClick={() => {
                  onFilterChange('All', 'All');
                  setShowFilterDropdown(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm ${
                  locationFilter === 'All' && zoneFilter === 'All'
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary font-medium'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                All Cameras
              </button>

              {safeLocationsWithZones.length > 0 && (
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
              )}

              {/* Location and Zone options */}
              {safeLocationsWithZones.map((location) => (
                <div key={location.locationId || 'unknown'}>
                  {/* Location header - shows all cameras in this location */}
                  <button
                    onClick={() => {
                      onFilterChange(location.locationName || 'Unknown', 'All');
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
                              onFilterChange(
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
  );
};

export default CameraFilters;
