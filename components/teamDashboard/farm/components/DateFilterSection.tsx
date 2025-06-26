import { useTranslation } from 'next-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import classNames from 'classnames';
import { DateFilterProps } from '../types';

const DateFilterSection: React.FC<DateFilterProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleSearch,
  handleQuickDateFilter,
  showFilters,
  theme
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={classNames(
      "transition-all duration-300 overflow-hidden",
      showFilters ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="p-3 bg-gray-50 dark:bg-gray-800/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date ? date : new Date())}
              showTimeSelect
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText={t('start_date')}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-1 px-2 w-44"
            />
            
            <span className="text-gray-400">—</span>
            
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date ? date : new Date())}
              showTimeSelect
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText={t('end_date')}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-1 px-2 w-44"
            />
            
            <ButtonFromTheme
              onClick={handleSearch}
              className="text-sm px-3 py-1 rounded-md"
            >
              {t('apply_filter')}
            </ButtonFromTheme>
          </div>
          
          <div className="flex items-center space-x-1 ml-auto">
            <button
              onClick={() => handleQuickDateFilter(1)}
              className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              24h
            </button>
            <button
              onClick={() => handleQuickDateFilter(7)}
              className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              7d
            </button>
            <button
              onClick={() => handleQuickDateFilter(30)}
              className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              30d
            </button>
            <button
              onClick={() => handleQuickDateFilter(90)}
              className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              90d
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFilterSection;
