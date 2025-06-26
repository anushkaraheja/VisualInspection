import { useState } from 'react';
import toast from 'react-hot-toast';
import { defaultHeaders } from '@/lib/common';
import { mutate } from 'swr';

interface InvitationParams {
  email: string;
  role: string;
  teamSlug: string;
}

/**
 * Hook for sending team invitations via email
 */
const useTeamInvitation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendInvitation = async ({
    email,
    role,
    teamSlug,
  }: InvitationParams) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          email,
          role,
          sentViaEmail: true,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error?.message || 'Failed to send invitation email');
        return false;
      }

      toast.success('Invitation email sent successfully');
      mutate(`/api/teams/${teamSlug}/invitations?sentViaEmail=true`);
      return true;
    } catch (error) {
      toast.error(`Error sending invitation: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendInvitation,
    isLoading,
  };
};

export default useTeamInvitation;
