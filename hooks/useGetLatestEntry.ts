import { convertToUserLocalDate } from '@/lib/stream/streamHelper';
import { useEffect, useState } from 'react';

export const useGetLatestEntry = (url: string) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchLatestEntry = async () => {
      try {
        const response = await fetch(`${url}latest-entry`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();

        if (result.end === null) {
          setData({
            ...result,
            vendor_date: convertToUserLocalDate(result.vendor_date),
          });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching latest entry:', error);
        if (error instanceof TypeError) {
          console.error('Failed to fetch');
        }
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestEntry();
  }, []);

  return { data, isLoading, isError };
};
