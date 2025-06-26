import React, { useMemo } from 'react';
import { DetectionStatus } from '@prisma/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmptyStateMessage } from './common/EmptyStateMessage';

interface LivestockDetection {
    id: string;
    type: string;
    count: number;
    status: DetectionStatus;
    zoneId: string;
    zoneName: string;
    // ...other fields
}

interface ZoneDistributionProps {
    livestockCounts: LivestockDetection[];
    theme: any;
    chartColors: string[];
    statusLabels: Record<DetectionStatus, string>;
    statusColors: Record<DetectionStatus, string>;
}

export const ZoneDistribution: React.FC<ZoneDistributionProps> = ({
    livestockCounts,
    theme
}) => {
    // Process data for zone distribution
    const livestockByZone = useMemo(() => {
        if (!livestockCounts || livestockCounts.length === 0) return [];

        const zoneMap = new Map<string, { id: string, count: number, name: string }>();

        // Group by zone
        livestockCounts.forEach(item => {
            const zoneData = zoneMap.get(item.zoneId) || { id: item.zoneId, count: 0, name: item.zoneName };
            zoneMap.set(item.zoneId, {
                ...zoneData,
                count: zoneData.count + item.count
            });
        });

        return Array.from(zoneMap.values()).map(zone => ({
            zone: zone.name,
            count: zone.count,
            id: zone.id
        }));
    }, [livestockCounts]);

    // If no data is available, show empty state
    if (!livestockCounts || livestockCounts.length === 0) {
        return <EmptyStateMessage message="No zone data available" description="No livestock detections found for the selected zone filters." />;
    }

    return (
        <div className="bg-white dark:bg-surfaceColor p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Livestock by Zone</h2>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={livestockByZone}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="zone" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} animals`, 'Count']} />
                        <Legend />
                        <Bar dataKey="count" name="Animal Count" fill={theme?.primaryColor || "#8884d8"} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
