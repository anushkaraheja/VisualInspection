import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

export interface Detection {
  id: string;
  timestamp: Date;
  timeAgo: string;
  zone: string;
  camera: string;
  eventType: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  personId: string;
  imageUrl?: string; // Added optional image URL
}

interface UseRecentDetectionsOptions {
  sortBy?: 'time' | 'zone' | 'camera' | 'eventType' | 'severity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  camera?: string;
}

/**
 * Hook to fetch recent PPE compliance detections for a team
 * @param teamSlug The team slug to fetch detections for
 * @param options Optional configuration options
 */
export function useRecentDetections(
  teamSlug: string | undefined,
  options: UseRecentDetectionsOptions = {}
) {
  const { sortBy = 'time', sortOrder = 'desc', limit = 50, camera } = options;

  const cameraParam = camera ? `&camera=${encodeURIComponent(camera)}` : '';
  
  // Set refresh interval based on environment
  const refreshInterval = process.env.NODE_ENV === 'production' ? 1000 : 10000;

  const { data, error, isLoading, mutate } = useSWR<Detection[]>(
    teamSlug
      ? `/api/teams/${teamSlug}/detections?sortBy=${sortBy}&order=${sortOrder}&limit=${limit}${cameraParam}`
      : null,
    fetcher,
    { refreshInterval } // 1 second in production, 10 seconds otherwise
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
