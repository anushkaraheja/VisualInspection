import { useState } from 'react';
import { TeamMember } from '@prisma/client';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import type { ApiResponse } from 'types';

interface UseTeamMemberActionsProps {
  teamSlug: string;
  onSuccess?: () => void;
}

const useTeamMemberActions = ({
  teamSlug,
  onSuccess,
}: UseTeamMemberActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation('common');

  const removeTeamMember = async (member: TeamMember | null) => {
    if (!member) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sp = new URLSearchParams({ memberId: member.userId });

      const response = await fetch(
        `/api/teams/${teamSlug}/members?${sp.toString()}`,
        {
          method: 'DELETE',
          headers: defaultHeaders,
        }
      );

      const json = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(json.error.message);
      }

      toast.success(t('member-deleted'));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    removeTeamMember,
    isLoading,
    error,
  };
};

export default useTeamMemberActions;
