import React from 'react';
import { ComplianceData } from 'hooks/useComplianceData';

interface MapViewProps {
  selectedZone: string | null;
  complianceData: ComplianceData | undefined;
  isLoading: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedZone,
  complianceData,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-300">Loading map data...</p>
      </div>
    );
  }

  if (!complianceData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-300">No compliance data available to display on the map</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {/* Placeholder for actual map implementation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-300">
          Map view will be implemented here.<br />
          Overall compliance: {complianceData.overall.toFixed(1)}%<br />
          {selectedZone ? `Viewing Zone ID: ${selectedZone}` : 'Viewing all zones'}
        </p>
      </div>
      
      {/* Example zone display - to be replaced with actual map implementation */}
      <div className="absolute inset-0 p-8">
        <div className="grid grid-cols-3 gap-4 h-full">
          {Array.from({ length: 9 }).map((_, i) => {
            const compliance = Math.random() * 100;
            let bgColor = 'bg-red-500';
            if (compliance >= 90) {
              bgColor = 'bg-green-500';
            } else if (compliance >= 70) {
              bgColor = 'bg-yellow-500';
            }
            
            return (
              <div
                key={i}
                className={`${bgColor} bg-opacity-30 border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center`}
              >
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-white">Zone {i + 1}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{compliance.toFixed(1)}% compliant</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
