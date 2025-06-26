import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';
import { Loading } from '@/components/shared';
import { LocationWithAnimalsAndZonesAndVendors } from 'hooks/useLocationHooks';

interface LocationsSectionProps {
  formik: FormikProps<VendorFormData>;
  groupFieldClass: string;
  inputClass: string;
  locations: LocationWithAnimalsAndZonesAndVendors[] | undefined;
  selectedLocations: string[];
  setSelectedLocations: (locations: string[]) => void;
  isLoading: boolean;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({
  formik,
  groupFieldClass,
  inputClass,
  locations,
  selectedLocations,
  setSelectedLocations,
  isLoading
}) => {
  const handleToggleLocation = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedLocations([...selectedLocations, id]);
    } else {
      setSelectedLocations(selectedLocations.filter(locId => locId !== id));
    }
  };

  if (isLoading) {
    return (
      <div className={groupFieldClass}>
        <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
          Locations
        </h2>
        <Loading />
      </div>
    );
  }

  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Locations
      </h2>
      <p className="text-[#5E6C84] dark:text-gray-300 text-sm mb-4">
        Select one or more locations where this vendor operates
      </p>

      {locations && locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(location => (
            <div key={location.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`location-${location.id}`}
                checked={selectedLocations.includes(location.id)}
                onChange={(e) => handleToggleLocation(location.id, e.target.checked)}
                className="h-4 w-4 text-[#16355D] dark:text-blue-400 focus:ring-[#16355D] dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor={`location-${location.id}`}
                className="text-[#16355D] dark:text-white"
              >
                {location.name}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-[#5E6C84] dark:text-gray-300">
            No locations available. Please create a location first before adding vendors.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationsSection;
