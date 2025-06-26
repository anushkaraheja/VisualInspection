import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useSession } from 'next-auth/react';
import useTeamMembers from 'hooks/useTeamMembers';
import { Error, Loading } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
// import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { useLocationUsers } from 'hooks/useLocationHooks';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import ModalRightScreen from '../shared/ModalRightScreen';

const AssignUserModal = ({
  isOpen,
  onClose,
  teamSlug,
  locationName,
  locationId,
  setAssignedUsers,
}: {
  isOpen: boolean;
  onClose: () => void;
  teamSlug: string;
  locationName: string;
  locationId: string;
  setAssignedUsers: (users: any[]) => void;
}) => {
  const { isLoading, isError, members } = useTeamMembers(teamSlug);

  const { locationUsers } = useLocationUsers(
    teamSlug as string,
    locationId as string
  );
  const [localAssignedUsers, setLocalAssignedUsers] = useState(
    locationUsers || []
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const assignUser = async (userId: string) => {
    const response = await fetch(
      `/api/teams/${teamSlug}/locations/${locationId}/users`,
      {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ userId, locationId }),
      }
    );

    if (response.ok) {
      const newUser = await response.json();
      setAssignedUsers([...localAssignedUsers, newUser.data]);
      setLocalAssignedUsers((prev) => [...prev, newUser.data]);
    } else {
      const error = await response.json();
      toast.error(error.message);
    }
  };

  const assignUsers = async (users: any[]) => {
    const newUsers = users.filter(
      (user) =>
        !localAssignedUsers.some((assignedUser) => assignedUser.id === user.id)
    );
    for (const user of newUsers) {
      await assignUser(user.id);
    }
  };

  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddSelected = async () => {
    await assignUsers(selectedUsers.map((userId) => ({ id: userId })));
    onClose();
  };

  const filteredMembers =
    members?.filter(
      (member) => !localAssignedUsers.some((user) => user.id === member.user.id)
    ) || [];

  if (!isOpen) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!members) {
    return null;
  }

  const cols = ['Display Name', 'User name', 'role'];

  return (
    /* eslint-disable i18next/no-literal-string */
    <ModalRightScreen isOpen={isOpen} onClose={onClose}>
      <ModalRightScreen.Header>
        <div>
          <ModalRightScreen.Subtitle>
            Existing User List
          </ModalRightScreen.Subtitle>
          <ModalRightScreen.Title>
            Add Users to{' '}
            <span className="text-[#DB282E]">&quot;{locationName}&quot;</span>
          </ModalRightScreen.Title>
        </div>
      </ModalRightScreen.Header>

      <ModalRightScreen.Content>
        <Table
          cols={cols}
          body={filteredMembers.map((member) => {
            return {
              id: member.id,
              cells: [
                {
                  wrap: true,
                  element: (
                    <div className="flex items-center justify-start space-x-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        onChange={() => handleCheckboxChange(member.user.id)}
                        checked={selectedUsers.includes(member.user.id)}
                      />
                      <span>{member.user.name}</span>
                    </div>
                  ),
                  minWidth: 200,
                },
                { wrap: true, text: member.user.email, minWidth: 250 },
                { text: member.role },
              ],
            };
          })}
        />
      </ModalRightScreen.Content>

      <ModalRightScreen.Footer>
        <ButtonFromTheme
          onClick={handleAddSelected}
          className="px-14 py-2 rounded-md text-white text-lg"
          disabled={selectedUsers.length === 0}
        >
          Add Selected
        </ButtonFromTheme>
        <ButtonFromTheme
          onClick={onClose}
          outline={true}
          className="px-14 py-2 rounded-md border"
        >
          Cancel
        </ButtonFromTheme>
      </ModalRightScreen.Footer>
    </ModalRightScreen>
    /* eslint-enable i18next/no-literal-string */
  );
};

export default AssignUserModal;
