import React from 'react';

interface VendorHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  actionLabel: string;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ title, subtitle, onBack, actionLabel }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] px-8 py-4 mb-4">
      <div className="mb-4 md:mb-0">
        <h1 className="text-[#16355D] dark:text-white text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-[#5E6C84] dark:text-gray-300 text-sm md:text-base max-w-xl">
          {subtitle}
        </p>
      </div>
      <button
        onClick={onBack}
        className="text-[#16355D] dark:text-gray-300 text-sm font-medium hover:underline focus:outline-none"
      >
        {actionLabel}
      </button>
    </div>
  );
};

export default VendorHeader;
