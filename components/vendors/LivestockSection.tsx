import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';
import { Loading } from '@/components/shared';

interface LivestockSectionProps {
  formik: FormikProps<VendorFormData>;
  groupFieldClass: string;
  livestockItems: string[];
  setLivestockItems: (items: string[]) => void;
  teamLivestockData: any[];
  isLoadingTeamLivestock: boolean;
}

const LivestockSection: React.FC<LivestockSectionProps> = ({
  formik,
  groupFieldClass,
  livestockItems,
  setLivestockItems,
  teamLivestockData,
  isLoadingTeamLivestock
}) => {
  const handleToggleLivestock = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setLivestockItems([...livestockItems, id]);
    } else {
      setLivestockItems(livestockItems.filter(item => item !== id));
    }
  };

  if (isLoadingTeamLivestock) {
    return (
      <div className={groupFieldClass}>
        <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
          Livestock Categories
        </h2>
        <Loading />
      </div>
    );
  }

  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Livestock Categories
      </h2>
      <p className="text-[#5E6C84] dark:text-gray-300 text-sm mb-4">
        Select the livestock categories this vendor supplies
      </p>

      {teamLivestockData && teamLivestockData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamLivestockData.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`livestock-${item.id}`}
                checked={livestockItems.includes(item.id)}
                onChange={(e) => handleToggleLivestock(item.id, e.target.checked)}
                className="h-4 w-4 text-[#16355D] dark:text-blue-400 focus:ring-[#16355D] dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor={`livestock-${item.id}`}
                className="text-[#16355D] dark:text-white"
              >
                {item.name}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-[#5E6C84] dark:text-gray-300">
            No livestock categories are available for your team. Please contact your administrator to add livestock categories.
          </p>
        </div>
      )}
    </div>
  );
};

export default LivestockSection;
