import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useOrgTheme from 'hooks/useOrgTheme';

interface GenericDashboardProps {
  tenantType: string | null;
}

const GenericDashboard = ({ tenantType }: GenericDashboardProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const teamSlug = router.query.slug as string;
  const { theme } = useOrgTheme(teamSlug);

  return (
    <div className="bg-gray-100 dark:bg-backgroundColor min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-surfaceColor shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-textColor">
              {tenantType || 'Default'} Dashboard
            </h3>
            <div className="mt-5">
              <div className="rounded-md bg-gray-50 dark:bg-gray-800 px-6 py-5 sm:flex sm:items-center">
                <div className="sm:flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-textColor">
                    Dashboard for {tenantType || 'Default'} tenant type
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This is a placeholder dashboard for the{' '}
                    {tenantType || 'default'} tenant type. You can customize
                    this dashboard based on your specific requirements.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-surfaceColor px-6 py-5 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-600">
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-500 dark:text-gray-400">
                      Widget 1
                    </span>
                  </div>
                </div>
                <div className="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-surfaceColor px-6 py-5 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-600">
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-500 dark:text-gray-400">
                      Widget 2
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericDashboard;
