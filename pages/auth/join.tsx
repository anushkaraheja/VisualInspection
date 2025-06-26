import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { type ReactElement, useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import type { NextPageWithLayout } from 'types';
import { authProviderEnabled } from '@/lib/auth';
import { AuthLayout } from '@/components/layouts';
import GithubButton from '@/components/auth/GithubButton';
import GoogleButton from '@/components/auth/GoogleButton';
import { JoinWithInvitation, Join } from '@/components/auth';
import Head from 'next/head';
import { Loading } from '@/components/shared';
import env from '@/lib/env';
import app from '@/lib/app';

const Signup: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ authProviders, recaptchaSiteKey }) => {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation('common');

  const { error, token } = router.query as {
    error: string;
    token: string;
  };

  useEffect(() => {
    if (error) {
      toast.error(t(error));
    }
  }, [error, t]);

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'authenticated') {
    router.push(env.redirectIfAuthenticated);
  }

  const params = token ? `?token=${token}` : '';

  return (
    <>
      <Head>
        <title>{t('sign-up-title') + app.name}</title>
      </Head>
      <div className="rounded p-6">
        <div className="flex gap-2 flex-wrap">
          {/* {authProviders.github && <GithubButton />}
          {authProviders.google && <GoogleButton />} */}

          {authProviders.saml && (
            <Link
              href="/auth/sso"
              className="btn bg-[#2C2C2C] rounded-3xl text-white btn-outline w-full border-[#707070]"
            >
              &nbsp;{t('continue-with-saml-sso')}
            </Link>
          )}
        </div>

        {(authProviders.github || authProviders.google) &&
          authProviders.credentials && <div className="divider before:bg-white after:bg-white">{t('or')}</div>}

        {authProviders.credentials && (
          <>
            {token ? (
              <JoinWithInvitation
                inviteToken={token}
                recaptchaSiteKey={recaptchaSiteKey}
              />
            ) : (
              <Join recaptchaSiteKey={recaptchaSiteKey} />
            )}
          </>
        )}
      </div>
      <p className="text-center text-sm text-white mt-3 dark:text-white">
        {t('already-have-an-account')}
        <Link
          href={`/auth/login/${params}`}
          className="font-medium ml-1 text-[#BA5CFF] underline hover:text-[color-mix(in_oklab,oklch(var(--p)),black_7%)]"
        >
          {t('sign-in')}
        </Link>
      </p>
    </>
  );
};

Signup.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout heading="get-started" description="create-a-new-account">
      {page}
    </AuthLayout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      authProviders: authProviderEnabled(),
      recaptchaSiteKey: env.recaptcha.siteKey,
    },
  };
};

export default Signup;
