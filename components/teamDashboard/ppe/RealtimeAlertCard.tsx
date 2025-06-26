import React, { useState, useMemo } from 'react';
import RealtimeAlertTile from './RealtimeAlert';
import {
  FaHand,
  FaHelmetSafety,
  FaShirt,
  FaHeadSideMask,
  FaEarListen,
  FaBootstrap,
  FaGlasses,
} from 'react-icons/fa6';
import { ViolationStats } from 'hooks/useAlerts';

interface Alert {
  id: number;
  type: string;
  message?: string;
  location: string;
  user: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  resolved?: boolean;
  _originalId?: string; // Add optional field to store original ID
}

// PPE item icon mapping
const PPE_ICONS: Record<string, React.ReactNode> = {
  'Hard Hat': <FaHelmetSafety className="h-4 w-[1rem]" />,
  Vest: <FaShirt className="h-4 w-[1rem]" />,
  Gloves: <FaHand className="h-4 w-[1rem]" />,
  'Respiratory Mask': <FaHeadSideMask className="h-4 w-[1rem]" />,
  'Ear Protection': <FaEarListen className="h-4 w-[1rem]" />,
  'Steel-toe Boots': <FaBootstrap className="h-4 w-[1rem]" />,
  'Safety Glasses': <FaGlasses className="h-4 w-[1rem]" />,
};

// Reusable StatCircle component
interface StatCircleProps {
  value: number;
  color?: string;
  label?: string;
  icon?: React.ReactNode;
}

const StatCircle: React.FC<StatCircleProps> = ({
  value,
  color = 'bg-[#EAEAEA] dark:bg-gray-600',
  label,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`h-8 w-[2rem] rounded-full ${color} mb-1 flex items-center justify-center`}
        aria-label={label}
      >
        {icon &&
          React.cloneElement(icon as React.ReactElement, {
            className: 'h-4 w-[1rem] text-gray-600 dark:text-gray-300',
          })}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {value}
      </span>
    </div>
  );
};

interface RealtimeAlertCardProps {
  alerts: Alert[];
  onResolve: (id: number) => void;
  violationStats?: ViolationStats;
}

const RealtimeAlertCard: React.FC<RealtimeAlertCardProps> = ({
  alerts,
  onResolve,
  violationStats = {},
}) => {
  // Filter state
  const [alertFilter, setAlertFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // State to store resolved alerts
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);

  // Get the top 3 most common violations for the StatCircles
  const topViolations = useMemo(() => {
    return Object.entries(violationStats)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([item, count]) => ({ item, count }));
  }, [violationStats]);

  // Toggle filter dropdown
  const toggleFilterDropdown = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: string) => {
    setAlertFilter(filter);
    setIsFilterOpen(false);
  };

  // Handle resolving an alert
  const handleResolve = (id: number) => {
    const alertToResolve = alerts.find((alert) => alert.id === id);
    if (alertToResolve) {
      // Mark as resolved and add to resolved list
      const resolvedAlert = { ...alertToResolve, resolved: true };
      setResolvedAlerts((prev) => [resolvedAlert, ...prev]);
    }

    // Call the original onResolve function
    onResolve(id);
  };

  // Combine active and resolved alerts for display based on filter
  const getFilteredAlerts = () => {
    if (alertFilter === 'Resolved') {
      return resolvedAlerts;
    } else if (alertFilter === 'Active') {
      return alerts;
    } else {
      // "All" filter - show active alerts at the top, then resolved
      return [...alerts, ...resolvedAlerts];
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <div className="bg-white dark:bg-surfaceColor border border-gray-200 dark:border-gray-700 overflow-hidden rounded-md">
      {/* Header with title, subtitle, and filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          {/* Title with Tailwind font styling instead of precise values */}
          <h2 className="font-medium text-[22px] leading-8 font-['Poppins'] text-gray-900 dark:text-textColor">
            Real-time Alerts
          </h2>

          {/* Subheading */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
            PPE compliance violations detected in the last hour
          </p>

          {/* Filter and Missing indicators in a row - aligned horizontally */}
          <div className="flex items-center gap-10 w-full justify-between">
            {/* Filter Dropdown */}
            <div className="relative w-full">
              <button
                className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-textColor border border-gray-200 dark:border-borderColor rounded-xl px-3 py-1.5 bg-[#F9F9F9] dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={toggleFilterDropdown}
              >
                {alertFilter}
                <svg
                  className="ml-2 h-4 w-[1rem] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-full rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <button
                    onClick={() => handleFilterSelect('All')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterSelect('Active')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Active only
                  </button>
                  <button
                    onClick={() => handleFilterSelect('Resolved')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Resolved only
                  </button>
                  <button
                    onClick={() => handleFilterSelect('High')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    High priority
                  </button>
                  <button
                    onClick={() => handleFilterSelect('Medium')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Medium priority
                  </button>
                  <button
                    onClick={() => handleFilterSelect('Low')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Low priority
                  </button>
                </div>
              )}
            </div>

            {/* Missing indicators - aligned with filter dropdown */}
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Missing:
              </div>
              <div className="flex space-x-4">
                {topViolations.length > 0 ? (
                  topViolations.map((violation, index) => (
                    <StatCircle
                      key={index}
                      value={violation.count}
                      label={`${violation.item} missing`}
                      icon={PPE_ICONS[violation.item] || <FaHelmetSafety />}
                    />
                  ))
                ) : (
                  <>
                    <StatCircle
                      value={0}
                      label="No violations"
                      icon={<FaHelmetSafety />}
                    />
                    <StatCircle
                      value={0}
                      label="No violations"
                      icon={<FaShirt />}
                    />
                    <StatCircle
                      value={0}
                      label="No violations"
                      icon={<FaHand />}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert list with both active and resolved items */}
      <ul className="p-2 space-y-2 bg-white dark:bg-surfaceColor max-h-[600px] overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <RealtimeAlertTile
              key={alert.id}
              alert={alert}
              onResolve={handleResolve}
            />
          ))
        ) : (
          <li className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            No alerts to display
          </li>
        )}
      </ul>
    </div>
  );
};

export default RealtimeAlertCard;
