import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Error, Loading } from '@/components/shared';
import { User } from '@prisma/client';
import { IoIosArrowBack } from 'react-icons/io';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import useCanAccess from 'hooks/useCanAccess';

const UserView = () => {
  const router = useRouter();
  const { slug: teamSlug, id: userId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const { canAccess } = useCanAccess();

  const isAccessible = canAccess('team_member', ['update']);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/teams/${teamSlug}/members/${userId}`);
        if (!res.ok) {
          throw Error({ message: 'Failed to Fetch User' });
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

    if (teamSlug && userId) {
      fetchUser();
    }
  }, [teamSlug, userId]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !user) {
    return <Error message={`User Not Found`} />;
  }

  return (
    /* eslint-disable i18next/no-literal-string */

    <div>
      <div className="flex flex-col gap-4">
        <header className="flex justify-between mb-8">
          <div className="flex items-start">
            <button
              onClick={() => router.back()}
              className="text-3xl mt-1 text-[#5E6C84]"
            >
              <IoIosArrowBack />
            </button>
            <div className="ml-2">
              <h1 className="text-4xl font-semibold font-montserrat">
                {user.name}
              </h1>
              <p className="text-[#5E6C84]">User Details</p>
            </div>
          </div>
          {isAccessible && (
            <ButtonFromTheme
              className="rounded-md my-2.5 px-10 "
              onClick={() =>
                router.push(`/teams/${teamSlug}/members/${userId}/edit`)
              }
            >
              Edit
            </ButtonFromTheme>
          )}
        </header>

        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="font-bold">User Information</h2>
          <div className="flex flex-col w-1/2 gap-2">
            <div className="flex flex-col">
              <p>First Name</p>
              <p className="text-[#464A53] font-[600]">{user.firstName}</p>
            </div>
            <div className="flex flex-col">
              <p>Last Name</p>
              <p className="text-[#464A53] font-[600]">{user.lastName}</p>
            </div>
            <div className="flex flex-col">
              <p>Display Name</p>
              <p className="text-[#464A53] font-[600]">{user.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="text-poppins font-semibold">Contact Information</h2>
          <div className="flex flex-1 gap-2">
            <div className="flex-1">
              <p>Phone Number</p>
              <p className="text-[#464A53] font-[600]">{user.phone}</p>
            </div>
            <div className="flex-1">
              <p>Email</p>
              <p className="text-[#464A53] font-[600]">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="text-poppins font-semibold">Login Details</h2>
          <div className="flex flex-1 gap-2">
            <div className="flex-1">
              <p>Email</p>
              <p className="text-[#464A53] font-[600]">{user.email}</p>
            </div>
            {/* <div className="flex-1">
              <p>Password</p>
              <p className="text-[#464A53] font-[600]">********</p>
            </div> */}
          </div>
        </div>

        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <div className="flex justify-between border-b pb-3 items-center">
            <h2 className="font-semibold">Locations</h2>
            <ButtonFromTheme
              outline={true}
              className="font-[#17355D] py-2 px-10 border border-[#17355D] rounded-md hover:bg-[#BA2025] hover:border-[#BA2025] hover:text-white"
              onClick={() => {}}
            >
              Add New Locations
            </ButtonFromTheme>
          </div>
        </div>
      </div>
    </div>
  );
  /* eslint-disable i18next/no-literal-string */
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

export default UserView;
