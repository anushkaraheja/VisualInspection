import { useState, useEffect, useMemo, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Error as ErrorComponent, Loading, WithLoadingAndError } from '@/components/shared';
import useLocations, { useLocationDetails, LocationWithAnimalsAndZonesAndVendors } from 'hooks/useLocationHooks';
import useOrgTheme from 'hooks/useOrgTheme';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/shared/DashboardHeader';
import DashboardFilters from './components/DashboardFilters';
import AnimalCardsSection from './components/AnimalCardsSection';
import ChartSection from './components/ChartSection';
import ZoneChartSection from './components/ZoneChartSection';
import { useLivestockCount } from 'hooks/useLivestockCount';
import { useLivestockSummary } from 'hooks/useLivestockSummary';
import { DetectionStatus } from '@prisma/client';
import { Table } from '@/components/shared/table/Table';
import { TableBodyType } from '@/components/shared/table/TableBody';

// Define interfaces for our data structures
interface TimeSeriesData {
    date: string;
    count: number;
    [animalType: string]: string | number;
}

interface ZoneData {
    id: string;
    name: string;
    count: number;
    percentage: number;
    [animalType: string]: string | number;
}

// Fallback for time series data when API fails
const getEmptyTimeSeriesData = (startDate: Date, endDate: Date, locationDetails?: LocationWithAnimalsAndZonesAndVendors): TimeSeriesData[] => {
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const results: TimeSeriesData[] = []; // Explicitly type the array

    // Get animal types from location details or use defaults
    const animalTypes = locationDetails?.Animal?.map(animal => animal.name) || ['Bulls', 'Cows', 'Calves'];

    for (let i = 0; i <= days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        const entry: TimeSeriesData = {
            date: format(currentDate, 'yyyy-MM-dd'),
            count: 0,
        };

        // Add empty counts for each animal type
        animalTypes.forEach(type => {
            entry[type] = 0;
        });

        results.push(entry);
    }

    return results;
};

