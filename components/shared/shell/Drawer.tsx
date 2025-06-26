import React from 'react';
import DrawerMenuList from '../DrawerMenuList';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import { useTranslation } from 'next-i18next';
import useCanAccess from 'hooks/useCanAccess';

interface DrawerProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Drawer = ({ sidebarOpen, setSidebarOpen }: DrawerProps) => {
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();

  return (
    <>
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          {/* Dark mode overlay */}
          <div className="fixed inset-0 bg-gray-600/80 dark:bg-backgroundColor" />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">{t('close-sidebar')}</span>
                  <XMarkIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </button>
              </div>
              {/* Dark mode drawer background */}
              <div className="flex grow flex-col gap-y-5 overflow-hidden bg-white dark:bg-backgroundColor px-6 pb-4">
                <DrawerMenuList />
                <div className="flex-grow" />
                <Navigation />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (when not collapsed) */}
      <div className="hidden mt-20 z-0 pt-4 bg-white dark:bg-backgroundColor shadow-[2px_0px_36px_rgba(0,0,0,0.16)] opacity-100 lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col justify-between h-full overflow-hidden border-r border-gray-200 dark:border-gray-700 px-6">
          <DrawerMenuList />
          <div className="flex-grow" />
          <Navigation />
        </div>
      </div>
    </>
  );
};

export default Drawer;
