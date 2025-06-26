import { Theme } from '@prisma/client';
import { useEffect, useState } from 'react';
import useColors from './useColors';
// Cache to store themes by slug
const themeCache: Record<string, Theme> = {};

const defaultTheme: Theme = {
  primaryColor: '#16355D',
  secondaryColor: '#BA2025',
  teamId: '',
  logo: null,
  id: 0,
};

const useOrgTheme = (slug?: string) => {
  const [theme, setTheme] = useState<Theme>(slug && themeCache[slug] ? themeCache[slug] : defaultTheme);
  const [loading, setLoading] = useState<boolean>(slug ? !themeCache[slug] : false);
  const [error, setError] = useState<string | null>(null);
  const { applyColor } = useColors();

  useEffect(() => {
    // If slug is undefined or empty, use default theme
    if (!slug) {
      setTheme(defaultTheme);
      setLoading(false);
      return;
    }

    // If we already have cached data for this slug, don't fetch again
    if (themeCache[slug]) {
      return;
    }

    const fetchTheme = async () => {
      try {
        const response = await fetch(`/api/teams/${slug}/orgTheme`);
        if (!response.ok) {
          throw new Error('Failed to fetch theme');
        }

        const data = await response.json();
        setTheme(data.data);
        // Cache the theme data for future use
        themeCache[slug] = data.data;
        applyColor('primary', data.data.primaryColor);
        applyColor('secondary', data.data.secondaryColor);
      } catch (err) {
        console.error('Error fetching theme:', err);
        setError((err as Error).message);
        // Use default theme on error
        setTheme(defaultTheme);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [slug]);

  return { theme, loading, error };
};

export default useOrgTheme;