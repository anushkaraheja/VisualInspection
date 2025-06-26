import { useTranslation } from 'next-i18next';
import DashboardSection from '@/components/shared/DashboardSection';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ZoneChartSectionProps } from '../types';
import EmptyDataMessage from './EmptyDataMessage';

const ZoneChartSection: React.FC<ZoneChartSectionProps> = ({
  zoneData,
  viewMode,
  theme
}) => {
  const { t } = useTranslation('common');
  const hasData = Array.isArray(zoneData) && zoneData.length > 0;

  return (
    <DashboardSection titleColor='text-black dark:text-white' title={t('zone_analytics')}>
      <div className="bg-white dark:bg-surfaceColor p-4 rounded-lg shadow-sm mb-6">
        <div className="h-[400px]">
          {hasData ? (
            viewMode === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name={t('count')}
                    fill={theme?.primaryColor || '#8884d8'}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('zone_name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('count')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('percentage')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-surfaceColor divide-y divide-gray-200 dark:divide-gray-700">
                    {zoneData.map((zone, index) => (
                      <tr key={zone.id || index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{zone.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{zone.count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            <span className="mr-2">{zone.percentage || 0}%</span>
                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${zone.percentage || 0}%`,
                                  backgroundColor: theme?.primaryColor || 'blue'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <EmptyDataMessage message={t('no_zone_data_available')} />
          )}
        </div>
      </div>
    </DashboardSection>
  );
};

export default ZoneChartSection;
