import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import env from '@/lib/env';
import Head from 'next/head';
import Navbar from '@/components/defaultLanding/Navbar';
import HeroSection from '@/components/defaultLanding/HeroSection';
import ProductSection from '@/components/defaultLanding/ProductSection';
import Footer from '@/components/defaultLanding/Footer';

const Home1: NextPageWithLayout = () => {
  return (
    <div className="bg-white dark:bg-gray-900">
      <>
        <Head>
          <title>BrickRed Systems</title>
        </Head>

        <div>
          <Navbar />
          <HeroSection />
          <ProductSection />
          <Footer />
          {/* <iframe
            id="dashIframe"
            src="https://brickredsys.com/"
            width="100%"
            height={'798px'}
            style={{ border: 'none' }}
          ></iframe> */}
        </div>
      </>
    </div>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  console.log('hideLandingPage:', env.hideLandingPage);
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
