import React, { useState, useEffect } from 'react';
import ViolationAnalysis from '../ViolationAnalysis';
import RepeatOffenders from '../RepeatOffenders';
import HighRiskZones from '../HighRiskZones';
import useOrgTheme from 'hooks/useOrgTheme';
import { useRouter } from 'next/router';
import DashboardHeader from '@/components/shared/DashboardHeader';
import ComplianceOverview, {
  ComplianceData as UIComplianceData,
} from '@/components/shared/ComplianceOverview';
import {
  useComplianceData,
} from 'hooks/useComplianceData';
import { useTeamPPEItems } from 'hooks/useTeamPPEItems';

export const PPEAnalytics: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const { theme } = useOrgTheme(teamSlug);
  const primaryColor = theme?.primaryColor || '#16355D';
  
  // Add state for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch compliance data from API with selectedDate
  const {
    data: apiComplianceData,
    error: complianceError,
    isLoading: complianceLoading,
  } = useComplianceData(teamSlug, selectedDate);

  // Get active team PPE items using the hook - dynamic instead of hardcoded
  const { teamPPEItems, isLoading: ppeItemsLoading } = useTeamPPEItems(teamSlug);

  // Transform API data format to match UI component requirements - now fully dynamic
  const transformedComplianceData: UIComplianceData | undefined =
    React.useMemo(() => {
      if (!apiComplianceData) {
        return {
          overall: 0,
          ppeCompliance: {},
          activePpeItems: [],
        };
      }

      // Extract active PPE items from the team data
      const activeItems = teamPPEItems && teamPPEItems.length > 0
        ? teamPPEItems
            .filter((item) => item.active)
            .map((item) => item.ppeItem.name)
        : []; // Empty array if no team data

      // Create a dynamic mapping for all PPE items from the API response
      const ppeCompliance: Record<string, number> = {};

      // Map all PPE items from the API response - using a more comprehensive approach
      const complianceMapping: Record<string, string> = {
        'Hard Hat': 'hardHat',
        Vest: 'vest',
        'Safety Glasses': 'safetyGlasses',
        Gloves: 'gloves',
        'Ear Protection': 'earProtection',
        'Steel-toe Boots': 'steelToeBoots',
        'Respiratory Mask': 'respiratoryMask',
      };

      // Add available compliance data from the API
      activeItems.forEach((item) => {
        const apiField = complianceMapping[item];
        if (apiField && apiComplianceData[apiField] !== undefined) {
          ppeCompliance[item] = apiComplianceData[apiField];
        } else {
          console.warn(`No compliance data found for PPE item: ${item}`);
          ppeCompliance[item] = 0; // Default to 0 if data is missing
        }
      });

      // Map any additional PPE items that might be in the API response but not in the active items
      Object.entries(apiComplianceData).forEach(([key, value]) => {
        if (key !== 'overall' && typeof value === 'number') {
          // Find the display name for this field
          const displayName = Object.entries(complianceMapping).find(
            ([_, apiKey]) => apiKey === key
          )?.[0];

          if (displayName && !ppeCompliance[displayName]) {
            ppeCompliance[displayName] = value;
          }
        }
      });

      return {
        overall: apiComplianceData.overall || 0,
        ppeCompliance,
        // Ensure all active items from the team data are included
        activePpeItems:
          activeItems.length > 0 ? activeItems : Object.keys(ppeCompliance),
      };
    }, [apiComplianceData, teamPPEItems]);

  // Add state for current time
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Combined loading state
  const isLoading = complianceLoading || ppeItemsLoading;
  
  // Check if we have no data
  const hasNoData = !isLoading && apiComplianceData && apiComplianceData.overall === 0;

  return (
    <div className="bg-gray-100 dark:bg-backgroundColor min-h-screen relative">
      <DashboardHeader
        title="Analytics"
        primaryColor={primaryColor}
        showDatePicker={true}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        formattedDate={formatDateForDisplay(selectedDate)}
        currentTime={currentTime}
      />

      <div
        className="px-2 sm:px-3 lg:px-4 relative"
        style={{ marginTop: '-100px' }}
      >
        <ComplianceOverview
          complianceData={transformedComplianceData || {
            overall: 0,
            ppeCompliance: {},
            activePpeItems: [],
          }}
          isLoading={isLoading}
          primaryColor={primaryColor}
          teamSlug={teamSlug}
          selectedDate={selectedDate}
        />

        <div className="space-y-6">
          {hasNoData ? (
            <div className="bg-white dark:bg-surfaceColor shadow overflow-hidden rounded-md p-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No data available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No compliance data found for {selectedDate.toLocaleDateString()}
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date())}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    View Today's Data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-6">
                  <div className="px-4 py-2 sm:px-1">
                    <h3 className="text-2xl leading-6 font-semibold text-black dark:text-textColor">
                      PPE Compliance Trends
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-textColor">
                      Smart insight of current performance of your work
                    </p>
                  </div>
                  <div className="bg-white dark:bg-surfaceColor shadow overflow-hidden rounded-md p-6">
                    <ViolationAnalysis teamSlug={teamSlug} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <HighRiskZones />
                </div>
                <div>
                  <RepeatOffenders />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
