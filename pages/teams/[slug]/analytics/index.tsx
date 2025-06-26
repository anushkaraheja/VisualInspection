import { PPEAnalytics } from '@/components/teamDashboard/ppe/analytics';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTenantAccess, withTenantAccess } from 'utils/tenantAccess';

const AnalyticsPage: NextPageWithLayout = () =>{
  const {tenantType} = useTenantAccess();

  if (tenantType == 'PPE') {
    return <PPEAnalytics />;
  }
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
export default withTenantAccess(AnalyticsPage, 'analytics');
