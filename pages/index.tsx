import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';
import Head from 'next/head';
import Link from 'next/link';
import useTheme from 'hooks/useTheme';
import app from '@/lib/app';
import Image from 'next/image';

const Home1: NextPageWithLayout = () => {
  const { toggleTheme, selectedTheme } = useTheme();

  return (
    <>
      <Head>
        <title>Focus on Your Vision | BrickRed Systems</title>
      </Head>

      <div className="container mx-auto">
        <div className="navbar bg-base-100 px-0 sm:px-1">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl normal-case">
              {/* TODO: Change this logic */}
              <span>BrickRed Systems</span>
              <Image
                src={app.logoUrl}
                className="h-12"
                alt={app.name}
                width={100}
                height={100}
              />
            </Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal flex items-center gap-2 sm:gap-4">
              {env.darkModeEnabled && (
                <li>
                  <button
                    className="bg-none p-0 rounded-lg flex items-center justify-center"
                    onClick={toggleTheme}
                  >
                    <selectedTheme.icon className="w-5 h-5" />
                  </button>
                </li>
              )}
              <li>
                <Link
                  href="/auth/join"
                  className="btn btn-primary btn-md py-3 px-2 sm:px-4 text-white"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="btn btn-primary dark:border-zinc-600 dark:border-2 dark:text-zinc-200 btn-outline py-3 px-2 sm:px-4 btn-md"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <iframe
          id="dashIframe"
          src="https://brickredsys.com/"
          width="100%"
          height={'798px'}
          style={{ border: 'none' }}
        ></iframe>
      </div>
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // Redirect to login page if landing page is disabled
  if (env.hideLandingPage) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: true,
      },
    };
  }

  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

Home1.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default Home1;
