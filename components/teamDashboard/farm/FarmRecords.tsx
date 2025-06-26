import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { WithLoadingAndError } from '@/components/shared';
import DashboardHeader from '@/components/shared/DashboardHeader';
import { DetectionStatus } from '@prisma/client';

import useOrgTheme from 'hooks/useOrgTheme';
import useLocations, { useLocationDetails } from 'hooks/useLocationHooks';
import { useLivestockCount } from 'hooks/useLivestockCount';
import { useLivestockSummary } from 'hooks/useLivestockSummary';

// Import components
import { FilterControls } from './components/FilterControls';
import { LivestockSummary } from './components/LivestockSummary';
import { LoadingView } from './components/LoadingView';
import { ErrorView } from './components/ErrorView';

// Import views
import { SpeciesDistribution } from './views/SpeciesDistribution';
import { ZoneDistribution } from './views/ZoneDistribution';
import { TrendsView } from './views/TrendsView';
import { StatusDistribution } from './views/StatusDistribution';
import { DetailedRecords } from './views/DetailedRecords';

// Import utilities & constants
import { useDateRange } from './hooks/useDateRange';
import { chartColors, statusColors, statusLabels } from './constants';

const FarmRecords: React.FC = () => {
    const router = useRouter();
    const teamSlug = router.query.slug as string;
    const { t } = useTranslation('common');

    // UI Control States
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [selectedZoneId, setSelectedZoneId] = useState<string>('');
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6m');
    const [selectedView, setSelectedView] = useState<string>('detailed');
    const [selectedStatus, setSelectedStatus] = useState<DetectionStatus | ''>('');
    const [selectedType, setSelectedType] = useState<string>('');

    // Custom hook for date range
    const { dateRange, dateRangeStrings, updateDateRangeFromTimeframe } = useDateRange(selectedTimeframe);

    // Fetch theme and location data
    const { theme, loading: themeLoading } = useOrgTheme(teamSlug);
    const { locations, isLoading: locationsLoading, isError: locationsError } = useLocations(teamSlug);
    const { locationDetails, isLoading: locationDetailsLoading } = useLocationDetails(
        teamSlug,
        selectedLocationId
    );

    // Effect to update date range when timeframe changes
    useEffect(() => {
        updateDateRangeFromTimeframe(selectedTimeframe);
    }, [selectedTimeframe, updateDateRangeFromTimeframe]);

    // Create stable filters object for API requests - set default limit to 25
    const filters = useMemo(() => ({
        locationId: selectedLocationId,
        zoneId: selectedZoneId,
        deviceId: selectedDeviceId,
        status: selectedStatus as DetectionStatus | undefined,
        type: selectedType || undefined,
        startDate: dateRangeStrings.startDate,
        endDate: dateRangeStrings.endDate,
        page: 1,
        limit: 25 // Default to 25 rows per page
    }), [
        selectedLocationId,
        selectedZoneId,
        selectedDeviceId,
        selectedStatus,
        selectedType,
        dateRangeStrings.startDate,
        dateRangeStrings.endDate
    ]);

    // Fetch livestock count data with the filters for table
    const {
        isLoading,
        error,
        data: livestockCounts,
        pagination,
        fetchData,
        updateDetection
    } = useLivestockCount(filters);

    // Fetch summary data with the same filters (except pagination)
    const summaryFilters = useMemo(() => ({
        locationId: selectedLocationId,
        zoneId: selectedZoneId,
        deviceId: selectedDeviceId,
        startDate: dateRangeStrings.startDate,
        endDate: dateRangeStrings.endDate
    }), [
        selectedLocationId,
        selectedZoneId,
        selectedDeviceId,
        dateRangeStrings.startDate,
        dateRangeStrings.endDate
    ]);

    const {
        isLoading: isSummaryLoading,
        error: summaryError,
        data: summaryData,
        fetchSummary
    } = useLivestockSummary(summaryFilters);

    // Update summary when filters change
    useEffect(() => {
        fetchSummary(summaryFilters);
    }, [summaryFilters, fetchSummary]);

    // Handle refresh to fetch both table and summary data
    const handleRefresh = () => {
        fetchData(filters);
        fetchSummary(summaryFilters);
    };

    // Handle filter changes
    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLocationId = e.target.value;
        setSelectedLocationId(newLocationId);
        // Reset child filters
        setSelectedZoneId('');
        setSelectedDeviceId('');
    };

    const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newZoneId = e.target.value;
        setSelectedZoneId(newZoneId);
        // Reset device filter
        setSelectedDeviceId('');
    };

    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDeviceId(e.target.value);
    };

    const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTimeframe(e.target.value);
    };

    const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedView(e.target.value);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(e.target.value as DetectionStatus | '');
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
    };

    // Render the appropriate view based on selection
    const renderSelectedView = () => {
        // Common props for all views
        const viewProps = {
            livestockCounts,
            theme,
            statusLabels,
            statusColors,
            chartColors
        };

        switch (selectedView) {
            case 'species':
                return <SpeciesDistribution {...viewProps} />;
            case 'zones':
                return <ZoneDistribution {...viewProps} />;
            case 'trends':
                return <TrendsView {...viewProps} />;
            case 'status':
                return <StatusDistribution {...viewProps} />;
            case 'detailed':
                return (
                    <DetailedRecords
                        {...viewProps}
                        pagination={pagination}
                        updateDetection={updateDetection}
                        fetchData={fetchData}
                        filters={filters}
                    />
                );
            default:
                return <SpeciesDistribution {...viewProps} />;
        }
    };

    // Combine all filter handlers for easier props passing
    const filterHandlers = {
        handleLocationChange,
        handleZoneChange,
        handleDeviceChange,
        handleTimeframeChange,
        handleViewChange,
        handleStatusChange,
        handleTypeChange,
        handleRefresh
    };

    // Combine all filter values for easier props passing
    const filterValues = {
        selectedLocationId,
        selectedZoneId,
        selectedDeviceId,
        selectedTimeframe,
        selectedView,
        selectedStatus,
        selectedType
    };

    return (
        <WithLoadingAndError
            isLoading={themeLoading || locationsLoading}
            error={locationsError ? new Error("Failed to load locations") : null}
        >
            {/* Header */}
            <DashboardHeader
                title={t('Livestock Records')}
                primaryColor={theme?.primaryColor || '#16355D'}
                currentTime={new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                formattedDate={format(new Date(), 'MMMM dd, yyyy')}
            />

            <div className="p-4 pt-2 lg:px-8 -mt-28 relative z-10">
                <div className="w-full space-y-3 h-full flex flex-col py-5">
                    {/* Summary Cards - Now using the summary data instead of table data */}
                    <LivestockSummary
                        summaryData={summaryData}
                        isLoading={isSummaryLoading}
                    />

                    {/* Filter Controls Section */}
                    <FilterControls
                        locations={locations!}
                        locationDetails={locationDetails}
                        filters={filterValues}
                        handlers={filterHandlers}
                        livestockTypes={[...new Set(livestockCounts?.map(item => item.type) || [])]}
                    />

                    <div className='h-2'></div>
                    
                    {/* Main Content Area */}
                    {isLoading ? (
                        <LoadingView />
                    ) : error ? (
                        <ErrorView error={error} onRetry={handleRefresh} />
                    ) : (
                        renderSelectedView()
                    )}
                </div>
            </div>
        </WithLoadingAndError>
    );
};

export default FarmRecords;
