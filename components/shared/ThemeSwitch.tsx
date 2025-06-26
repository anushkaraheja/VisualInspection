import React from 'react';
import { useTranslation } from 'next-i18next';
import useTheme from 'hooks/useTheme';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface ThemeSwitchProps {
  showText?: boolean;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ showText = false }) => {
  const { selectedTheme, setTheme, themes } = useTheme();
  const { t } = useTranslation('common');

  const Icon = selectedTheme.icon;

  const handleThemeChange = () => {
    // Cycle through themes: light -> dark -> system -> light
    const currentIndex = themes.findIndex((t) => t.id === selectedTheme.id);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  };

  // Calculate position based on selected theme - adjusted for better alignment
  const getKnobPosition = () => {
    switch (selectedTheme.id) {
      case 'system':
        return 'calc(50% - 10px)'; // Center position
      case 'light':
        return '3px'; // Left position
      case 'dark':
        return 'calc(100% - 24px)'; // Right position
      default:
        return '3px';
    }
  };

  return (
    <div className="flex items-center mr-3">
      <button
        onClick={handleThemeChange}
        className="relative w-[68px] h-7 rounded-full bg-gray-200 dark:bg-gray-700 p-1 transition-colors duration-200"
        aria-label={t('change_theme')}
      >
        {/* Track with theme indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-[10px] pointer-events-none">
          <SunIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          <ComputerDesktopIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          <MoonIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Moving knob - improved positioning */}
        <div
          className="absolute top-1 h-5 w-5 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center shadow-md transition-all duration-200"
          style={{ left: getKnobPosition() }}
        >
          <Icon className="h-3 w-3 text-gray-700 dark:text-gray-300" />
        </div>

        <span className="sr-only">
          {t('current_theme')}: {selectedTheme.name}
        </span>
      </button>

      {showText && (
        <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
          {selectedTheme.name}
        </span>
      )}
    </div>
  );
};

export default ThemeSwitch;
