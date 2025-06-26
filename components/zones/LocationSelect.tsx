import React from 'react';

interface Location {
  id: string;
  name: string;
}

interface LocationSelectProps {
  locations: Location[];
  selectedLocationId: string;
  onChange: (locationId: string) => void;
  className?: string;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  locations,
  selectedLocationId,
  onChange,
  className = '',
}) => {
  return (
    <select
      className={`w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md ${className}`}
      value={selectedLocationId}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a location</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name}
        </option>
      ))}
    </select>
  );
};

export default LocationSelect;
