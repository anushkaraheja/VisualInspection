import React, { useState, useEffect, useRef } from 'react';
import { FiFilter, FiChevronDown, FiMapPin, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { RepeatOffender, useRepeatOffenders } from 'hooks/useRepeatOffenders';

const RepeatOffenders: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;

  // State for sorting - change 'department' to 'location'
  const [sortBy, setSortBy] = useState<
    'violations' | 'lastViolation' | 'name' | 'location' | 'riskLevel'
  >('violations');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Use the hook to get data from API
  const {
    data: offenders,
    isLoading,
    error,
  } = useRepeatOffenders(teamSlug, {
    minViolations: 5, // Lower threshold for better results
    limit: 5,
    sortBy,
    sortOrder,
  });

  // Reference for dropdown
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle sort selection
  const handleSortSelect = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setShowSortDropdown(false);
  };

  // Function to get risk level badge color
  const getRiskBadgeColor = (riskLevel: RepeatOffender['riskLevel']) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30';
    }
  };

  // Function to get violation severity class
  const getViolationSeverityClass = (violations: number) => {
    if (violations >= 7)
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    if (violations >= 4)
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
  };

  // Format date safely
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Unknown date';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 pb-10 dark:border-gray-700 bg-white dark:bg-surfaceColor shadow-sm h-[calc(100%-1px)]">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="font-medium text-[22px] leading-8 font-['Poppins'] text-gray-900 dark:text-textColor">
            Repeat Offenders
          </h2>

          {/* Sort dropdown with updated text - changed "Department" to "Zone (Location)" */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              className="flex items-center justify-between text-sm text-gray-600 dark:text-textColor border border-gray-200 dark:border-borderColor rounded-xl px-3 py-1.5 bg-[#F9F9F9] dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <FiFilter className="h-4 w-4 mr-1.5" />
              {sortBy === 'location'
                ? 'Zone (Location)'
                : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              <FiChevronDown className="ml-1.5 h-4 w-4" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <button
                  onClick={() => handleSortSelect('violations')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Violations{' '}
                  {sortBy === 'violations' &&
                    (sortOrder === 'desc' ? '(High-Low)' : '(Low-High)')}
                </button>
                <button
                  onClick={() => handleSortSelect('lastViolation')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Last Violation{' '}
                  {sortBy === 'lastViolation' &&
                    (sortOrder === 'desc' ? '(Recent)' : '(Oldest)')}
                </button>
                <button
                  onClick={() => handleSortSelect('name')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Name{' '}
                  {sortBy === 'name' &&
                    (sortOrder === 'desc' ? '(Z-A)' : '(A-Z)')}
                </button>
                <button
                  onClick={() => handleSortSelect('location')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Zone (Location){' '}
                  {sortBy === 'location' &&
                    (sortOrder === 'desc' ? '(Z-A)' : '(A-Z)')}
                </button>
                <button
                  onClick={() => handleSortSelect('riskLevel')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Risk Level{' '}
                  {sortBy === 'riskLevel' &&
                    (sortOrder === 'desc' ? '(High-Low)' : '(Low-High)')}
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Employees with multiple PPE compliance violations
        </p>
      </div>

      {/* Offenders list - fixed height with scrollbar */}
      <div className="h-[450px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
              >
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offenders list */}
        {!isLoading && offenders && offenders.length > 0 && (
          <div className="flex flex-col space-y-3">
            {offenders.map((offender) => (
              <div
                key={offender.id}
                className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden w-full"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="h-10 w-[2.5rem] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        {offender.employeeId.charAt(0)}
                      </span>
                    </div>

                    {/* Info section with employee ID as heading */}
                    <div className="flex-1">
                      {/* Employee ID as heading */}
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {offender.employeeId}
                      </h4>

                      {/* Zone on separate line with icon */}
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <FiMapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>
                          {offender.zone} ({offender.locationName})
                        </span>
                      </div>

                      {/* Last violation on separate line with icon */}
                      <div className="flex items-center text-xs font-medium mt-1.5">
                        <FiCalendar className="h-3 w-3 mr-1 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        <div>
                          <span className="text-gray-800 dark:text-gray-200">
                            {formatDate(offender.lastViolation)}
                          </span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {offender.lastViolationType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Violations flag on right side */}
                  <div className="flex flex-col items-end">
                    <div
                      className={`
                      px-2.5 py-1 rounded-md text-sm font-medium
                      ${getViolationSeverityClass(offender.violations)}
                    `}
                    >
                      {offender.violations} violations
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no results are found */}
        {!isLoading && (!offenders || offenders.length === 0) && (
          <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-8 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
              No offenders found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are currently no repeat offenders to display.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepeatOffenders;
