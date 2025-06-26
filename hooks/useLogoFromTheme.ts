import { useEffect, useState } from 'react';

const useLogoFromTheme = (slug: string) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(
          `/api/teams/${slug}/orgTheme?element=logo`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch logo');
        }

        const data = await response.json();
        setLogo(data.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [slug]);

  return { logo, loading, error };
};

export default useLogoFromTheme;
