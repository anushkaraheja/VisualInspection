import FarmRecords from '@/components/teamDashboard/farm/FarmRecords';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTenantAccess, withTenantAccess } from 'utils/tenantAccess';

const RecordsPage: NextPageWithLayout = () =>{
  const {tenantType} = useTenantAccess();

  if (tenantType == 'Farm') {
    return <FarmRecords />;
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
export default withTenantAccess(RecordsPage, 'records');
