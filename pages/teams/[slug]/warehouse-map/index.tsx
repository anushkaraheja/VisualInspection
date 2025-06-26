import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { withTenantAccess } from 'utils/tenantAccess';

// This would be your warehouse map component - you'll need to create this separately
import { WarehouseMapComponent } from '@/components/warehouseMap';

const WarehouseMap: NextPageWithLayout = () => {
  return <WarehouseMapComponent />;
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

// Protect this page - only users with team update permission should access it
export default withTenantAccess(WarehouseMap, 'alerts');
