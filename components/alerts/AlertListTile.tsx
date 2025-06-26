import React from 'react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { 
  EyeIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ChatBubbleLeftIcon, 
  MapPinIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ViewfinderCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import { Alert, ComplianceStatusInfo } from 'hooks/useAlerts';

interface AlertListTileProps {
  alert: Alert;
  teamSlug: string;
  nextStatus?: ComplianceStatusInfo;
  isFirstStatusInFlow: boolean;
  isLastStatusInFlow: boolean;
  onViewComments: (alert: Alert) => void;
  onRequestStatusChange: (alertId: string, nextStatusId: string) => void;
  onResolveAlert: (alertId: string) => void;
}

const AlertListTile: React.FC<AlertListTileProps> = ({
  alert,
  teamSlug,
  nextStatus,
  isFirstStatusInFlow,
  isLastStatusInFlow,
  onViewComments,
  onRequestStatusChange,
  onResolveAlert
}) => {
  // Helper to format severity display
  const formatSeverity = (severity: string): string => {
    if (severity === 'NOT_SET') return 'Not Set';
    return severity;
  };

  // Helper to get severity classes - modified to only affect text color, not borders
  const getSeverityClasses = (severity: string): string => {
    switch(severity) {
      case 'LOW':
        return 'text-yellow-800 dark:text-yellow-300';
      case 'MEDIUM':
        return 'text-orange-800 dark:text-orange-300';
      case 'HIGH':
        return 'text-red-800 dark:text-red-300';
      case 'CRITICAL':
        return 'text-purple-800 dark:text-purple-300';
      default:
        return 'text-gray-800 dark:text-gray-300';
    }
  };

  // Format time with smart display: relative for recent alerts, exact for older ones
  const getSmartTime = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If the alert is older than 24 hours, show the actual date
    if (differenceInHours(now, date) >= 24) {
      return format(date, 'MMM d, yyyy h:mm a');
    } else {
      // Otherwise show relative time
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  // Format absolute time for tooltip
  const getAbsoluteTime = (timestamp: string | Date): string => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  // Check if comments are available
  const hasComments = alert.comments && alert.comments.length > 0;

  return (
    <li className="p-5 relative rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
      {/* Timestamp, Severity, Status and Violations badges in top right corner */}
      <div className="absolute top-3 right-5 flex items-center text-sm whitespace-nowrap gap-2">
        {/* Status Badge (if present) - moved to top right */}
        {alert.status && (
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${alert.status.color}22` || '#F3F4F6', 
              color: alert.status.color || '#374151',
            }}
          >
            {alert.status.name}
          </span>
        )}

        {/* Number of Violations Badge - moved to top right */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
          {alert.violations.length} {alert.violations.length === 1 ? 'violation' : 'violations'}
        </span>
        
        {/* Severity Badge */}
        <span className={`
          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-700
          ${getSeverityClasses(alert.severity)}
        `}>
          {formatSeverity(alert.severity)}
        </span>

        {/* Timestamp */}
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span title={getAbsoluteTime(alert.timestamp)}>
            {getSmartTime(alert.timestamp)}
          </span>
        </div>
      </div>

      <div className="pr-0 sm:pr-32 mb-16 sm:mb-0 pt-8 sm:pt-0">
        {/* Header Section with violations heading and values inline - badges removed */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center mr-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mr-1">
                Violations:
              </h3>
              <span className="text-gray-700 dark:text-gray-300">
                {alert.violations.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section - with consistent styling */}
        <div className="mt-3 grid grid-cols-3 gap-4">
          {/* Location Section */}
          <div className="flex flex-col">
            <div className="flex items-center mb-1">
              <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Location</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400 text-base">{alert.location}</span>
          </div>
          
          {/* Zone Section */}
          <div className="flex flex-col">
            <div className="flex items-center mb-1">
              <ViewfinderCircleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Zone</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400 text-base">{alert.zone}</span>
          </div>
          
          {/* Worker ID Section */}
          <div className="flex flex-col">
            <div className="flex items-center mb-1">
              <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Worker ID</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400 text-base">{alert.workerId}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Section - Position bottom right */}
      <div className="absolute bottom-5 right-5 flex flex-row gap-2">
        {/* Action button based on current status - moved to be first */}
        {nextStatus ? (
          <ButtonFromTheme
            onClick={() => onRequestStatusChange(alert.id, nextStatus.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md w-full sm:w-auto"
            primaryColor={nextStatus.color}
            icon={<ArrowRightIcon className="h-4 w-4" />}
          >
            {isLastStatusInFlow ? 'Complete' : `Move to ${nextStatus.name}`}
          </ButtonFromTheme>
        ) : (
          <ButtonFromTheme
            onClick={() => onResolveAlert(alert.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md w-full sm:w-auto"
            icon={<CheckCircleIcon className="h-4 w-4" />}
          >
            Complete
          </ButtonFromTheme>
        )}
        
        {/* View Details button - now icon only and placed after the action button */}
        <Link href={`/teams/${teamSlug}/incidents?id=${alert.id}`} passHref>
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            aria-label="View Details"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        </Link>
        
        {/* Comment button - only show if comments are available */}
        {hasComments && (
          <button
            onClick={() => onViewComments(alert)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            aria-label={`View ${alert.comments?.length} comments`}
            title={`View ${alert.comments?.length} comments`}
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </li>
  );
};

export default AlertListTile;
