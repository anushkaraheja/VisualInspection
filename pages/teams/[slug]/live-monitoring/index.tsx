import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useState, useEffect } from 'react';
import { LiveMonitoringPage } from '@/components/teamDashboard/liveMonitoring/index';
import { withTenantAccess } from 'utils/tenantAccess';
import { Loading } from '@/components/shared';

const LiveMonitoring: NextPageWithLayout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return <LiveMonitoringPage />;
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

// Wrap the component with tenant access control
export default withTenantAccess(LiveMonitoring, 'live-monitoring');