const FarmDashboard = ({ teamSlug }: { teamSlug: string }) => {
    const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // States for UI control
    const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
    const [selectedZoneId, setSelectedZoneId] = useState<string>('');
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<DetectionStatus | ''>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [showFilters, setShowFilters] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>(
        new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    );

    // Data loading states
    const [timeSeriesLoading, setTimeSeriesLoading] = useState<boolean>(false);
    const [timeSeriesError, setTimeSeriesError] = useState<Error | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

    const [zoneLoading, setZoneLoading] = useState<boolean>(false);
    const [zoneError, setZoneError] = useState<Error | null>(null);
    const [zoneData, setZoneData] = useState<ZoneData[]>([]);

    // Date filter states - Changed from 7 days to 90 days by default
    const [filters, setFilters] = useState({
        start: toZonedTime(subDays(new Date(), 90), TZ),
        end: toZonedTime(new Date(), TZ),
    });
    const [startDate, setStartDate] = useState(filters.start);
    const [endDate, setEndDate] = useState(filters.end);

    // Fetch needed data from hooks
    const { theme, loading: themeLoading } = useOrgTheme(teamSlug);
    const { locationDetails, isLoading: locationDetailsLoading, mutateLocationDetails } = useLocationDetails(
        teamSlug,
        selectedLocationId !== 'all' ? selectedLocationId : ''
    );
    const { locations, isLoading: locationsLoading, isError: locationsError, mutateLocations } = useLocations(teamSlug);

    // Create livestock filters to match the Records page approach - EXACTLY matching FarmRecords
    const livestockFilters = useMemo(() => ({
        locationId: selectedLocationId !== 'all' ? selectedLocationId : undefined,
        zoneId: selectedZoneId || undefined,
        deviceId: selectedDeviceId || undefined,
        status: selectedStatus as DetectionStatus | undefined,
        type: selectedType || undefined,
        startDate: format(filters.start, 'yyyy-MM-dd'),
        endDate: format(filters.end, 'yyyy-MM-dd'),
        page: 1,
        limit: 100 // Increased limit to get more data
    }), [
        selectedLocationId,
        selectedZoneId,
        selectedDeviceId,
        selectedStatus,
        selectedType,
        filters.start,
        filters.end
    ]);

    // Create summary filters (without pagination)
    const summaryFilters = useMemo(() => ({
        locationId: selectedLocationId !== 'all' ? selectedLocationId : undefined,
        zoneId: selectedZoneId || undefined,
        deviceId: selectedDeviceId || undefined,
        startDate: format(filters.start, 'yyyy-MM-dd'),
        endDate: format(filters.end, 'yyyy-MM-dd')
    }), [
        selectedLocationId,
        selectedZoneId,
        selectedDeviceId,
        filters.start,
        filters.end
    ]);

    // Fetch livestock count data
    const {
        isLoading: livestockCountLoading,
        error: livestockCountError,
        data: livestockCounts,
        fetchData: fetchLivestockData
    } = useLivestockCount(livestockFilters);

    // Fetch summary data
    const {
        isLoading: summaryLoading,
        error: summaryError,
        data: summaryData,
        fetchSummary
    } = useLivestockSummary(summaryFilters);

    // Calculate animal statistics from summary data or livestockCounts
    const getAnimalCountsFromData = useCallback(() => {
        if (summaryData) {
            return {
                totalActive: summaryData.statusCounts.approved + summaryData.statusCounts.modified,
                totalInactive: summaryData.statusCounts.pending + summaryData.statusCounts.rejected,
                totalAnimals: summaryData.totalAnimals
            };
        }
        
        // If summary data is not available, calculate from livestock counts
        if (livestockCounts && livestockCounts.length > 0) {
            let activeCount = 0;
            let inactiveCount = 0;
            let totalCount = 0;
            
            livestockCounts.forEach(entry => {
                // Use manualCount if available for MODIFIED entries, otherwise use count
                const entryCount = entry.status === 'MODIFIED' && entry.manualCount !== undefined 
                    ? entry.manualCount 
                    : entry.count;
                    
                // Add to total
                totalCount += entryCount;
                
                // Add to active/inactive based on status
                if (entry.status === 'APPROVED' || entry.status === 'MODIFIED') {
                    activeCount += entryCount;
                } else {
                    inactiveCount += entryCount;
                }
            });
            
            return {
                totalActive: activeCount,
                totalInactive: inactiveCount,
                totalAnimals: totalCount
            };
        }
        
        // Simple fallback to zero
        return {
            totalActive: 0,
            totalInactive: 0,
            totalAnimals: 0
        };
    }, [summaryData, livestockCounts]);

    const { totalActive, totalInactive, totalAnimals } = getAnimalCountsFromData();

    // Prepare data for Table component - Time Series
    const prepareTimeSeriesTableData = useCallback((): TableBodyType[] => {
        if (!timeSeriesData || timeSeriesData.length === 0) {
            return [];
        }
        
        // Filter out days with no data
        return timeSeriesData
            .filter(data => data.count > 0)
            .map(data => {
                const cells = [
                    { text: data.date },
                    { text: data.count.toString() }
                ];
                
                // Add all other animal types as separate cells
                Object.keys(data)
                    .filter(key => key !== 'date' && key !== 'count')
                    .forEach(type => {
                        cells.push({ text: data[type].toString() });
                    });
                
                return {
                    id: `time-series-${data.date}`,
                    cells
                };
            });
    }, [timeSeriesData]);
    
    // Prepare columns for Time Series Table
    const timeSeriesColumns = useMemo(() => {
        if (!timeSeriesData || timeSeriesData.length === 0) {
            return ['Date', 'Total Count'];
        }
        
        const columns = ['Date', 'Total Count'];
        
        // Add all animal types as columns
        if (timeSeriesData[0]) {
            Object.keys(timeSeriesData[0])
                .filter(key => key !== 'date' && key !== 'count')
                .forEach(type => {
                    columns.push(type);
                });
        }
        
        return columns;
    }, [timeSeriesData]);

    // Prepare data for Table component - Zone Data
    const prepareZoneTableData = useCallback((): TableBodyType[] => {
        if (!zoneData || zoneData.length === 0) {
            return [];
        }
        
        return zoneData.map(zone => {
            const cells = [
                { text: zone.name },
                { text: zone.count.toString() }
            ];
            
            // Get all animal types dynamically
            const animalTypes = Object.keys(zone).filter(key => 
                key !== 'id' && 
                key !== 'name' && 
                key !== 'count' && 
                key !== 'percentage' && 
                typeof zone[key] === 'number'
            );
            
            // Add all animal types as cells
            animalTypes.forEach(type => {
                cells.push({ text: zone[type].toString() });
            });
            
            // Always add percentage as the last column
            cells.push({ text: `${zone.percentage}%` });
            
            return {
                id: zone.id,
                cells
            };
        });
    }, [zoneData]);

    // Generate Zone Table columns dynamically based on available data
    const zoneColumns = useMemo(() => {
        const baseColumns = ['Zone', 'Total Count'];
        
        if (!zoneData || zoneData.length === 0) {
            return [...baseColumns, 'Percentage']; // Default columns
        }
        
        // Get all animal type properties from the first zone object
        const firstZone = zoneData[0];
        const animalTypes = Object.keys(firstZone).filter(key => 
            key !== 'id' && 
            key !== 'name' && 
            key !== 'count' && 
            key !== 'percentage' && 
            typeof firstZone[key] === 'number'
        );
        
        // Add animal types as columns
        const typeColumns = animalTypes.map(type => 
            // Capitalize first letter for display
            type.charAt(0).toUpperCase() + type.slice(1)
        );
        
        return [...baseColumns, ...typeColumns, 'Percentage'];
    }, [zoneData]);

    // Fetch time series data when filters or location changes
    const fetchTimeSeriesDataForDashboard = useCallback(async () => {
        setTimeSeriesLoading(true);
        setTimeSeriesError(null);

        try {
            // Use livestock data to build time series
            let data: TimeSeriesData[] = [];
            
            if (livestockCounts && livestockCounts.length > 0) {
                // Get unique animal types from livestock data
                const animalTypes = Array.from(new Set(livestockCounts.map(item => item.type)));
                
                // Group by date (following pattern from FarmRecords.tsx TrendsView)
                const dateMap: Record<string, Record<string, number>> = {};
                
                // Initialize with all dates in the range
                const dayDiff = Math.ceil((filters.end.getTime() - filters.start.getTime()) / (1000 * 60 * 60 * 24));
                for (let i = 0; i <= dayDiff; i++) {
                    const currentDate = new Date(filters.start);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    
                    // Initialize with count and all animal types
                    dateMap[dateStr] = { count: 0 };
                    
                    // Initialize all animal types with 0
                    animalTypes.forEach(type => {
                        dateMap[dateStr][type] = 0;
                    });
                }
                
                // Add livestock counts to the map
                livestockCounts.forEach(item => {
                    const dateStr = item.timestamp.split('T')[0];
                    if (!dateMap[dateStr]) {
                        dateMap[dateStr] = { count: 0 };
                        // Initialize all animal types with 0
                        animalTypes.forEach(type => {
                            dateMap[dateStr][type] = 0;
                        });
                    }
                    
                    // Add type if not exists
                    if (!dateMap[dateStr][item.type]) {
                        dateMap[dateStr][item.type] = 0;
                    }
                    
                    // Use manualCount if available (for MODIFIED status), otherwise use count
                    const actualCount = item.status === 'MODIFIED' && item.manualCount !== undefined 
                        ? item.manualCount 
                        : item.count;
                    
                    // Increment counts
                    dateMap[dateStr][item.type] += actualCount;
                    dateMap[dateStr].count += actualCount;
                });
                
                // Convert to array format expected by ChartSection - Ensure count is always present
                data = Object.entries(dateMap).map(([date, values]) => ({
                    date,
                    count: values.count,
                    ...values
                }));
                
                // Sort by date
                data.sort((a, b) => a.date.localeCompare(b.date));
                
                // Debug the first data item to see what properties it has
                if (data.length > 0) {
                    console.log('First timeSeriesData item after processing:', data[0]);
                }
            } else {
                // Use empty data when no livestock counts
                data = getEmptyTimeSeriesData(filters.start, filters.end, locationDetails);
            }

            setTimeSeriesData(data);
        } catch (error) {
            console.error('Failed to fetch time series data:', error);
            setTimeSeriesError(error instanceof Error ? error : new Error('Failed to fetch time series data'));
            // Use fallback data on error
            setTimeSeriesData(getEmptyTimeSeriesData(filters.start, filters.end, locationDetails));
            toast.error('Failed to load chart data. Using placeholder data instead.');
        } finally {
            setTimeSeriesLoading(false);
        }
    }, [filters.start, filters.end, locationDetails, livestockCounts]);

    // Fetch zone data when location changes
    const fetchZoneDataForDashboard = useCallback(async () => {
        setZoneLoading(true);
        setZoneError(null);

        try {
            // Use livestock data to build zone data
            let data: ZoneData[] = [];
            
            if (livestockCounts && livestockCounts.length > 0) {
                // Get unique zones from livestock counts
                const uniqueZones = new Set<string>();
                livestockCounts.forEach(detection => {
                    if (detection.zoneId) {
                        uniqueZones.add(detection.zoneId);
                    }
                });
                
                // Get unique animal types
                const animalTypes = Array.from(new Set(livestockCounts.map(item => item.type.toLowerCase())));
                
                if (uniqueZones.size === 0 && livestockCounts.length > 0) {
                    // If we have livestock but no zone data, create a default zone
                    const singleZone: any = {
                        id: 'default-zone',
                        name: livestockCounts[0].locationName || 'Default Zone',
                        count: 0,
                        percentage: 100  // Single zone gets 100%
                    };
                    
                    // Initialize all animal types with 0
                    animalTypes.forEach(type => {
                        singleZone[type] = 0;
                    });
                    
                    // Add all livestock to this zone
                    livestockCounts.forEach(detection => {
                        // Use manualCount if available (for MODIFIED status), otherwise use count
                        const actualCount = detection.status === 'MODIFIED' && detection.manualCount !== undefined 
                            ? detection.manualCount 
                            : detection.count;
                            
                        singleZone.count += actualCount;
                        
                        // Increment the count for this specific animal type
                        const animalType = detection.type.toLowerCase();
                        if (singleZone[animalType] !== undefined) {
                            singleZone[animalType] += actualCount;
                        } else {
                            singleZone[animalType] = actualCount;
                        }
                    });
                    
                    data = [singleZone];
                } else {
                    // Group livestock data by zone using a Map
                    const zoneMap = new Map<string, any>();
                    
                    // Initialize all zones from locationDetails if available
                    if (locationDetails?.Zone) {
                        locationDetails.Zone.forEach(zone => {
                            const zoneData: any = {
                                id: zone.id,
                                name: zone.name,
                                count: 0,
                                percentage: 0
                            };
                            
                            // Initialize all animal types with 0
                            animalTypes.forEach(type => {
                                zoneData[type] = 0;
                            });
                            
                            zoneMap.set(zone.id, zoneData);
                        });
                    }
                    
                    // Add counts from livestock data
                    livestockCounts.forEach(detection => {
                        if (!detection.zoneId) return;
                        
                        if (!zoneMap.has(detection.zoneId)) {
                            const newZone: any = {
                                id: detection.zoneId,
                                name: detection.zoneName || 'Unknown Zone',
                                count: 0,
                                percentage: 0
                            };
                            
                            // Initialize all animal types with 0
                            animalTypes.forEach(type => {
                                newZone[type] = 0;
                            });
                            
                            zoneMap.set(detection.zoneId, newZone);
                        }
                        
                        const zone = zoneMap.get(detection.zoneId)!;
                        
                        // Use manualCount if available (for MODIFIED status), otherwise use count
                        const actualCount = detection.status === 'MODIFIED' && detection.manualCount !== undefined 
                            ? detection.manualCount 
                            : detection.count;
                                
                        zone.count += actualCount;
                        
                        // Increment the count for this specific animal type
                        const animalType = detection.type.toLowerCase();
                        if (zone[animalType] !== undefined) {
                            zone[animalType] += actualCount;
                        } else {
                            zone[animalType] = actualCount;
                        }
                    });
                    
                    // Calculate total animals across all zones
                    const totalAnimals = Array.from(zoneMap.values()).reduce((sum, zone) => sum + zone.count, 0);
                    
                    // Calculate percentages
                    data = Array.from(zoneMap.values())
                        .filter(zone => zone.count > 0) // Only include zones with animals
                        .map(zone => ({
                            ...zone,
                            percentage: totalAnimals > 0 ? Math.round((zone.count / totalAnimals) * 100) : 0
                        }));
                }
            }
            
            setZoneData(data);
        } catch (error) {
            console.error('Failed to fetch zone data:', error);
            setZoneError(error instanceof Error ? error : new Error('Failed to fetch zone data'));
            setZoneData([]);
            toast.error('Failed to load zone data.');
        } finally {
            setZoneLoading(false);
        }
    }, [selectedLocationId, livestockCounts, locationDetails]);

    // Fetch data when filters or location changes
    useEffect(() => {
        fetchTimeSeriesDataForDashboard();
    }, [fetchTimeSeriesDataForDashboard]);

    useEffect(() => {
        fetchZoneDataForDashboard();
    }, [fetchZoneDataForDashboard]);

    // Update livestock data when filters change
    useEffect(() => {
        if (teamSlug) {
            fetchLivestockData(livestockFilters);
            fetchSummary(summaryFilters);
        }
    }, [teamSlug, livestockFilters, summaryFilters, fetchLivestockData, fetchSummary, filters]);

    // Add an effect to force fetch data on initial load
    useEffect(() => {
        if (teamSlug) {
            // Force initial data fetch
            fetchLivestockData(livestockFilters);
            fetchSummary(summaryFilters);
        }
    }, [teamSlug]); // Only run on initial component mount

    // Add an effect to immediately update charts when livestock data changes
    useEffect(() => {
        if (livestockCounts) {
            fetchTimeSeriesDataForDashboard();
            fetchZoneDataForDashboard();
        }
    }, [livestockCounts, fetchTimeSeriesDataForDashboard, fetchZoneDataForDashboard]);

    // Update current time periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(
                new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            );
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Handler functions
    const handleDateChange = (date: Date) => {
        const newDate = date || new Date();
        const startOfDay = new Date(newDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(newDate);
        endOfDay.setHours(23, 59, 59, 999);

        setStartDate(toZonedTime(startOfDay, TZ));
        setEndDate(toZonedTime(endOfDay, TZ));

        setFilters({
            ...filters,
            start: toZonedTime(startOfDay, TZ),
            end: toZonedTime(endOfDay, TZ),
        });
    };

    const handleSearch = () => {
        setFilters({
            ...filters,
            start: startDate,
            end: endDate,
        });
    };

    const handleQuickDateFilter = (days: number) => {
        const end = new Date();
        const start = subDays(end, days);

        const newStartDate = toZonedTime(start, TZ);
        const newEndDate = toZonedTime(end, TZ);

        setStartDate(newStartDate);
        setEndDate(newEndDate);

        setFilters({
            ...filters,
            start: newStartDate,
            end: newEndDate,
        });
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLocationId = e.target.value;
        setSelectedLocationId(newLocationId);
        // Reset dependent filters when location changes
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

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(e.target.value as DetectionStatus | '');
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
    };

    const handleRefresh = async () => {
        toast.success('Refreshing dashboard data...');

        // Refresh data from hooks
        if (selectedLocationId !== 'all') {
            await mutateLocationDetails();
        }
        await mutateLocations();

        // Refresh chart data
        fetchTimeSeriesDataForDashboard();
        fetchZoneDataForDashboard();
        
        // Refresh livestock data
        fetchLivestockData(livestockFilters);
        fetchSummary(summaryFilters);
    };

    // Check if loading or error state
    const isLoading = themeLoading || locationsLoading;
    const isError = locationsError;

    // Create a wrapper component for handling loading and error states for individual sections
    const WithSectionLoadingAndError = ({
        isLoading,
        error,
        children
    }: {
        isLoading: boolean,
        error: Error | null,
        children: React.ReactNode
    }) => {
        if (isLoading) {
            return (
                <Loading />
            );
        }

        if (error) {
            return (
                <ErrorComponent />
            );
        }

        return <>{children}</>;
    };

    return (
        <WithLoadingAndError isLoading={isLoading} error={isError}>
            <DashboardHeader
                title="Farm Dashboard"
                primaryColor={theme?.primaryColor || '#16355D'}
                currentTime={currentTime}
                formattedDate={format(filters.start, 'EEEE, dd MMMM yyyy')}
                showDatePicker={true}
                selectedDate={filters.start}
                onDateChange={handleDateChange}
            />

            <div className="p-4 pt-2 lg:px-8 -mt-24 relative z-10">
                <div className="w-full">
                    {/* Overview Section with Animal Cards */}
                    <AnimalCardsSection
                        totalAnimals={totalAnimals}
                        totalActive={totalActive}
                        totalInactive={totalInactive}
                        locationDetails={locationDetails}
                        selectedLocationId={selectedLocationId}
                        theme={theme}
                    />

                    {/* Controls Section - Filters, location selector, etc. */}
                    <DashboardFilters
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        selectedLocationId={selectedLocationId}
                        handleLocationChange={handleLocationChange}
                        handleRefresh={handleRefresh}
                        locations={locations}
                        dateFilterProps={{
                            filters,
                            startDate,
                            endDate,
                            setStartDate,
                            setEndDate,
                            handleSearch,
                            handleQuickDateFilter,
                            showFilters,
                            theme
                        }}
                        theme={theme}
                    />

                    {/* Extended Filters - Only show when filters are visible */}
                    {showFilters && (
                        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Zone Filter - Only show if location is selected */}
                                {selectedLocationId !== 'all' && locationDetails?.Zone && (
                                    <div>
                                        <label htmlFor="zone-select" className="block text-sm font-medium text-gray-700 mb-1">
                                            Zone
                                        </label>
                                        <select
                                            id="zone-select"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={selectedZoneId}
                                            onChange={handleZoneChange}
                                        >
                                            <option value="">All Zones</option>
                                            {locationDetails.Zone.map((zone) => (
                                                <option key={zone.id} value={zone.id}>
                                                    {zone.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Device Filter - Only show if zone is selected */}
                                {selectedZoneId && locationDetails?.Zone && (
                                    <div>
                                        <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-1">
                                            Device
                                        </label>
                                        <select
                                            id="device-select"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={selectedDeviceId}
                                            onChange={handleDeviceChange}
                                        >
                                            <option value="">All Devices</option>
                                            {locationDetails.Zone
                                                .find(z => z.id === selectedZoneId)?.devices?.map((device) => (
                                                    <option key={device.id} value={device.id}>
                                                        {device.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                {/* Status Filter */}
                                <div>
                                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        id="status-select"
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={selectedStatus}
                                        onChange={handleStatusChange}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="MODIFIED">Modified</option>
                                    </select>
                                </div>

                                {/* Type Filter - Only show types found in the data */}
                                {livestockCounts && livestockCounts.length > 0 && (
                                    <div>
                                        <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">
                                            Type
                                        </label>
                                        <select
                                            id="type-select"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={selectedType}
                                            onChange={handleTypeChange}
                                        >
                                            <option value="">All Types</option>
                                            {Array.from(new Set(livestockCounts.map(item => item.type))).map(type => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Animal Count Trend Chart */}
                        <WithSectionLoadingAndError 
                            isLoading={timeSeriesLoading || livestockCountLoading} 
                            error={timeSeriesError || (livestockCountError ? new Error(livestockCountError) : null)}
                        >
                            {viewMode === 'chart' ? (
                                <ChartSection
                                    timeSeriesData={timeSeriesData}
                                    viewMode={viewMode}
                                    selectedLocationId={selectedLocationId}
                                    theme={theme}
                                />
                            ) : (
                                <Table 
                                    heading="Livestock Count Table"
                                    cols={timeSeriesColumns}
                                    body={prepareTimeSeriesTableData()}
                                    noMoreResults={timeSeriesData.length === 0 || !timeSeriesData.some(data => data.count > 0)}
                                />
                            )}
                        </WithSectionLoadingAndError>

                        {/* Zone-wise Count Section - Show even when no zoneData but we have livestockCounts */}
                        {(selectedLocationId !== 'all' || (livestockCounts && livestockCounts.length > 0)) && (
                            <WithSectionLoadingAndError 
                                isLoading={zoneLoading} 
                                error={zoneError}
                            >
                                {viewMode === 'chart' ? (
                                    <ZoneChartSection
                                        zoneData={zoneData}
                                        viewMode={viewMode}
                                        theme={theme}
                                    />
                                ) : (
                                    <Table 
                                        heading="Zone Count Table"
                                        cols={zoneColumns}
                                        body={prepareZoneTableData()}
                                        noMoreResults={zoneData.length === 0}
                                    />
                                )}
                            </WithSectionLoadingAndError>
                        )}

                        {/* Show message when no data is available in selected date range */}
                        {timeSeriesData && timeSeriesData.length > 0 && !timeSeriesData.some(data => data.count > 0) && (
                            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                <h2 className="text-xl font-medium text-gray-900 mb-4">
                                    No data for selected period
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Records exist but not in the selected date range
                                </p>
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Adjust Date Range
                                </button>
                            </div>
                        )}

                        {/* Show alternative content when no data is available */}
                        {(!livestockCounts || livestockCounts.length === 0) && (
                            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                <h2 className="text-xl font-medium text-gray-900 mb-4">
                                    No data available
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Try different filters to see livestock data
                                </p>
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Adjust Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </WithLoadingAndError>
    );
};

export default FarmDashboard;
