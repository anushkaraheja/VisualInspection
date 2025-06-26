import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiFilter, FiChevronDown } from 'react-icons/fi';
import useOrgTheme from 'hooks/useOrgTheme';
import { useRouter } from 'next/router';
import useHighRiskZones from 'hooks/useHighRiskZones';

// Interface for zone risk data
interface ZoneRiskData {
  id: string;
  name: string;
  location: string;
  violations: number;
  complianceRate: number;
}

// Mock data for high risk zones (fallback data)
const mockZoneData: ZoneRiskData[] = [
  {
    id: '1',
    name: 'North Zone',
    location: 'Main Building',
    violations: 28,
    complianceRate: 72,
  },
  {
    id: '2',
    name: 'South Zone',
    location: 'Main Building',
    violations: 35,
    complianceRate: 65,
  },
  {
    id: '3',
    name: 'East Zone',
    location: 'Warehouse',
    violations: 12,
    complianceRate: 88,
  },
  {
    id: '4',
    name: 'West Zone',
    location: 'Warehouse',
    violations: 42,
    complianceRate: 58,
  },
  {
    id: '5',
    name: 'Central Zone',
    location: 'Factory Floor',
    violations: 53,
    complianceRate: 47,
  },
  {
    id: '6',
    name: 'Entry Zone',
    location: 'Factory Floor',
    violations: 19,
    complianceRate: 81,
  },
  {
    id: '7',
    name: 'Loading Zone',
    location: 'Dispatch',
    violations: 37,
    complianceRate: 63,
  },
  {
    id: '8',
    name: 'Dock Zone',
    location: 'Dispatch',
    violations: 24,
    complianceRate: 76,
  },
  {
    id: '9',
    name: 'Assembly Zone',
    location: 'Production',
    violations: 31,
    complianceRate: 69,
  },
  {
    id: '10',
    name: 'Testing Zone',
    location: 'Production',
    violations: 16,
    complianceRate: 84,
  },
];

// Get unique locations from zone data
const getLocations = (zoneData: ZoneRiskData[]): string[] => {
  const uniqueLocations = new Set<string>(
    zoneData.map((zone) => zone.location)
  );
  return ['All', ...Array.from(uniqueLocations)];
};

const HighRiskZones: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const { theme } = useOrgTheme(teamSlug);
  const primaryColor = theme?.primaryColor || '#16355D';

  // Use the API hook to fetch risk zone data
  const { zones, isLoading, isError } = useHighRiskZones(teamSlug);

  // Use real data from API if available, otherwise fall back to mock data
  const zoneData = zones.length > 0 ? zones : mockZoneData;

  // State for location filter
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [showLocationDropdown, setShowLocationDropdown] =
    useState<boolean>(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter zones based on location
  const filteredZones = React.useMemo(() => {
    if (locationFilter === 'All') {
      return zoneData;
    }
    return zoneData.filter((zone) => zone.location === locationFilter);
  }, [locationFilter, zoneData]);

  // Sort zones by compliance rate (lowest first)
  const sortedZones = React.useMemo(() => {
    return [...filteredZones].sort(
      (a, b) => a.complianceRate - b.complianceRate
    );
  }, [filteredZones]);

  // Get compliance color based on rate
  const getComplianceColor = (rate: number): string => {
    if (rate >= 85) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    if (rate >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 pb-10 dark:border-gray-700 bg-white dark:bg-surfaceColor shadow-sm h-[calc(100%-1px)]">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="font-medium text-[22px] leading-8 font-['Poppins'] text-gray-900 dark:text-textColor">
            High Risk Zones
          </h2>

          {/* Location filter dropdown */}
          <div className="relative" ref={locationDropdownRef}>
            <button
              className="flex items-center justify-between text-sm text-gray-600 dark:text-textColor border border-gray-200 dark:border-borderColor rounded-xl px-3 py-1.5 bg-[#F9F9F9] dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <FiFilter className="h-4 w-4 mr-1.5" />
              {locationFilter}
              <FiChevronDown className="ml-1.5 h-4 w-4" />
            </button>

            {showLocationDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                {getLocations(zoneData).map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      setLocationFilter(location);
                      setShowLocationDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Zones with high violation rates that need attention
        </p>
      </div>

      {/* Zone cards - fixed height with scrollbar */}
      <div className="h-[450px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 text-center">
            <h3 className="mt-2 text-sm font-medium text-red-800 dark:text-red-200">
              Error loading data
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              There was an error loading the zone data. Using fallback data
              instead.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {sortedZones.map((zone) => (
              <div
                key={zone.id}
                className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden w-full"
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="h-10 w-[2.5rem] rounded-full bg-[#1D62F0]/10 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <FiMapPin
                          size={5}
                          className="h-5 w-[1.25rem] text-gray-600 dark:text-gray-300"
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {zone.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {zone.location}
                        </p>

                        {/* Violations count */}
                        <div className="mt-1.5 flex items-center">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {zone.violations} violations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance percentage */}
                    <div className="text-right">
                      <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {zone.complianceRate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="bg-gray-200 dark:bg-gray-700 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-1.5 transition-all duration-500 ease-in-out"
                        style={{
                          width: `${zone.complianceRate}%`,
                          backgroundColor: primaryColor,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {sortedZones.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-8 text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                  No zones found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No zones match the current filter criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HighRiskZones;
