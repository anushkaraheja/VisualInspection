import React, { useMemo } from 'react';
import { DetectionStatus } from '@prisma/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmptyStateMessage } from './common/EmptyStateMessage';

interface LivestockDetection {
    id: string;
    type: string;
    count: number;
    status: DetectionStatus;
    averageConfidence: number;
    // ...other fields
}

interface SpeciesDistributionProps {
    livestockCounts: LivestockDetection[];
    theme: any;
    chartColors: string[];
    statusLabels: Record<DetectionStatus, string>;
    statusColors: Record<DetectionStatus, string>;
}

export const SpeciesDistribution: React.FC<SpeciesDistributionProps> = ({
    livestockCounts,
    chartColors
}) => {
    // Process data for visualizations
    const livestockBySpecies = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0) return [];

        const typeMap = new Map<string, number>();

        // Sum up counts by type
        livestockCounts.forEach(item => {
            const count = typeMap.get(item.type) || 0;
            typeMap.set(item.type, count + item.count);
        });

        // Convert to array for chart
        return Array.from(typeMap.entries()).map(([type, count], index) => ({
            name: type,
            count,
            color: chartColors[index % chartColors.length]
        }));
    }, [livestockCounts, chartColors]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0)
            return {
                total: 0,
                avgConfidence: 0,
                types: 0,
                pendingCount: 0
            };

        let totalAnimals = 0;
        let totalConfidence = 0;
        const types = new Set<string>();
        let pendingCount = 0;

        livestockCounts.forEach(item => {
            totalAnimals += item.count;
            totalConfidence += item.averageConfidence;
            types.add(item.type);
            if (item.status === 'PENDING') pendingCount++;
        });

        return {
            total: totalAnimals,
            avgConfidence: livestockCounts.length > 0 ?
                ((totalConfidence / livestockCounts.length) * 100).toFixed(1) : '0',
            types: types.size,
            pendingCount
        };
    }, [livestockCounts]);

    // If no data is available, show empty state
    if (!livestockCounts || livestockCounts.length === 0) {
        return <EmptyStateMessage message="No species data available" />;
    }

    return (
        <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Livestock by Species</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={livestockBySpecies}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {livestockBySpecies.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} animals`, 'Count']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={livestockBySpecies}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip formatter={(value) => [`${value} animals`, 'Count']} />
                            <Bar dataKey="count" name="Count">
                                {livestockBySpecies.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Panel */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Livestock Detection Insight</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    {`Your farm currently has ${summary.total} detected livestock animals across ${summary.types} different types.`}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                    {`Average detection confidence is ${summary.avgConfidence}%. ${summary.pendingCount} detection(s) require review.`}
                </p>
            </div>
        </div>
    );
};
