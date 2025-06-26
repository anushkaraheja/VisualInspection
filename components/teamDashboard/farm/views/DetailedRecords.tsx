import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { DetectionStatus } from '@prisma/client';
import { Table } from '@/components/shared/table/Table';
import { toast } from 'react-hot-toast';
import { EmptyStateMessage } from './common/EmptyStateMessage';
import { TableBodyType } from '@/components/shared/table/TableBody';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaCheck,
    FaTimes
} from 'react-icons/fa';
import { ImPencil } from 'react-icons/im';
import { TbArrowsExchange } from "react-icons/tb";

interface LivestockDetection {
    id: string;
    timestamp: string;
    type: string;
    count: number;
    manualCount?: number;
    averageConfidence: number;
    status: DetectionStatus;
    locationName: string;
    zoneName: string;
    // ...other fields
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface DetailedRecordsProps {
    livestockCounts: LivestockDetection[];
    pagination: Pagination | null;
    statusLabels: Record<DetectionStatus, string>;
    statusColors: Record<DetectionStatus, string>;
    updateDetection: (id: string, status: DetectionStatus, manualCount?: number) => Promise<boolean>;
    fetchData: (filters: any) => Promise<void>;
    filters: any;
}

export const DetailedRecords: React.FC<DetailedRecordsProps> = ({
    livestockCounts,
    pagination,
    statusLabels,
    statusColors,
    updateDetection,
    fetchData,
    filters
}) => {
    // Use pagination.limit from API response if available, otherwise default to 25
    const defaultRowsPerPage = pagination?.limit || 25;
    const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
    const [editingRecord, setEditingRecord] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [showStatusOptions, setShowStatusOptions] = useState<string | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);

    // Update local state when pagination from API changes
    useEffect(() => {
        if (pagination) {
            setCurrentPage(pagination.page);
            // Only update rows per page if it's different from current value
            // and we're not in the middle of changing it ourselves
            if (pagination.limit !== rowsPerPage) {
                setRowsPerPage(pagination.limit);
            }
        }
    }, [pagination, rowsPerPage]);

    // Handler for updating status
    const handleUpdateStatus = async (id: string, newStatus: DetectionStatus, manualCount?: number) => {
        const success = await updateDetection(id, newStatus, manualCount);
        if (success) {
            toast.success(`Successfully updated detection status to ${statusLabels[newStatus]}`);
            // Reset editing state
            setEditingRecord(null);
            setShowStatusOptions(null);
        } else {
            toast.error('Failed to update detection status');
        }
    };

