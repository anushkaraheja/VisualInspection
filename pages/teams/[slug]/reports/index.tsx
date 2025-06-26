import { Reports } from '@/components/teamDashboard/ppe/reports';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { withTenantAccess } from 'utils/tenantAccess';

const ReportsPage: NextPageWithLayout = () => {
  return <Reports />;
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
export default withTenantAccess(ReportsPage, 'reports');
