import { useTranslation } from 'next-i18next';
import { FaChartLine, FaTable } from 'react-icons/fa6';
import { IoFilter } from 'react-icons/io5';
import { HiOutlineRefresh } from 'react-icons/hi';
import ExportToCSVButton from '@/components/shared/ExportToCSVButton';
import classNames from 'classnames';
import DateFilterSection from './DateFilterSection';
import { DashboardFiltersProps } from '../types';

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  selectedLocationId,
  handleLocationChange,
  handleRefresh,
  locations = [],
  dateFilterProps,
  theme
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="bg-white dark:bg-surfaceColor rounded-lg shadow-sm mb-6 overflow-hidden">
      {/* Top controls bar - Always visible, minimal design */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
        {/* Left side - View toggle */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex bg-gray-50 dark:bg-gray-800 rounded-md p-0.5 text-sm">
            <button
              className={classNames(
                "px-3 py-1 rounded-md transition-colors",
                viewMode === 'chart' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              onClick={() => setViewMode('chart')}
              aria-label="Chart view"
            >
              <FaChartLine className="inline mr-1" />
              {t('chart')}
            </button>
            <button
              className={classNames(
                "px-3 py-1 rounded-md transition-colors",
                viewMode === 'table' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <FaTable className="inline mr-1" />
              {t('table')}
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={classNames(
              "text-sm px-3 py-1 rounded-md inline-flex items-center",
              showFilters 
                ? `bg-${theme?.primaryColor || '16355D'}/10 text-${theme?.primaryColor || '16355D'}` 
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            title={t('toggle_filters')}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <IoFilter className="mr-1" />
            {t('filters')}
          </button>
        </div>

        {/* Right side - Location and actions */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedLocationId}
            onChange={handleLocationChange}
            className="text-sm bg-gray-50 dark:bg-gray-800 border-0 rounded-md py-1 pl-2 pr-8 text-gray-600 dark:text-gray-300 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
            aria-label="Select location"
          >
            <option value="all">{t('all_locations')}</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            className="text-sm px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            title={t('refresh_data')}
            aria-label="Refresh data"
          >
            <HiOutlineRefresh />
          </button>
          
          <ExportToCSVButton filters={dateFilterProps.filters} />
        </div>
      </div>

      {/* Date Filter Section */}
      <DateFilterSection {...dateFilterProps} />
    </div>
  );
};

export default DashboardFilters;
