import React from 'react';
import { Table } from '@/components/shared/table/Table';
import { ImPencil } from 'react-icons/im';
import { BsThreeDots } from 'react-icons/bs';
import Switch from '@/components/shared/Switch';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';

interface UsersSectionProps {
  users: any[];
  groupFieldClass: string;
  onAddUser: () => void;
  onAssignUser: () => void;
  toggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  slug: string;
  locationId: string;
}

const UsersSection: React.FC<UsersSectionProps> = ({
  users,
  groupFieldClass,
  onAddUser,
  onAssignUser,
  toggleUserStatus,
  slug,
  locationId,
}) => {
  return (
    <div className={groupFieldClass}>
      <div className="flex flex-col md:flex-row md:justify-between border-b pb-3 items-center">
        <h2 className="font-semibold mb-4 md:mb-0">Users</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <ButtonFromTheme
            outline={true}
            className={`py-2 px-10 border rounded-md hover:text-white w-full md:w-auto`}
            onClick={onAddUser}
          >
            Add New User
          </ButtonFromTheme>
          <ButtonFromTheme
            outline={true}
            onClick={onAssignUser}
            className={`py-2 px-10 border rounded-md hover:text-white w-full md:w-auto`}
          >
            Assign User
          </ButtonFromTheme>
        </div>
      </div>
      {users.length === 0 ? (
        <p className="text-black mt-4 text-center dark:text-white">
          There is no assigned user yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <ul className="min-w-full">
            <Table
              cols={['Display Name', 'Email', 'Role', 'Active', 'Action']}
              body={users.map((user: any) => {
                return {
                  id: user.id,
                  cells: [
                    {
                      wrap: true,
                      text: user.name,
                    },
                    { wrap: true, text: user.email },
                    {
                      wrap: true,
                      text:
                        (user.TeamMember &&
                          user.TeamMember[0]?.teamRole?.name) ||
                        'Member',
                    },
                    {
                      wrap: true,
                      element: (
                        <Switch
                          setCheckedUser={toggleUserStatus}
                          userId={user.id}
                          isActive={
                            (user.UserLocation &&
                              user.UserLocation[0]?.isActive) ||
                            true
                          }
                        />
                      ),
                    },
                    {
                      actions: [
                        {
                          text: 'Edit',
                          icon: <ImPencil className="text-[#606060]" />,
                          onClick: () => {
                            // Edit action
                          },
                        },
                        {
                          text: 'Options',
                          icon: <BsThreeDots className="text-[#606060]" />,
                          onClick: () => {
                            // Options action
                          },
                        },
                      ],
                    },
                  ],
                };
              })}
            />
          </ul>
        </div>
      )}
    </div>
  );
};

export default UsersSection;
