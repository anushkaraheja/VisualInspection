import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getSession } from '@/lib/session';
import { getUserBySession } from 'models/user';
import { useTenantType, withTenantAccess } from 'utils/tenantAccess';
import { prisma } from 'lib/prisma';
import ButtonFromTheme from 'components/shared/ButtonFromTheme';
import useOrgTheme from 'hooks/useOrgTheme';
import Switch from 'components/shared/Switch';
import { toast } from 'react-hot-toast';

// Define types for PPE items
interface PPEItem {
  id: string;
  name: string;
  description: string | null;
  active?: boolean;
}

export function ConfigurePPEPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [ppeItems, setPpeItems] = useState<PPEItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { hasAccess: isPPETenant, isLoading: tenantLoading } =
    useTenantType('PPE');
  const { theme, loading: themeLoading } = useOrgTheme(slug || '');

  // Redirect if this is not a PPE tenant
  useEffect(() => {
    if (!tenantLoading && !isPPETenant && slug) {
      router.replace(`/teams/${slug}/dashboard`);
    }
  }, [isPPETenant, tenantLoading, router, slug]);

  // Fetch all PPE items and mark active ones for this team
  useEffect(() => {
    const fetchPPEItems = async () => {
      if (!slug) return;
      setIsLoading(true);

      try {


        // Fetch all available PPE items
        const response = await fetch('/api/ppe-items', {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;

          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { raw: errorText };
          }

          console.error('API response error details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()]),
            data: errorData,
          });

          throw new Error(
            `Failed to fetch PPE items: ${response.status} ${response.statusText}`
          );
        }


        const result = await response.json();


        if (!result.success || !result.data) {
          console.error('API result error:', result);
          throw new Error(
            result.error?.message ||
              'Failed to fetch PPE items: Invalid response format'
          );
        }



        // Get all team PPE items to determine which ones are active
        const teamPPEResponse = await fetch(`/api/teams/${slug}/ppe-items`);
        let activeItemIds: string[] = [];

        if (teamPPEResponse.ok) {
          const teamPPEResult = await teamPPEResponse.json();

          if (teamPPEResult.success && teamPPEResult.data) {
            activeItemIds = teamPPEResult.data
              .filter((item: any) => item.active)
              .map((item: any) => item.ppeItemId);
          }
        }

        // Set active status for all items
        const itemsWithActiveStatus = result.data.map((item: PPEItem) => ({
          ...item,
          active: activeItemIds.includes(item.id),
        }));

        setPpeItems(itemsWithActiveStatus);
      } catch (error) {
        console.error('Error fetching PPE items (full error):', error);
        toast.error(`Failed to load PPE configuration`);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPPEItems();
    }
  }, [slug]);

  // Toggle the active state of a PPE item
  const togglePPEItem = (id: string, isActive: boolean) => {
    setPpeItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: isActive } : item
      )
    );
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!slug) return;

    setIsSaving(true);
    try {
      const itemsToUpdate = ppeItems.map((item) => ({
        ppeItemId: item.id,
        active: Boolean(item.active),
      }));

      const response = await fetch(`/api/teams/${slug}/ppe-items/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error?.message || 'Failed to update PPE settings'
        );
      }

      toast.success('PPE configuration saved successfully');
    } catch (error) {
      console.error('Error saving PPE settings:', error);
      toast.error('Failed to save PPE configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // If still loading tenant access or not a PPE tenant, don't render content
  if (tenantLoading || !isPPETenant) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Configure PPE - {slug}</title>
        <meta
          name="description"
          content="Configure PPE equipment for your team"
        />
      </Head>

      <main className="flex-1 overflow-y-auto focus:outline-none">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Configure PPE Equipment
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Select which PPE equipment is required for your team.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <ButtonFromTheme
                onClick={handleSaveChanges}
                className="px-4 py-2 text-sm font-medium rounded-md"
                disabled={isLoading || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </ButtonFromTheme>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 flex justify-center">
              <div className="loader">Loading PPE items...</div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ppeItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {item.description || 'No description available'}
                      </p>
                    </div>
                    <Switch
                      setCheckedUser={(id, isActive) =>
                        togglePPEItem(item.id, isActive)
                      }
                      userId={item.id}
                      isActive={item.active || false}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {item.active ? (
                        <span className="text-green-600 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { locale } = context;
  const { slug } = context.params as { slug: string };

  const session = await getSession(context.req, context.res);
  const user = await getUserBySession(session);

  if (!user) {
    return {
      notFound: true,
    };
  }

  // Check tenant type on server side
  const team = await prisma.team.findUnique({
    where: { slug },
    include: { TenantType: true },
  });

  // If tenant type is not PPE, redirect to dashboard
  if (!team || team.TenantType?.name !== 'PPE') {
    return {
      redirect: {
        destination: `/teams/${slug}/dashboard`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

// Wrap the component with tenant access control
export default withTenantAccess(ConfigurePPEPage, 'configure-ppe');
