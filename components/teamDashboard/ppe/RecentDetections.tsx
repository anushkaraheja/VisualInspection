import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiFilter, FiChevronDown, FiImage } from 'react-icons/fi';
import { useRecentDetections } from 'hooks/useRecentDetections';
import { useRouter } from 'next/router';
import { Loading } from '../../shared';
import Image from 'next/image';

interface Detection {
  id: string;
  timestamp: Date;
  timeAgo: string;
  zone: string;
  camera: string;
  eventType: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  personId: string;
  imageUrl?: string; // Add imageUrl to the interface
}

const RecentDetections: React.FC = () => {
  // Get team slug from router
  const router = useRouter();
  const teamSlug = router.query.slug as string | undefined;

  // State for sorting
  const [sortBy, setSortBy] = useState<
    'time' | 'zone' | 'camera' | 'eventType' | 'severity'
  >('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // State for visible detection count
  const [visibleCount, setVisibleCount] = useState(5);

  // Fetch detection data from our custom hook
  const {
    data: detections,
    error,
    isLoading,
  } = useRecentDetections(teamSlug, { sortBy, sortOrder, limit: 50 });

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

  // Handle load more detections
  const handleLoadMore = () => {
    const nextBatch = Math.min(detections?.length || 0, visibleCount + 5);
    setVisibleCount(nextBatch);
  };

  // Function to get appropriate badge color based on event type
  const getEventBadgeColor = (
    eventType: string,
    severity: Detection['severity']
  ) => {
    if (severity === 'high')
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30';
    if (severity === 'medium')
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30';
    if (severity === 'low')
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30';
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30';
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surfaceColor shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-[22px] leading-8 font-['Poppins'] text-gray-900 dark:text-textColor">
              Recent Detections
            </h2>

            {/* Sort dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                className="flex items-center justify-between text-sm text-gray-600 dark:text-textColor border border-gray-200 dark:border-borderColor rounded-xl px-3 py-1.5 bg-[#F9F9F9] dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <FiFilter className="h-4 w-4 mr-1.5" />
                Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                <FiChevronDown className="ml-1.5 h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <button
                    onClick={() => handleSortSelect('time')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Time{' '}
                    {sortBy === 'time' &&
                      (sortOrder === 'desc' ? '(Newest)' : '(Oldest)')}
                  </button>
                  <button
                    onClick={() => handleSortSelect('zone')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Zone{' '}
                    {sortBy === 'zone' &&
                      (sortOrder === 'desc' ? '(Z-A)' : '(A-Z)')}
                  </button>
                  <button
                    onClick={() => handleSortSelect('camera')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Camera{' '}
                    {sortBy === 'camera' &&
                      (sortOrder === 'desc' ? '(Z-A)' : '(A-Z)')}
                  </button>
                  <button
                    onClick={() => handleSortSelect('eventType')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Event Type{' '}
                    {sortBy === 'eventType' &&
                      (sortOrder === 'desc' ? '(Z-A)' : '(A-Z)')}
                  </button>
                  <button
                    onClick={() => handleSortSelect('severity')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Severity{' '}
                    {sortBy === 'severity' &&
                      (sortOrder === 'desc' ? '(High-Low)' : '(Low-High)')}
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
            Real-time PPE compliance detection events
          </p>
        </div>
      </div>

      {/* Table with improved styling */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <Loading/>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500">Failed to load detection data</p>
          </div>
        ) : detections && detections.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/30">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Zone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Camera
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Event Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Image
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {detections.slice(0, visibleCount).map((detection) => (
                <tr
                  key={detection.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{detection.timeAgo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {detection.zone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {detection.camera}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEventBadgeColor(detection.eventType, detection.severity)}`}
                    >
                      {detection.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-12 w-16 bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center rounded-md shadow-sm">
                      {detection.imageUrl ? (
                        <Image
                          src={detection.imageUrl}
                          alt={detection.eventType}
                          width={64}
                          height={48}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 p-1 flex flex-col items-center">
                          <FiImage className="h-4 w-4 mb-1 opacity-50" />
                          <span>{detection.personId.substring(0, 6)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No recent detections found</p>
          </div>
        )}
      </div>

      {/* Show more button with improved styling and functionality */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 flex justify-center">
        {detections && detections.length > visibleCount ? (
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 shadow-sm"
          >
            View more detections
          </button>
        ) : detections && detections.length > 0 && visibleCount > 5 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing all {detections.length} detections
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default RecentDetections;
