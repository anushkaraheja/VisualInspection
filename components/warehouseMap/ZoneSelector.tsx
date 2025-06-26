import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

interface Zone {
  id: string;
  name: string;
}

interface ZoneSelectorProps {
  selectedZone: string | null;
  onZoneChange: (zoneId: string | null) => void;
  teamSlug: string;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  selectedZone,
  onZoneChange,
  teamSlug,
}) => {
  // Fetch zones for the team
  const { data, error, isLoading } = useSWR<{data: Zone[]}>(
    teamSlug ? `/api/teams/${teamSlug}/zones` : null,
    fetcher
  );
  
  const zones = data?.data || [];
  
  return (
    <div>
      <label htmlFor="zone-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select Zone
      </label>
      <div className="flex gap-2">
        <select
          id="zone-selector"
          value={selectedZone || ''}
          onChange={(e) => onZoneChange(e.target.value || null)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isLoading}
        >
          <option value="">All Zones</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onZoneChange(null)}
          className="mt-1 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
        >
          Reset
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Error loading zones: {error.message}
        </p>
      )}
    </div>
  );
};
