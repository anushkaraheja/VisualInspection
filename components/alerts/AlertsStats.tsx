import React from 'react';
import { ViolationStats } from 'hooks/useAlerts';

interface AlertsStatsProps {
  stats: ViolationStats;
  isLoading: boolean;
  primaryColor?: string | null;
}

export const AlertsStats: React.FC<AlertsStatsProps> = ({ stats, isLoading, primaryColor }) => {
  // Filter out special stats keys like _statusCounts that shouldn't be rendered directly
  const filteredStats = Object.entries(stats).filter(([key]) => !key.startsWith('_'));
  
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading ? (
        <div className="col-span-full py-4 text-center text-gray-500 dark:text-gray-400">Loading statistics...</div>
      ) : filteredStats.length === 0 ? (
        <div className="col-span-full py-4 text-center text-gray-500 dark:text-gray-400">
          No violations found.
        </div>
      ) : (
        filteredStats.map(([key, count]) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border-l-4"
            style={{ borderLeftColor: primaryColor || '#16355D' }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {key}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {count}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
