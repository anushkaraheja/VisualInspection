import { useTranslation } from 'next-i18next';
import DashboardSection from '@/components/shared/DashboardSection';
import DashboardCard from '@/components/shared/DashboardCard';
import { FaCow, FaHorseHead } from 'react-icons/fa6';
import classNames from 'classnames';
import { AnimalCardsSectionProps } from '../types';

const AnimalCardsSection: React.FC<AnimalCardsSectionProps> = ({
  totalAnimals,
  totalActive,
  totalInactive,
  locationDetails,
  selectedLocationId,
  theme
}) => {
  const { t } = useTranslation('common');

  // Calculate percentages safely
  const calculatePercentage = (part: number, total: number) => {
    if (total <= 0) return 0;
    return (part / total) * 100;
  };

  const activePercentage = calculatePercentage(totalActive, totalAnimals);
  const inactivePercentage = calculatePercentage(totalInactive, totalAnimals);

  return (
    <DashboardSection
      title={selectedLocationId !== 'all' ? t('location_summary') : t('all_locations_summary')}
      titleColor="text-white"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        <DashboardCard
          title={t('total_animals')}
          value={totalAnimals || 0}
          icon={<FaCow className="h-5 w-5" />}
          iconBgColor="bg-gray-100 dark:bg-gray-700"
          iconColor="text-gray-600 dark:text-gray-400"
          valueSuffix={
            selectedLocationId !== 'all' && locationDetails ?
              <span className="text-xs text-gray-500"> @ {locationDetails.name || ''}</span> :
              ''
          }
        />
        <DashboardCard
          title={t('active_animals')}
          value={totalActive || 0}
          icon={<FaCow className="h-5 w-5" />}
          iconBgColor={classNames(`bg-${theme?.primaryColor || '16355D'}/10`)}
          iconColor="text-gray-600 dark:text-gray-400"
          valueSuffix={
            totalAnimals > 0
              ? <span className="text-xs text-gray-500">
                  ({activePercentage.toFixed(1)}%)
                </span>
              : null
          }
          progressPercentage={activePercentage}
          progressBarColor={theme?.primaryColor || '#16355D'}
        />
        <DashboardCard
          title={t('inactive_animals')}
          value={totalInactive || 0}
          icon={<FaHorseHead className="h-5 w-5" />}
          iconBgColor={classNames(`bg-${theme?.secondaryColor || 'BA2025'}/10`)}
          iconColor="text-gray-600 dark:text-gray-400"
          valueSuffix={
            totalAnimals > 0
              ? <span className="text-xs text-gray-500">
                  ({inactivePercentage.toFixed(1)}%)
                </span>
              : null
          }
          progressPercentage={inactivePercentage}
          progressBarColor={theme?.secondaryColor || '#BA2025'}
        />
      </div>
    </DashboardSection>
  );
};

export default AnimalCardsSection;
