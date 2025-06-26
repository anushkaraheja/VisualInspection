import { Error, LetterAvatar, Loading } from '@/components/shared';
import { Team, TeamMember } from '@prisma/client';
import useCanAccess from 'hooks/useCanAccess';
import useTeamMembers, { TeamMemberWithUser } from 'hooks/useTeamMembers';
import useTeamMemberActions from 'hooks/useTeamMemberActions';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';

import { InviteMember } from '@/components/invitation';
import UpdateMemberRole from './UpdateMemberRole';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { useState } from 'react';
import { Table } from '@/components/shared/table/Table';
import Link from 'next/link';
import ButtonFromTheme from '../shared/ButtonFromTheme';

const Members = ({
  team,
  currentUserEmail,
}: {
  team: Team;
  currentUserEmail: string;
}) => {
  const { data: session } = useSession();
  const { t } = useTranslation('common');
  const { canAccess } = useCanAccess();
  const [visible, setVisible] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<TeamMemberWithUser | null>(null);
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  const { isLoading, isError, members, mutateTeamMembers } = useTeamMembers(
    team.slug
  );

  const { removeTeamMember, isLoading: isRemovingMember } =
    useTeamMemberActions({
      teamSlug: team.slug,
      onSuccess: mutateTeamMembers,
    });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!members) {
    return null;
  }

  // Original removeTeamMember function has been moved to the hook

  const canUpdateRole = (member: TeamMember) => {
    return (
      session?.user.id != member.userId && canAccess('team_member', ['update'])
    );
  };

  const canRemoveMember = (member: TeamMember) => {
    return (
      session?.user.id != member.userId && canAccess('team_member', ['delete'])
    );
  };

  const cols = [t('name'), t('email'), t('role')];
  if (canAccess('team_member', ['delete'])) {
    cols.push(t('actions'));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <h2 className="text-xl font-medium leading-none tracking-tight">
            {t('members')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('members-description')}
          </p>
        </div>
        <ButtonFromTheme onClick={() => setVisible(!visible)}>
          {t('add-member')}
        </ButtonFromTheme>
      </div>

      <Table
        cols={cols}
        body={members.map((member) => {
          return {
            id: member.id,
            cells: [
              {
                wrap: true,
                element: (
                  <Link
                    href={`/teams/${team.slug}/members/${member.user.id}/view`}
                  >
                    <div className="flex items-center justify-start space-x-2">
                      <LetterAvatar name={member.user.name} />
                      <span>
                        {member.user.name}{' '}
                        {member.user.email === currentUserEmail ? '(Me)' : ''}
                      </span>
                    </div>
                  </Link>
                ),
                minWidth: 200,
              },
              { wrap: true, text: member.user.email, minWidth: 250 },
              {
                element: canUpdateRole(member) ? (
                  <UpdateMemberRole team={team} member={member} />
                ) : (
                  <span>{member.role}</span>
                ),
              },
              {
                buttons: canRemoveMember(member)
                  ? [
                      {
                        color: 'error',
                        text: t('remove'),
                        onClick: () => {
                          setSelectedMember(member);
                          setConfirmationDialogVisible(true);
                        },
                      },
                    ]
                  : [],
              },
            ],
          };
        })}
      ></Table>

      <ConfirmationDialog
        visible={confirmationDialogVisible}
        onCancel={() => setConfirmationDialogVisible(false)}
        onConfirm={() => {
          removeTeamMember(selectedMember);
          setConfirmationDialogVisible(false);
        }}
        title={t('confirm-delete-member')}
      >
        {t('delete-member-warning', {
          name: selectedMember?.user.name,
          email: selectedMember?.user.email,
        })}
      </ConfirmationDialog>
      <InviteMember visible={visible} setVisible={setVisible} team={team} />
    </div>
  );
};

export default Members;
