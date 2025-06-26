import React, { useState, useEffect, useRef } from 'react';
import useOrgTheme from 'hooks/useOrgTheme';
import { useRouter } from 'next/router';
import DashboardHeader from '../../shared/DashboardHeader';
import SystemIntegrationsCard from './SystemIntegrations';
import CameraStatusCard from './CameraStatus';
import ViolationAnalysis from './ViolationAnalysis';
import RealtimeAlertCard from './RealtimeAlertCard';
import ComplianceOverview, {
  ComplianceData as UIComplianceData,
} from '../../shared/ComplianceOverview';
import {
  useComplianceData,
  ComplianceData,
} from 'hooks/useComplianceData';
import { useTeamPPEItems } from 'hooks/useTeamPPEItems';
import { useAlerts, useResolveAlert } from 'hooks/useAlerts';
import { useTrends } from 'hooks/useTrends';
import { useSystemStatus } from 'hooks/useSystemStatus';

const PPEDashboard: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const { theme } = useOrgTheme(teamSlug);
  const primaryColor = theme?.primaryColor || '#16355D';

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [trendFilter, setTrendFilter] = useState<string>('All');
  const [showTrendFilter, setShowTrendFilter] = useState<boolean>(false);

  // Fetch compliance data from API with selectedDate
  const {
    data: apiComplianceData,
    error: complianceError,
    isLoading: complianceLoading,
  } = useComplianceData(teamSlug, selectedDate);

  // Get active team PPE items using the new hook
  const { teamPPEItems, isLoading: ppeItemsLoading } =
    useTeamPPEItems(teamSlug);

  // Transform API data format to match UI component requirements
  const transformedComplianceData: UIComplianceData | undefined =
    React.useMemo(() => {
      if (!apiComplianceData) {
        // Return empty but valid compliance data structure when api data is undefined
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
        : ['Not Active']; // Default items if team data is empty

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

  // Get alerts data from the updated API
  const {
    alerts: apiAlerts,
    stats: violationStats,
    error: alertsError,
    isLoading: alertsLoading,
    mutate: reloadAlerts,
  } = useAlerts(teamSlug);

  // Generate a unique numeric ID for each alert
  let numericId = 1;

  // Convert the new API alerts format to the legacy format for UI compatibility
  // Ensure numeric IDs for compatibility with RealtimeAlertCard
  const alerts = apiAlerts
    ? apiAlerts.map((alert) => ({
        id: numericId++, // Use incrementing numeric ID
        type: `Missing PPE: ${alert.violations.join(', ')}`, // More descriptive type instead of generic "ppe_violation"
        message: `Worker failed to wear required safety items: ${alert.violations.join(', ')}`,
        location: `${alert.zone}, ${alert.location}`,
        user: alert.workerId,
        time: new Date(alert.timestamp).toLocaleTimeString(),
        severity: getSeverityFromViolations(alert.violations),
        _originalId: alert.id, // Store original ID for reference
      }))
    : [];

  // Create a mapping of numeric IDs to original string IDs
  const idMapping = new Map<number, string>();
  apiAlerts?.forEach((alert, index) => {
    idMapping.set(index + 1, alert.id);
  });

  // Helper function to determine severity based on violation count
  function getSeverityFromViolations(
    violations: string[]
  ): 'low' | 'medium' | 'high' {
    if (violations.length >= 3) return 'high';
    if (violations.length === 2) return 'medium';
    return 'low';
  }

  const resolveAlertFromAPI = useResolveAlert(teamSlug);
  useTrends(teamSlug, 'week');
  useSystemStatus(teamSlug);

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // No need to manually refetch as the useComplianceData will automatically refetch
    // when the selectedDate changes
  };

  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleResolveAlert = (id: number) => {
    // Find the original string ID from our mapping
    const originalId = idMapping.get(id);

    if (!originalId) {
      console.error(`Could not find original ID for numeric ID ${id}`);
      return;
    }

    // Update local state to remove the resolved alert
    if (alerts) {
      const updatedAlerts = alerts.filter((alert) => alert.id !== id);

      // Find the API alert with this original ID
      const apiUpdatedAlerts = apiAlerts.filter(
        (alert) => alert.id !== originalId
      );

      // Optimistically update the UI with correct type including stats
      reloadAlerts(
        {
          alerts: apiUpdatedAlerts,
          total: apiUpdatedAlerts.length,
          limit: 10,
          offset: 0,
          stats: violationStats, // Include stats property to match AlertsResponse type
        },
        false
      );

      // Call the legacy API handler
      fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
      }).catch((error) => {
        console.error('Error resolving alert (legacy):', error);
        // On error, revert the optimistic update
        reloadAlerts();
      });

      // Call the new API handler with the original string ID
      resolveAlertFromAPI(originalId).then((success) => {
        console.log(
          `Team API resolve alert result: ${success ? 'success' : 'failed'}`
        );
      });
    }
  };

  const handleTrendFilterSelect = (filter: string) => {
    setTrendFilter(filter);
    setShowTrendFilter(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !event.target ||
        !(event.target as Element).closest('.trend-filter-container')
      ) {
        setShowTrendFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update loading state to include PPE items loading
  const isLoading = complianceLoading || alertsLoading || ppeItemsLoading;

  return (
    <div className="bg-gray-100 dark:bg-backgroundColor min-h-screen relative">
      <DashboardHeader
        title="PPE Compliance Dashboard"
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
            activePpeItems: []
          }}
          isLoading={isLoading}
          primaryColor={primaryColor}
          teamSlug={teamSlug}
          selectedDate={selectedDate}
        />

        <div className="mb-4">
          <div className="px-4 py-2 sm:px-1 border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl leading-6 font-semibold text-black dark:text-textColor">
                Trends
              </h3>

              <div className="relative trend-filter-container">
                <button
                  className="flex items-center justify-between text-sm text-gray-600 dark:text-textColor border border-gray-200 dark:border-borderColor rounded-xl px-3 py-1.5 bg-[#F9F9F9] dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowTrendFilter(!showTrendFilter)}
                >
                  {trendFilter}
                  <svg
                    className="ml-2 h-4 w-[1rem] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showTrendFilter && (
                  <div className="absolute right-0 mt-2 w-[10rem] rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <button
                      onClick={() => handleTrendFilterSelect('All')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleTrendFilterSelect('Weekly')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => handleTrendFilterSelect('Monthly')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleTrendFilterSelect('Quarterly')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Quarterly
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-textColor">
              Smart insight of current performance of your work
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-3">
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4">
            <div className="mb-3">
              <ViolationAnalysis teamSlug={teamSlug} />
            </div>

            <div className="mb-3">
              <CameraStatusCard teamSlug={teamSlug} />
            </div>

            <div className="mb-3">
              <SystemIntegrationsCard teamSlug={teamSlug} />
            </div>
          </div>

          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2 mb-3">
            <RealtimeAlertCard
              alerts={alerts || []}
              onResolve={handleResolveAlert}
              violationStats={violationStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPEDashboard;
