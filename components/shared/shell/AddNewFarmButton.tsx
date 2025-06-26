import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-daisyui';
import { useRouter } from 'next/router';
import useColors from 'hooks/useColors';

const AddNewLocationButton = () => {
  const router = useRouter();
  const { primaryColor, secondaryColor } = useColors();
  const [bgColor, setBgColor] = useState(primaryColor || '#6E00FF');
  const [iconColor, setIconColor] = useState('text-textColor');

  const { slug } = router.query;

  useEffect(() => {
    if (primaryColor && secondaryColor) {
      setBgColor(primaryColor);
    }
  }, [primaryColor]);

  const handleAddLocation = () => {
    router.push(`/teams/${slug}/locations/new`);
  };

  const handleMouseEnter = () => {
    setBgColor(secondaryColor || '#BC2023');
    setIconColor(secondaryColor || 'red');
  };

  const handleMouseLeave = () => {
    setBgColor(primaryColor || '#6E00FF');
    setIconColor('text-textColor');
  };

  return (
    /* eslint-disable i18next/no-literal-string */
    <Button
      onClick={handleAddLocation}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex justify-start items-center shadow-inner border-radius-6 opacity-100 dark:border-borderColor dark:text-textColor hover:text-white hover:shadow-[inset_0px_1px_2px_#0000000F] group"
      style={{ backgroundColor: bgColor }}
    >
      <span
        className="flex items-center text-center font-poppins justify-center w-6 h-6 rounded-full bg-backgroundColor dark:bg-backgroundColor dark:text-textColor"
        style={{ color: iconColor }}
      >
        <PlusIcon className="h-3" />
      </span>
      <span className="ml-2 font-light text-sm text-white dark:text-textColor font-poppins">
        Add New Location
      </span>
    </Button>
    /* eslint-disable i18next/no-literal-string */
  );
};

export default AddNewLocationButton;
