import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAllAlerts, useResolveAlert, useTeamComplianceStatuses, Alert, ViolationStats, ComplianceStatusInfo } from 'hooks/useAlerts';
import { useTeamStatus } from 'hooks/useTeamStatus';
import useColors from 'hooks/useColors';
import { AlertsList } from './AlertsList';
import { AlertsStats } from './AlertsStats';
import { AlertsPagination } from './AlertsPagination';
import { Loading, WithLoadingAndError } from '../shared';
import Card from '@/components/shared/Card';
import { PlusIcon, ExclamationCircleIcon, CheckCircleIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { toast } from '@/lib/toast';
import Calendar from '@/components/shared/calendar';
import { format } from 'date-fns';
import classNames from 'classnames';

// Update the interface for zones to include locationName and locationId properties
interface Zone {
  id: string;
  name: string;
  locationId?: string;
  locationName?: string;
}

// Interface for location and zone data
interface Location {
  id: string;
  name: string;
  zones: { id: string; name: string }[];
}

export const AlertsComponent: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const { primaryColor, secondaryColor } = useColors();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [isAddingDefaultStatuses, setIsAddingDefaultStatuses] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Calculate offset based on current page and limit
  const offset = (currentPage - 1) * limit;

  // Use the team status hook for team status operations
  const {
    createDefaultStatuses,
    isLoading: isStatusesLoading,
    error: statusesError,
    statuses: allStatuses
  } = useTeamStatus(teamSlug);

  // Find default status from all statuses
  const defaultStatus = useMemo(() => {
    return allStatuses?.find(status => status.isDefault === true);
  }, [allStatuses]);

  // Set initial active tab to 'all' or default status id if available
  useEffect(() => {
    if (defaultStatus && activeTab === 'all') {
      setActiveTab(defaultStatus.id);
    }
  }, [defaultStatus]);

  // Fetch alerts data with the useAllAlerts hook, including filters
  const { 
    alerts, 
    stats, 
    total, 
    zones: rawZones, 
    statuses,
    severities,
    isLoading: alertsLoading, 
    error: alertsError, 
    mutate 
  } = useAllAlerts(
    teamSlug,
    {
      limit,
      offset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      zone: selectedZone || undefined,
      status: activeTab !== 'all' ? activeTab : selectedStatus || undefined,
      severity: selectedSeverity || undefined
    }
  );
  
  // Get resolve alert function
  const resolveAlert = useResolveAlert(teamSlug);

  const isLoading = alertsLoading || isStatusesLoading || isAddingDefaultStatuses;
  const error = alertsError || statusesError;

  // Group zones by location - Fix TypeScript error by properly typing rawZones
  const locations = useMemo<Location[]>(() => {
    if (!rawZones?.length) return [];
    
    const locationMap = new Map<string, Location>();
    
    rawZones.forEach((zone: Zone) => {
      // Extract location from zone name or use metadata
      const locationName = zone.locationName || zone.name.split(' - ')[0] || 'Unknown Location';
      const locationId = zone.locationId || locationName;
      
      if (!locationMap.has(locationId)) {
        locationMap.set(locationId, {
          id: locationId,
          name: locationName,
          zones: []
        });
      }
      
      locationMap.get(locationId)?.zones.push({
        id: zone.id,
        name: zone.name.includes(' - ') ? zone.name.split(' - ')[1] : zone.name
      });
    });
    
    return Array.from(locationMap.values());
  }, [rawZones]);

  // Update selectedZone when location changes
  useEffect(() => {
    if (selectedLocation && selectedZone) {
      const location = locations.find(loc => loc.id === selectedLocation);
      if (location && !location.zones.some(zone => zone.id === selectedZone)) {
        setSelectedZone('');
      }
    } else if (!selectedLocation) {
      setSelectedZone('');
    }
  }, [selectedLocation, selectedZone, locations]);

  // Get severity color based on severity level
  const getSeverityColor = (severity: string): string => {
    switch(severity) {
      case 'LOW': return '#FBBF24'; // amber-500
      case 'MEDIUM': return '#F97316'; // orange-500
      case 'HIGH': return '#EF4444'; // red-500
      case 'CRITICAL': return '#8B5CF6'; // purple-500
      default: return '#6B7280'; // gray-500
    }
  };

  // Format date for display in the calendar component
  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return 'Select date';
    return format(date, 'MMM dd, yyyy');
  };

  // Function to add default statuses when requested by user
  const addDefaultStatuses = async () => {
    if (!teamSlug) return;
    
    try {
      setIsAddingDefaultStatuses(true);
      
      const defaultStatuses = [
        {
          name: t('status-default-pending'),
          code: 'PENDING',
          description: t('status-default-pending-desc'),
          color: '#F59E0B', // Amber
          icon: 'clock',
          order: 0,
          isDefault: true,
        },
        {
          name: t('status-default-in-progress'),
          code: 'IN_PROGRESS',
          description: t('status-default-in-progress-desc'),
          color: '#3498DB', // Blue
          icon: 'alert-circle',
          order: 1,
          isDefault: false,
        },
        {
          name: t('status-default-resolved'),
          code: 'RESOLVED',
          description: t('status-default-resolved-desc'),
          color: '#22C55E', // Green
          icon: 'check-circle',
          order: 2,
          isDefault: false,
        },
      ];
      
      const success = await createDefaultStatuses(defaultStatuses);
      
      if (success) {
        toast.success(t('default-statuses-created'));
        await mutate(); // Refresh alerts after adding defaults
      }
    } catch (error) {
      toast.error(t('error-creating-default-statuses'));
      console.error('Error adding default statuses:', error);
    } finally {
      setIsAddingDefaultStatuses(false);
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    const success = await resolveAlert(alertId);
    if (success) {
      // Refetch data to update the UI
      mutate();
    }
  };

  // Add a new function to move alerts to the next status, with optional severity
  const moveToNextStatus = async (alertId: string, nextStatusId: string, comment: string, severity?: string) => {
    try {
      // Create request body with status, comment and optional severity
      const requestBody: { statusId: string; comment: string; severity?: string } = {
        statusId: nextStatusId,
        comment: comment
      };
      
      // Add severity if provided
      if (severity && severity !== 'NOT_SET') {
        requestBody.severity = severity;
      }
      
      const response = await fetch(
        `/api/teams/${teamSlug}/alerts/${alertId}/update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refetch data to update the UI
      await mutate();
      toast.success('Alert status updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Failed to update alert status');
      return false;
    }
  };

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset all filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLocation('');
    setSelectedZone('');
    setSelectedStatus('');
    setSelectedSeverity('');
    setCurrentPage(1);
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    setShowFilters(false); // Hide filter panel after applying
  };

  // Handle tab change
  const handleTabChange = (statusId: string) => {
    setActiveTab(statusId);
    setSelectedStatus(statusId === 'all' ? '' : statusId); // Sync selected status with active tab
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Sort statuses by order field
  const sortedStatuses = useMemo(() => {
    if (!statuses) return [];
    return [...statuses].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [statuses]);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Remove individual filter
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'startDate':
        setStartDate(null);
        break;
      case 'endDate':
        setEndDate(null);
        break;
      case 'location':
        setSelectedLocation('');
        setSelectedZone(''); // Also reset zone when location is removed
        break;
      case 'zone':
        setSelectedZone('');
        break;
      case 'status':
        setSelectedStatus('');
        break;
      case 'severity':
        setSelectedSeverity('');
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when removing filters
  };

  // Strengthen the check for empty statuses
  if (!isLoading && !isStatusesLoading && !error && !statusesError && Array.isArray(statuses) && statuses.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <Card.Body>
            <div className="text-center py-10">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('no-statuses-defined')}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t('alerts-require-statuses')}
              </p>
              <div className="mt-6 flex flex-col items-center space-y-4">
                <Link href={`/teams/${teamSlug}/settings`} passHref>
                  <ButtonFromTheme
                    className="gap-2"
                    icon={<PlusIcon className="h-5 w-5" aria-hidden="true" />}
                  >
                    {t('go-to-status-settings')}
                  </ButtonFromTheme>
                </Link>
                <div className="flex items-center w-full">
                  <div className="mx-4 border-t border-gray-300 flex-grow"></div>
                  <span className="text-sm text-gray-500">{t('or')}</span>
                  <div className="mx-4 border-t border-gray-300 flex-grow"></div>
                </div>
                <ButtonFromTheme
                  onClick={addDefaultStatuses}
                  loading={isAddingDefaultStatuses}
                  className="gap-2"
                  icon={<CheckCircleIcon className="h-5 w-5" aria-hidden="true" />}
                >
                  {t('add-default-statuses')}
                </ButtonFromTheme>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
              Alert Management
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              View and manage PPE compliance violations
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <ButtonFromTheme
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              icon={<FunnelIcon className="h-5 w-5" aria-hidden="true" />}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </ButtonFromTheme>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <Card >
            <Card.Body>
              <h3 className="text-lg font-medium mb-5 text-gray-900 dark:text-gray-100">Filter Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">Date Range</h4>
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar
                        selectedDate={startDate || new Date()}
                        onDateChange={setStartDate}
                        formatDateForDisplay={formatDateForDisplay}
                        backgroundColor={primaryColor || 'blue-600'}
                        textColor="white" // Explicitly set text color to white for better contrast
                      />
                    </div>
                  </div>
                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar
                        selectedDate={endDate || new Date()}
                        onDateChange={setEndDate}
                        formatDateForDisplay={formatDateForDisplay}
                        backgroundColor={primaryColor || 'blue-600'}
                        textColor="white" // Explicitly set text color to white for better contrast
                      />
                    </div>
                  </div>
                </div>
                
                {/* Location and Zone Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">Location</h4>
                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Facility
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    >
                      <option value="">All Facilities</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Zone Filter - Filtered by selected location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Zone
                    </label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      disabled={!selectedLocation}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">All Zones</option>
                      {selectedLocation && locations.find(loc => loc.id === selectedLocation)?.zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                    {!selectedLocation && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select a facility first</p>
                    )}
                  </div>
                </div>
                
                {/* Status and Severity Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">Classification</h4>
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      disabled={activeTab !== 'all'}
                    >
                      <option value="">All Statuses</option>
                      {sortedStatuses.map((status) => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                    {activeTab !== 'all' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Status filter is applied from tabs</p>
                    )}
                  </div>
                  
                  {/* Severity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Severity
                    </label>
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    >
                      <option value="">All Severities</option>
                      {severities && severities.map((severity) => (
                        <option key={severity} value={severity}>{severity}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={resetFilters}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Reset Filters
                </button>
                <ButtonFromTheme 
                  onClick={applyFilters}
                >
                  Apply Filters
                </ButtonFromTheme>
              </div>
            </Card.Body>
          </Card>
        )}
        
        {/* Active Filters Display */}
        {(startDate || endDate || selectedLocation || selectedZone || (selectedStatus && activeTab === 'all') || selectedSeverity) && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 mb-6 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Filters:</span>
              
              {/* Date filters */}
              {startDate && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  From: {formatDateForDisplay(startDate)}
                  <button
                    type="button"
                    onClick={() => removeFilter('startDate')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-blue-800 dark:hover:text-blue-100"
                  >
                    <span className="sr-only">Remove start date filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {endDate && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  To: {formatDateForDisplay(endDate)}
                  <button
                    type="button"
                    onClick={() => removeFilter('endDate')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-blue-800 dark:hover:text-blue-100"
                  >
                    <span className="sr-only">Remove end date filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Location filter */}
              {selectedLocation && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-800">
                  Facility: {locations.find(loc => loc.id === selectedLocation)?.name || selectedLocation}
                  <button
                    type="button"
                    onClick={() => removeFilter('location')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-green-600 hover:bg-green-200 hover:text-green-800 dark:text-green-300 dark:hover:bg-green-800 dark:hover:text-green-100"
                  >
                    <span className="sr-only">Remove location filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Zone filter */}
              {selectedZone && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-800">
                  Zone: {locations.find(loc => loc.id === selectedLocation)?.zones.find(z => z.id === selectedZone)?.name || selectedZone}
                  <button
                    type="button"
                    onClick={() => removeFilter('zone')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-green-600 hover:bg-green-200 hover:text-green-800 dark:text-green-300 dark:hover:bg-green-800 dark:hover:text-green-100"
                  >
                    <span className="sr-only">Remove zone filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Status filter */}
              {selectedStatus && activeTab === 'all' && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                  Status: {statuses?.find(s => s.id === selectedStatus)?.name || selectedStatus}
                  <button
                    type="button"
                    onClick={() => removeFilter('status')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-purple-600 hover:bg-purple-200 hover:text-purple-800 dark:text-purple-300 dark:hover:bg-purple-800 dark:hover:text-purple-100"
                  >
                    <span className="sr-only">Remove status filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Severity filter */}
              {selectedSeverity && (
                <span className="inline-flex items-center rounded-md py-1 px-2 text-sm font-medium"
                  style={{ 
                    backgroundColor: `${getSeverityColor(selectedSeverity)}15`,  // 15% opacity
                    color: getSeverityColor(selectedSeverity), 
                    borderColor: `${getSeverityColor(selectedSeverity)}30`  // 30% opacity
                  }}
                >
                  Severity: {selectedSeverity}
                  <button
                    type="button"
                    onClick={() => removeFilter('severity')}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full hover:bg-opacity-20"
                    style={{ 
                      color: getSeverityColor(selectedSeverity),
                    }}
                  >
                    <span className="sr-only">Remove severity filter</span>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Clear all button */}
              <button
                onClick={resetFilters}
                className="ml-auto text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
        
        {/* Statistics Cards */}
        <AlertsStats stats={stats} isLoading={isLoading} />
        
        {/* Status Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
              <button
                className={classNames(
                  activeTab === 'all'
                    ? 'border-b-2 text-gray-900 dark:text-white font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                )}
                onClick={() => handleTabChange('all')}
                style={activeTab === 'all' ? { borderColor: primaryColor || '#3B82F6' } : {}}
              >
                All Alerts
                {/* Show the total count from stats or fall back to the total state */}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {(stats._totalAlerts !== undefined) ? stats._totalAlerts : total}
                </span>
              </button>
              
              {sortedStatuses.map((status) => {
                // Get the count for this status from _statusCounts safely
                let count = 0;
                if (stats._statusCounts && typeof stats._statusCounts === 'object') {
                  count = stats._statusCounts[status.id] || 0;
                }
                
                return (
                  <button
                    key={status.id}
                    className={classNames(
                      activeTab === status.id
                        ? 'border-b-2 font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 text-sm'
                    )}
                    onClick={() => handleTabChange(status.id)}
                    style={{
                      borderColor: activeTab === status.id ? (status.color || '#3B82F6') : 'transparent',
                      color: activeTab === status.id 
                        ? status.color || (primaryColor || '#3B82F6') 
                        : undefined
                    }}
                  >
                    {status.name} 
                    {/* Always show count badge with consistent text styling */}
                    <span className={classNames(
                      "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-800 dark:text-gray-300",
                      activeTab === status.id 
                        ? "bg-white/20" 
                        : "bg-gray-100 dark:bg-gray-700"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Alerts List */}
        <div className="mt-4 overflow-hidden sm:rounded-md">
          {isLoading ? (
            <Loading/>
          ) : error ? (
            <div className="py-10 text-center text-red-600 dark:text-red-400">
              Error loading alerts: {error.message}
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              No alerts found. All workers are compliant with PPE requirements.
            </div>
          ) : (
            <AlertsList 
              alerts={alerts} 
              onResolveAlert={handleResolveAlert}
              onMoveToNextStatus={moveToNextStatus}
              statuses={sortedStatuses}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <AlertsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </WithLoadingAndError>
  );
};
