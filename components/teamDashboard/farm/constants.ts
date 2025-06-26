import { DetectionStatus } from '@prisma/client';

// Status labels for UI display
export const statusLabels: Record<DetectionStatus, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    MODIFIED: 'Manually Adjusted'
};

// Color mapping for status indicators
export const statusColors: Record<DetectionStatus, string> = {
    PENDING: '#FCD34D', // Yellow
    APPROVED: '#10B981', // Green
    REJECTED: '#EF4444', // Red
    MODIFIED: '#8B5CF6'  // Purple
};

// Colors for charts
export const chartColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042',
    '#a4de6c', '#d0ed57', '#8dd1e1', '#83a6ed'
];

// Time range options
export const timeRangeOptions = [
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' }
];

// View options
export const viewOptions = [
    { value: 'species', label: 'By Species' },
    { value: 'zones', label: 'By Zone' },
    { value: 'trends', label: 'Trends' },
    { value: 'status', label: 'Status Distribution' },
    { value: 'detailed', label: 'Detailed Records' }
];

// Status filter options
export const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'MODIFIED', label: 'Manually Adjusted' }
];
