import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { IoIosArrowBack } from 'react-icons/io';
import { TeamRole, User } from '@prisma/client';
import { Loading, Error as ErrorComponent } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import { ImPencil } from 'react-icons/im';
import { BsThreeDots } from 'react-icons/bs';
import Switch from '@/components/shared/Switch';
import { signIn } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useCanAccess from 'hooks/useCanAccess';
import Custom404 from 'pages/404';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';

const EditUser = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const { canAccess } = useCanAccess();
  const isAccessible = canAccess('team_member', ['update']);

  const groupFieldClass =
    'bg-white dark:bg-surfaceColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';
  const inputClass =
    'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';
  const router = useRouter();
  const { slug, id: userId } = router.query;

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`/api/teams/${slug}/roles`);

        if (!res.ok) {
          throw new Error('Failed to fetch roles');
        }

        const data: { data: TeamRole[] } = await res.json();
        setRoles(data.data);
      } catch (error: unknown) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to fetch roles');
      }
    };

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/teams/${slug}/members/${userId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();

        setUser(data.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchRoles();
    }
    if (slug && userId) {
      fetchUser();
    }
  }, [slug, userId]);

  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dislplayName: user?.name || '',
      phoneNumber: user?.phone || '',
      email: user?.email || '',
      emailOfManager: '',
      password: '',
      sendInvite: false,
      role: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last Name is required'),
      dislplayName: Yup.string().required('Display Name is required'),
      phoneNumber: Yup.string().required('Phone is required'),
      email: Yup.string().required('Email is required'),
      role: Yup.string().required('Role is required'),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        const selectedRole = roles.find((role) => role.name === values.role);
        const res = await fetch(`/api/teams/${slug}/members/${userId}`, {
          method: 'PUT',
          headers: defaultHeaders,
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            name: values.dislplayName,
            phoneNumber: values.phoneNumber,
            email: values.email,
            password: values.password,
            from: 'admin',
            teamSlug: slug,
            teamRoleId: selectedRole?.id,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(error.message);
          return;
        }

        const data = await res.json();
        setIsLoading(false);
        toast.success('User updated successfully');
        router.push(`/teams/${slug}/members/${data.data.userId}/view`);

        if (values.sendInvite) {
          await signIn('email', { email: values.email });
        }
      } catch (error) {
        toast.error(`Failed to update user ${error}`);
      }
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !user) {
    return <ErrorComponent message={`User Not Found`} />;
  }
  if (!isAccessible) {
    return <Custom404 />;
  }

  return (
    /* eslint-disable i18next/no-literal-string */
    <form
      onSubmit={formik.handleSubmit}
      className="bg-[#f6f6fa] dark:bg-backgroundColor"
    >
      <div className="flex flex-col gap-4">
        <header className="flex justify-between mb-8">
          <div className="flex items-start">
            <button
              onClick={() => router.back()}
              className="text-3xl mt-1 text-[#5E6C84]"
            >
              <IoIosArrowBack />
            </button>
            <div className=" flex flex-col ml-2">
              <h1 className="text-4xl font-semibold font-montserrat">
                Edit User
              </h1>
              <p className="text-[#5E6C84]">
                Update the information of the user
              </p>
            </div>
          </div>
          <ButtonFromTheme
            className="border border-solid rounded-md my-2.5 px-10"
            onClick={() => router.back()}
          >
            Cancel
          </ButtonFromTheme>
        </header>
        <div className={groupFieldClass}>
          <h2 className="font-bold">User Details</h2>
          <div className="flex gap-10 mr-10">
            <label className="flex flex-1 flex-col w-1/2 gap-2">
              First Name
              <input
                type="text"
                name="firstName"
                className={inputClass}
                onChange={formik.handleChange}
                value={formik.values.firstName}
                placeholder="First Name"
              />
            </label>
            <label className="flex flex-1 flex-col w-1/2 gap-2">
              Last Name
              <input
                type="text"
                name="lastName"
                className={inputClass}
                onChange={formik.handleChange}
                value={formik.values.lastName}
                placeholder="Last Name"
              />
            </label>
          </div>
          <div className="flex gap-10 mr-10">
            <label className=" flex-1 flex flex-col w-1/2 gap-2">
              Display Name
              <input
                type="text"
                name="dislplayName"
                className={inputClass}
                onChange={formik.handleChange}
                value={formik.values.dislplayName}
                placeholder="Display Name"
              />
            </label>
            <div className="flex-1"></div>
          </div>
        </div>
        <div className={groupFieldClass}>
          <h2 className="text-poppins font-semibold">Contact Information</h2>
          <div className="flex gap-20">
            <label className="flex flex-col flex-1 gap-2">
              Phone Number
              <input
                type="number"
                className={inputClass}
                name="phoneNumber"
                onChange={formik.handleChange}
                value={formik.values.phoneNumber}
                placeholder="Phone Number"
              />
            </label>
            <label className="flex flex-col flex-1 gap-2">
              Email Id of the Manager (Optional, If any)
              <input
                type="email"
                className={`${inputClass}`}
                name="emailOfManager"
                onChange={formik.handleChange}
                value={formik.values.emailOfManager}
                placeholder="Email Id"
              />
            </label>
          </div>
        </div>
        <div className={groupFieldClass}>
          <div className="flex justify-between">
            <h2 className="text-poppins font-semibold">Login Details</h2>
            <label>
              <input
                type="checkbox"
                id="sendInvite"
                name="sendInvite"
                className="mr-2"
                checked={formik.values.sendInvite}
                onChange={formik.handleChange}
              />{' '}
              Send invitation email
            </label>
          </div>
          <div className="flex gap-20">
            <label className="flex flex-col flex-1 gap-2">
              Email
              <input
                type="email"
                className={inputClass}
                name="email"
                onChange={formik.handleChange}
                value={formik.values.email}
                placeholder="User Email"
              />
            </label>
            <label className="flex flex-col flex-1 gap-2">
              Password
              <input
                type="password"
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                name="password"
                disabled={formik.values.sendInvite}
                onChange={formik.handleChange}
                value={formik.values.password}
                placeholder="Password"
              />
            </label>
          </div>
        </div>
        <div className={groupFieldClass}>
          <h2 className="font-bold">Role</h2>
          <div className="flex gap-10 mr-10">
            <label className="flex flex-1 flex-col w-1/2 gap-2">
              Select Role
              <select
                name="role"
                className={inputClass}
                onChange={formik.handleChange}
                value={formik.values.role}
                required
              >
                <option value="" label="Select role" />
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className={groupFieldClass}>
          <div className="flex justify-between border-b pb-3 items-center">
            <h2 className="font-semibold">Locations</h2>
            <div className="flex gap-4">
              <ButtonFromTheme
                outline={true}
                className="font-[#17355D] py-2 px-10 border border-[#17355D] rounded-md hover:bg-[#BA2025] hover:border-[#BA2025] hover:text-white"
                onClick={() => setShowAddUserModal(true)}
              >
                Add New Locations
              </ButtonFromTheme>
              <ButtonFromTheme
                outline={true}
                onClick={() => {
                  setIsModalOpen(true);
                }}
                className="font-[#17355D] py-2 px-10 border border-[#17355D] rounded-md hover:bg-[#BA2025] hover:border-[#BA2025] hover:text-white"
              >
                Add Existing Locations
              </ButtonFromTheme>
            </div>
          </div>
          {teamUsers.length === 0 ? (
            <p className="text-black dark:text-textColor mt-4 text-center">
              There is no assigned Locations to this user yet.
            </p>
          ) : (
            <ul className="mt-4">
              <Table
                cols={['Display Name', 'Email', 'Role', 'Active', 'Action']}
                body={teamUsers.map((user) => {
                  return {
                    id: user.id,
                    cells: [
                      {
                        wrap: true,
                        text: user.name,
                      },
                      { wrap: true, text: user.email },
                      { wrap: true, text: 'Member' }, // Hardcoded role
                      {
                        wrap: true,
                        element: (
                          <Switch
                            setCheckedUser={() => {}}
                            userId={user.id}
                            isActive={true}
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
          )}
        </div>
        <div className="flex gap-4 px-4">
          <ButtonFromTheme
            onClick={formik.handleSubmit}
            className="hover:cursor-pointer text-white py-2 px-8 bg-[#16355D] rounded-md hover:bg-[#BA2025]"
          >
            Save Changes
          </ButtonFromTheme>
          <ButtonFromTheme
            outline={true}
            className="rounded-md py-2 px-8 border text-[#17355D] hover:border-[#BA2025] border-[#16355D] hover:bg-[#BA2025] hover:text-white"
            onClick={() => router.back()}
          >
            Cancel
          </ButtonFromTheme>
        </div>
      </div>
    </form>
    /* eslint-disable i18next/no-literal-string */
  );
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

export default EditUser;
