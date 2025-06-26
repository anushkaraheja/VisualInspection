import UpdateColors from '@/components/team/UpdateColors';
import { Error, Loading } from '@/components/shared';
import { AccessControl } from '@/components/shared/AccessControl';
import { RemoveTeam, TeamSettings } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import type { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { TeamFeature } from 'types';
import UpdateLogo from '@/components/team/UpdateLogo';
import FarmVendors from '@/components/team/FarmVendors';
import TeamAlertStatus from '@/components/team/TeamAlertStatus';
import { useTenantAccess } from 'utils/tenantAccess';

const Settings = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const { tenantType } = useTenantAccess();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return (
    <>
      <div className="space-y-6 py-5 lg:px-8">
        <TeamSettings team={team} />
        <AccessControl resource="team" actions={['update']}>
          {tenantType === 'Farm' && <FarmVendors team={team} />}
          <TeamAlertStatus team={team} />
          <UpdateColors team={team} />
          <UpdateLogo team={team} />
        </AccessControl>

        <AccessControl resource="team" actions={['delete']}>
          <RemoveTeam team={team} allowDelete={teamFeatures.deleteTeam} />
        </AccessControl>
      </div>
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default Settings;
