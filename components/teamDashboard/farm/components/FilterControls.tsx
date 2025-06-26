import React from 'react';
import { DetectionStatus } from '@prisma/client';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { statusOptions, timeRangeOptions, viewOptions } from '../constants';
import { LocationWithAnimalsAndZonesAndVendors } from 'hooks/useLocationHooks';

interface FilterControlsProps {
    locations: LocationWithAnimalsAndZonesAndVendors[];
    locationDetails: any;
    filters: {
        selectedLocationId: string;
        selectedZoneId: string;
        selectedDeviceId: string;
        selectedTimeframe: string;
        selectedView: string;
        selectedStatus: DetectionStatus | '';
        selectedType: string;
    };
    handlers: {
        handleLocationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleZoneChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleDeviceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleTimeframeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleViewChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        handleRefresh: () => void;
    };
    livestockTypes: string[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({
    locations,
    locationDetails,
    filters,
    handlers,
    livestockTypes
}) => {
    // Get the available zones based on selected location
    const availableZones = filters.selectedLocationId && locationDetails?.Zone 
        ? locationDetails.Zone 
        : [];

    // Get the available devices based on selected zone
    const availableDevices = filters.selectedZoneId
        ? locationDetails?.Zone?.find(zone => zone.id === filters.selectedZoneId)?.devices || []
        : [];

    return (
        <div className="bg-white dark:bg-surfaceColor mb-6 p-4 rounded-lg shadow-sm">
            {/* First Row: Location, Zone, Device, Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {/* Location Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Location</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedLocationId}
                        onChange={handlers.handleLocationChange}
                    >
                        <option value="">All Locations</option>
                        {locations?.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Zone Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Zone</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedZoneId}
                        onChange={handlers.handleZoneChange}
                        disabled={!filters.selectedLocationId}
                    >
                        <option value="">All Zones</option>
                        {availableZones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                                {zone.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Device Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Device</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedDeviceId}
                        onChange={handlers.handleDeviceChange}
                        disabled={!filters.selectedZoneId}
                    >
                        <option value="">All Devices</option>
                        {availableDevices.map((device) => (
                            <option key={device.id} value={device.id}>
                                {device.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Range Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Time Range</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedTimeframe}
                        onChange={handlers.handleTimeframeChange}
                    >
                        {timeRangeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Second Row: View, Status, Type, Refresh Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* View Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">View</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedView}
                        onChange={handlers.handleViewChange}
                    >
                        {viewOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Status</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedStatus}
                        onChange={handlers.handleStatusChange}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Livestock Type Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">Livestock Type</label>
                    <select
                        className="block w-full border border-gray-300 dark:border-borderColor rounded-md shadow-sm py-2 px-3 
                        focus:outline-none focus:ring-primary focus:border-primary sm:text-sm
                        bg-white dark:bg-surfaceColor dark:text-textColor"
                        value={filters.selectedType}
                        onChange={handlers.handleTypeChange}
                    >
                        <option value="">All Types</option>
                        {livestockTypes.map(type => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Refresh Button */}
                <div className="flex items-end">
                    <ButtonFromTheme
                        className="flex items-center px-4 py-2 rounded-md text-white font-normal"
                        onClick={handlers.handleRefresh}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                    </ButtonFromTheme>
                </div>
            </div>
        </div>
    );
};
