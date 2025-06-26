import { prepareFormData } from '@/lib/stream/streamHelper';
import { useState } from 'react';

interface CSVDataParams {
  start: Date;
  end: Date;
  // Add other filter fields as needed
}

export const useDownloadCSV = ({ params }: { params: CSVDataParams }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadCSV = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(
        prepareFormData(params)
      ).toString();
      const response = await fetch(
        `http://172.206.1.94:8002/download-csv/?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      setIsLoading(false);
      return blob;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { downloadCSV, isLoading, error };
};
