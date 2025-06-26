import { useState, useCallback, useMemo } from 'react';
import { subDays, format } from 'date-fns';

export function useDateRange(initialTimeframe: string) {
    // Initialize date range based on timeframe
    const [dateRangeState, setDateRangeState] = useState(() => {
        const end = new Date();
        let start;

        switch (initialTimeframe) {
            case '1m':
                start = subDays(end, 30);
                break;
            case '3m':
                start = subDays(end, 90);
                break;
            case '6m':
                start = subDays(end, 180);
                break;
            case '1y':
                start = subDays(end, 365);
                break;
            default:
                start = subDays(end, 180); // Default to 6 months
        }

        return { start, end };
    });

    // Memoize the date range to prevent unnecessary re-renders
    const dateRange = useMemo(() => dateRangeState, [dateRangeState]);

    // Memoize the formatted date strings for API requests
    const dateRangeStrings = useMemo(() => ({
        startDate: format(dateRange.start, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        endDate: format(dateRange.end, "yyyy-MM-dd'T'HH:mm:ss'Z'")
    }), [dateRange.start, dateRange.end]);

    // Function to update date range when timeframe changes
    const updateDateRangeFromTimeframe = useCallback((timeframe: string) => {
        const end = new Date();
        let start;

        switch (timeframe) {
            case '1m':
                start = subDays(end, 30);
                break;
            case '3m':
                start = subDays(end, 90);
                break;
            case '6m':
                start = subDays(end, 180);
                break;
            case '1y':
                start = subDays(end, 365);
                break;
            default:
                start = subDays(end, 180);
        }

        setDateRangeState({ start, end });
    }, []);

    return {
        dateRange,
        dateRangeStrings,
        updateDateRangeFromTimeframe,
        setDateRangeState
    };
}
