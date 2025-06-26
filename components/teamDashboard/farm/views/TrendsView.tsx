import React, { useMemo } from 'react';
import { DetectionStatus } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmptyStateMessage } from './common/EmptyStateMessage';

interface LivestockDetection {
    id: string;
    type: string;
    count: number;
    status: DetectionStatus;
    timestamp: string;
    // ...other fields
}

interface TrendsViewProps {
    livestockCounts: LivestockDetection[];
    theme: any;
    chartColors: string[];
    statusLabels: Record<DetectionStatus, string>;
    statusColors: Record<DetectionStatus, string>;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
    livestockCounts,
    theme,
    chartColors
}) => {
    // Process data for livestock trends
    const livestockTrends = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0) return [];

        // Group by date and sum counts
        const dateMap = new Map<string, { date: string, total: number, [key: string]: any }>();

        livestockCounts.forEach(item => {
            const date = item.timestamp.substring(0, 10); // YYYY-MM-DD
            const existing = dateMap.get(date) || { date, total: 0 };

            // Add to total
            existing.total = (existing.total || 0) + item.count;

            // Add to type-specific count
            existing[item.type] = (existing[item.type] || 0) + item.count;

            dateMap.set(date, existing);
        });

        // Convert to array and sort by date
        return Array.from(dateMap.values())
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [livestockCounts]);

    // Get unique livestock types for creating individual trend lines
    const livestockTypes = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0) return [];
        
        const types = new Set<string>();
        livestockCounts.forEach(item => types.add(item.type));
        
        return Array.from(types).map((type, index) => ({
            name: type,
            color: chartColors[index % chartColors.length]
        }));
    }, [livestockCounts, chartColors]);

    // If no data is available, show empty state
    if (!livestockCounts || livestockCounts.length === 0) {
        return <EmptyStateMessage message="No trend data available" description="Select a different timeframe or check back later for trend data." />;
    }

    return (
        <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Livestock Count Trends</h2>
            <div>
                {/* Total trend chart */}
                <div className="h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={livestockTrends}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => {
                                    if (typeof date === 'string') {
                                        return date.substring(5); // Display as MM-DD
                                    }
                                    return '';
                                }}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label) => {
                                    if (typeof label === 'string') {
                                        return format(parseISO(label), 'MMMM dd, yyyy');
                                    }
                                    return '';
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total"
                                name="Total"
                                stroke={theme?.primaryColor || "#8884d8"}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Per-species trend chart */}
                <h3 className="text-lg font-medium mb-4 dark:text-white">Trends by Species</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={livestockTrends}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => {
                                    if (typeof date === 'string') {
                                        return date.substring(5); // Display as MM-DD
                                    }
                                    return '';
                                }}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(label) => {
                                    if (typeof label === 'string') {
                                        return format(parseISO(label), 'MMMM dd, yyyy');
                                    }
                                    return '';
                                }}
                            />
                            <Legend />
                            {livestockTypes.map((species) => (
                                <Line
                                    key={species.name}
                                    type="monotone"
                                    dataKey={species.name}
                                    name={species.name}
                                    stroke={species.color}
                                    strokeWidth={2}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
