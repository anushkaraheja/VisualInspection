import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import PPEDashboard from './ppe/PPEDashboard';
import GenericDashboard from './ppe/GenericDashboard';
import useTeams from 'hooks/useTeams';
import { useState, useEffect } from 'react';
import { Loading } from '../shared';
import FarmDashboard from './farm/FarmDashboard';

export const Dashboard = () => {
  const router = useRouter();
  const { teams, isLoading } = useTeams();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);

  const teamSlug = router.query.slug as string;
  const currentTeam = (teams || []).find((team) => team.slug === teamSlug);
  const isPpeTeam = currentTeam?.TenantType?.name === 'PPE';
  const isFarmTeam = currentTeam?.TenantType?.name === 'Farm';

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading, teams]);

  // Show loading state while teams data is being fetched
  if (loading) {
    return (
      <Loading/>
    );
  }

  // Render different dashboards based on tenant type
  if (isPpeTeam) {
    return <PPEDashboard />;
  }

  if(isFarmTeam) {
    return <FarmDashboard teamSlug={teamSlug} />
  }

  // Default to generic dashboard for other tenant types
  return (
    <GenericDashboard tenantType={currentTeam?.TenantType?.name || null} />
  );
};
