import React, { useMemo } from 'react';
import { DetectionStatus } from '@prisma/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmptyStateMessage } from './common/EmptyStateMessage';

interface LivestockDetection {
    id: string;
    type: string;
    count: number;
    status: DetectionStatus;
    // ...other fields
}

interface StatusDistributionProps {
    livestockCounts: LivestockDetection[];
    theme: any;
    chartColors: string[];
    statusLabels: Record<DetectionStatus, string>;
    statusColors: Record<DetectionStatus, string>;
}

export const StatusDistribution: React.FC<StatusDistributionProps> = ({
    livestockCounts,
    statusLabels,
    statusColors
}) => {
    // Process data for status distribution
    const livestockByStatus = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0) return [];

        const statusMap = new Map<DetectionStatus, number>();

        // Count items by status
        livestockCounts.forEach(item => {
            const count = statusMap.get(item.status) || 0;
            statusMap.set(item.status, count + 1);
        });

        // Convert to array for chart
        return Array.from(statusMap.entries()).map(([status, count]) => ({
            status,
            label: statusLabels[status],
            count,
            color: statusColors[status]
        }));
    }, [livestockCounts, statusLabels, statusColors]);

    // If no data is available, show empty state
    if (!livestockCounts || livestockCounts.length === 0) {
        return <EmptyStateMessage message="No status data available" description="No livestock detections found for the selected filters." />;
    }

    return (
        <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Detection Status Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={livestockByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="label"
                            >
                                {livestockByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} detections`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={livestockByStatus}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="label" type="category" />
                            <Tooltip formatter={(value) => [`${value} detections`, 'Count']} />
                            <Bar dataKey="count" name="Count">
                                {livestockByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
