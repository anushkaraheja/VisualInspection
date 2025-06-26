import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MapView } from './MapView';
import { ZoneSelector } from './ZoneSelector';
import { useComplianceData } from 'hooks/useComplianceData';
import { useTenantAccess } from 'utils/tenantAccess';
import { WithLoadingAndError } from '../shared';

export const WarehouseMapComponent: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const { tenantType } = useTenantAccess();
  
  // Get warehouse name based on tenant type
  const getWarehouseName = (): string => {
    if (tenantType === 'PPE') return 'Warehouse';
    return 'Storage';
  };
  
  // Fetch compliance data to show on the map
  const { data: complianceData, isLoading, error } = useComplianceData(teamSlug);
  
  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {getWarehouseName()} Map
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Interactive map showing compliance status across different zones
            </p>
          </div>
        </div>
        
        {/* Zone Selector */}
        <div className="mb-6">
          <ZoneSelector 
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            teamSlug={teamSlug}
          />
        </div>
        
        {/* Map View */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <MapView 
            selectedZone={selectedZone} 
            complianceData={complianceData}
            isLoading={isLoading}
          />
        </div>
        
        {/* Compliance Legend */}
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Compliance Legend
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">High Compliance (90-100%)</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Medium Compliance (70-89%)</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Low Compliance (&lt;70%)</span>
            </div>
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
};
