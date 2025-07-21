import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { useTheme as useNextTheme } from 'next-themes';

import { ThemesProps } from '@/lib/theme';

const useTheme = () => {
  const { theme, setTheme } = useNextTheme();
  const { t } = useTranslation('common');

  const themes: ThemesProps[] = [
    {
      id: 'system',
      name: t('system'),
      icon: ComputerDesktopIcon,
    },
    {
      id: 'dark',
      name: t('dark'),
      icon: MoonIcon,
    },
    {
      id: 'light',
      name: t('light'),
      icon: SunIcon,
    },
  ];

  const selectedTheme = themes.find((t) => t.id === theme) || themes[0];

  const toggleTheme = () => {
    if (selectedTheme.id === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };
  return { theme, setTheme, selectedTheme, toggleTheme, themes };
};

export default useTheme;
