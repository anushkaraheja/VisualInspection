import { useTranslation } from 'next-i18next';
import DashboardSection from '@/components/shared/DashboardSection';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ChartSectionProps } from '../types';import DataTable from './DataTable';
import EmptyDataMessage from './EmptyDataMessage';
;

const ChartSection: React.FC<ChartSectionProps> = ({
  timeSeriesData,
  viewMode,
  selectedLocationId,
  theme
}) => {
  const { t } = useTranslation('common');
  const hasData = Array.isArray(timeSeriesData) && timeSeriesData.length > 0;

  // Columns for the table view
  const columns = [
    { key: 'date', label: t('date') },
    { key: 'count', label: t('count') },
    ...(selectedLocationId === 'all' ? [{ key: 'locationName', label: t('location') }] : [])
  ];

  return (
    <DashboardSection title={t('animal_count_trend')} titleColor='text-black dark:text-white'>
      <div className="bg-white dark:bg-surfaceColor p-4 rounded-lg shadow-sm mb-6">
        <div className="h-[500px]">
          {hasData ? (
            viewMode === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSeriesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    name={t('count')}
                    dataKey="count"
                    stroke={theme?.primaryColor || '#8884d8'}
                    fill={theme?.secondaryColor || '#8884d8'}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <DataTable 
                data={timeSeriesData} 
                columns={columns} 
                showLocationColumn={selectedLocationId === 'all'} 
              />
            )
          ) : (
            <EmptyDataMessage message={t('no_data_for_date_range')} />
          )}
        </div>
      </div>
    </DashboardSection>
  );
};

export default ChartSection;
