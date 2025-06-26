import { parsePythonJSON } from '@/lib/stream/streamHelper';
import { useState, useEffect } from 'react';

export function useWebvisData(url: string) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${url}/main/data`);

    eventSource.onmessage = function (event) {
      const jsonString = parsePythonJSON(event.data as string);
      setStatus(jsonString);
    };

    return () => eventSource.close();
  }, [url]);

  return status ? JSON.parse(status) : null;
}
