import React from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import { useTenantAccess } from 'utils/tenantAccess';

interface LocationHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  actionLabel?: string;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actionLabel = 'Back',
}) => {
  const { tenantType } = useTenantAccess();

  // Modify the title based on tenant type
  const getFormattedTitle = (originalTitle: string) => {
    // If the title contains "Location" (case-insensitive)
    if (originalTitle.toLowerCase().includes('location')) {
      if (tenantType === 'PPE') {
        return originalTitle.replace(/location/i, 'Facility');
      } else if (tenantType === 'Farm') {
        return originalTitle.replace(/location/i, 'Farm');
      }
    }
    return originalTitle;
  };

  return (
    <header className="flex justify-between">
      <div className="flex items-start">
        <button onClick={onBack} className="text-3xl text-[#5E6C84]">
          <IoIosArrowBack />
        </button>
        <div className="ml-2">
          <h1 className="text-2xl md:text-4xl font-semibold font-montserrat">
            {getFormattedTitle(title)}
          </h1>
          <p className="text-[#5E6C84]">{getFormattedTitle(subtitle)}</p>
        </div>
      </div>
    </header>
  );
};

export default LocationHeader;
