import { GetServerSidePropsContext } from 'next';
import Vendors from '@/components/teamDashboard/farm/vendors/Vendors';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withTenantAccess } from 'utils/tenantAccess';

export function VendorsPage() {
  return (
      <Vendors />
  );
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}


export default withTenantAccess(VendorsPage, 'vendors');