    // Improved handler for page changes that properly updates server-side fetching
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchData({
            ...filters,
            page,
            limit: rowsPerPage
        });
    };

    // Handler for rows per page change - debounced to prevent rapid changes
    const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        setCurrentPage(1); // Reset to first page when changing rows per page
        
        // Fetch with new limit
        fetchData({
            ...filters,
            page: 1,
            limit: newRowsPerPage
        });
    }, [fetchData, filters]);

    // Start editing a record
    const startEditing = (id: string, currentCount: number) => {
        setEditingRecord(id);
        setEditValue(currentCount);
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingRecord(null);
    };

    // Save edited value
    const saveEditedValue = (id: string) => {
        handleUpdateStatus(id, 'MODIFIED', editValue);
    };

    // Toggle status options display
    const toggleStatusOptions = (id: string) => {
        setShowStatusOptions(showStatusOptions === id ? null : id);
    };

    // Custom pagination dropdown component
    const customPaginationDropdown = (
        <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-textColor mr-2">Rows per page:</span>
            <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="bg-[#F9F9F9] dark:bg-surfaceColor border border-[#EFEFF4] dark:border-borderColor rounded-md px-2 py-1 text-sm"
            >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </select>
        </div>
    );

    // If no data is available, show empty state
    if (!livestockCounts || livestockCounts.length === 0) {
        return <EmptyStateMessage message="No records available" description="No livestock detections found for the selected filters." />;
    }

    // Prepare table data properly typed for TableBodyType
    const tableColumns = ['S.No', 'Date', 'Type', 'Original Count', 'Manual Count', 'Confidence', 'Status', 'Location', 'Zone', 'Actions'];

    const tableData: TableBodyType[] = livestockCounts.map((record, index) => {
        // Calculate serial number based on current page and limit
        const serialNumber = ((pagination?.page || 1) - 1) * (pagination?.limit || 25) + index + 1;

        // Handle editing for the count column
        const countEditingControls = editingRecord === record.id ? (
            <div className="flex items-center">
                <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border rounded dark:bg-surfaceColor dark:text-textColor dark:border-borderColor"
                    autoFocus
                />
                <button 
                    onClick={() => saveEditedValue(record.id)}
                    className="ml-2 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
                    title="Save"
                >
                    <FaCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
                </button>
                <button 
                    onClick={cancelEditing}
                    className="ml-1 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                    title="Cancel"
                >
                    <FaTimes className="h-3 w-3 text-red-600 dark:text-red-400" />
                </button>
            </div>
        ) : undefined;

        // Create status change options
        const statusChangeOptions = () => {
            if (showStatusOptions !== record.id) return null;
            
            const statuses = Object.values(DetectionStatus).filter(s => s !== record.status);
            
            return (
                <div className="absolute right-0 mt-2 py-2 w-40 bg-white dark:bg-surfaceColor rounded-md shadow-lg z-10 border dark:border-borderColor">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-textColor hover:bg-gray-100 dark:hover:bg-surfaceColor/90"
                            onClick={() => {
                                handleUpdateStatus(record.id, status);
                                setShowStatusOptions(null);
                            }}
                        >
                            {statusLabels[status]}
                        </button>
                    ))}
                </div>
            );
        };

        // Create action buttons with icons
        const actionButtons = (
            <div className="flex space-x-3 items-center">
                {record.status === 'PENDING' && (
                    <>
                        <button
                            onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surfaceColor focus:outline-none"
                            title="Approve"
                        >
                            <FaThumbsUp className="h-3 w-3 text-textColor dark:text-textColor" />
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(record.id, 'REJECTED')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surfaceColor focus:outline-none"
                            title="Reject"
                        >
                            <FaThumbsDown className="h-3 w-3 text-textColor dark:text-textColor" />
                        </button>
                    </>
                )}
                
                {/* Show these buttons for all records */}
                <button
                    onClick={() => startEditing(record.id, record.manualCount ?? record.count)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surfaceColor focus:outline-none"
                    title="Modify Count"
                    disabled={editingRecord === record.id}
                >
                    <ImPencil className="h-3 w-3 text-textColor dark:text-textColor" />
                </button>
                
                <div className="relative">
                    <button
                        onClick={() => toggleStatusOptions(record.id)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surfaceColor focus:outline-none"
                        title="Change Status"
                    >
                        <TbArrowsExchange className="h-3 w-3 text-textColor dark:text-textColor" />
                    </button>
                    {statusChangeOptions()}
                </div>
            </div>
        );

        return {
            id: record.id,
            cells: [
                // Serial Number - sequential per entry
                { text: serialNumber.toString() },

                // Date - wrap string in a text object
                { text: format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm') },

                // Type
                { text: record.type },

                // Original Count (not editable)
                { text: record.count.toString() },

                // Manual Count - separate column
                {
                    element: editingRecord === record.id ? (
                        countEditingControls
                    ) : (
                        <span className={record.manualCount !== undefined && record.manualCount !== null ? "font-medium" : "text-gray-400 dark:text-gray-500"}>
                            {record.manualCount !== undefined && record.manualCount !== null ? record.manualCount : '-'}
                        </span>
                    )
                },

                // Confidence
                { text: `${(record.averageConfidence * 100).toFixed(1)}%` },

                // Status - use element for styled content
                {
                    element: (
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                                backgroundColor: statusColors[record.status] + '20',
                                color: statusColors[record.status]
                            }}>
                            {statusLabels[record.status]}
                        </span>
                    )
                },

                // Location
                { text: record.locationName },

                // Zone
                { text: record.zoneName },

                // Actions - use element for icon buttons
                {
                    element: actionButtons
                }
            ]
        };
    });

    // Create pagination summary for easy visibility
    const renderPaginationSummary = () => {
        if (!pagination) return null;
        
        const startRecord = ((pagination.page - 1) * pagination.limit) + 1;
        const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);
        
        return (
            <div className="text-sm text-gray-500 dark:text-textColor mb-3">
                Showing {startRecord} to {endRecord} of {pagination.total} records
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Detailed Livestock Detection Records</h2>
            
            {/* Pagination summary */}
            {renderPaginationSummary()}
            
            <Table
                heading="Livestock Count Records"
                cols={tableColumns}
                body={tableData}
                onPageChange={handlePageChange}
                totalPages={pagination?.pages || 1}
                currentPage={currentPage}
                showDropdown={false}
                customDropdown={customPaginationDropdown}
            />
        </div>
    );
};
