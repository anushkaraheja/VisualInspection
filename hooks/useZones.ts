import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Zone {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  devices?: any[];
}

const useZones = (locationId?: string) => {
  const router = useRouter();
  const { slug } = router.query;
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      if (!slug || !locationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/teams/${slug}/locations/${locationId}/zones`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch zones');
        }

        const data = await response.json();
        setZones(data.data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching zones:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [slug, locationId]);

  return {
    zones,
    isLoading,
    isError: error,
    setZones,
  };
};

export default useZones;
