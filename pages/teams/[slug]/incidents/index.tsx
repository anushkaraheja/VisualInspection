import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { withTenantAccess } from 'utils/tenantAccess';

// This would be your incidents investigation component - you'll need to create this separately
import { IncidentsComponent } from '@/components/incidents';

const TeamIncidents: NextPageWithLayout = () => {
  return <IncidentsComponent />;
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
export default withTenantAccess(TeamIncidents, 'alerts');
