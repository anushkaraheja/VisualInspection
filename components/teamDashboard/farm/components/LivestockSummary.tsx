import React from 'react';
import DashboardCard from '../../../shared/DashboardCard';
import DashboardSection from '@/components/shared/DashboardSection';

interface SummaryProps {
  summaryData: {
    totalRecords: number;
    totalAnimals: number;
    avgConfidence: number;
    statusCounts: {
      pending: number;
      approved: number;
      rejected: number;
      modified: number;
    };
    typeCount: number;
  } | null;
  isLoading: boolean;
}

export const LivestockSummary: React.FC<SummaryProps> = ({ summaryData, isLoading }) => {
  if (isLoading || !summaryData) {
    return (
      <DashboardSection title='Overview'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-surfaceColor p-4 rounded-lg shadow-sm animate-pulse">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 h-12 w-12"></div>
                <div className="w-full">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title='Overview'>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        {/* Total Livestock */}
        <DashboardCard
          title="Total Livestock"
          value={summaryData.totalAnimals}
          icon={
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-300"
        />

        {/* Pending Review */}
        <DashboardCard
          title="Pending Review"
          value={summaryData.statusCounts.pending}
          icon={
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-300"
        />

        {/* Species */}
        <DashboardCard
          title="Species"
          value={summaryData.typeCount}
          icon={
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
          iconBgColor="bg-purple-100 dark:bg-purple-900"
          iconColor="text-purple-600 dark:text-purple-300"
        />

        {/* Average Confidence */}
        <DashboardCard
          title="Avg. Confidence"
          value={`${(summaryData.avgConfidence * 100).toFixed(1)}%`}
          icon={
            <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-300"
        />
      </div>

    </DashboardSection>
  );
};
