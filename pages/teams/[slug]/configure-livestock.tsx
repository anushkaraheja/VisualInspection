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
import { defaultHeaders } from '@/lib/common';

// Define types for Livestock items
interface LivestockItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  active?: boolean;
}

export function ConfigureLivestockPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [livestockItems, setLivestockItems] = useState<LivestockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { hasAccess: isLivestockTenant, isLoading: tenantLoading } =
    useTenantType('Farm');
  const { theme, loading: themeLoading } = useOrgTheme(slug || '');

  // Redirect if this is not a Livestock tenant
  useEffect(() => {
    if (!tenantLoading && !isLivestockTenant && slug) {
      router.replace(`/teams/${slug}/404`);
    }
  }, [isLivestockTenant, tenantLoading, router, slug]);

  // Fetch all Livestock items and mark active ones for this team
  useEffect(() => {
    const fetchLivestockItems = async () => {
      if (!slug) return;
      setIsLoading(true);

      try {


        // Fetch all available Livestock items
        const response = await fetch('/api/livestock-items', {
          headers: defaultHeaders,
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
            `Failed to fetch Livestock items: ${response.status} ${response.statusText}`
          );
        }


        const result = await response.json();


        if (!result.success || !result.data) {
          console.error('API result error:', result);
          throw new Error(
            result.error?.message ||
              'Failed to fetch Livestock items: Invalid response format'
          );
        }


        // Get all team Livestock items to determine which ones are active
        const teamLivestockResponse = await fetch(`/api/teams/${slug}/livestock-items`);
        let activeItems: Record<string, boolean> = {};

        if (teamLivestockResponse.ok) {
          const teamLivestockResult = await teamLivestockResponse.json();

          if (teamLivestockResult.success && teamLivestockResult.data) {
            teamLivestockResult.data.forEach((item: any) => {
              activeItems[item.id] = item.active;
            });
          }
        }

        // Set active status for all items
        const itemsWithActiveStatus = result.data.map((item: LivestockItem) => ({
          ...item,
          active: activeItems[item.id] || false,
        }));

        setLivestockItems(itemsWithActiveStatus);
      } catch (error) {
        console.error('Error fetching Livestock items (full error):', error);
        toast.error(`Failed to load Livestock configuration`);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchLivestockItems();
    }
  }, [slug]);

  // Toggle the active state of a Livestock item
  const toggleLivestockItem = (id: string, isActive: boolean) => {
    setLivestockItems((prev) =>
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
      const itemsToUpdate = livestockItems.map((item) => ({
        livestockId: item.id,
        active: Boolean(item.active),
      }));

      const response = await fetch(`/api/teams/${slug}/livestock-items/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error?.message || 'Failed to update Livestock settings'
        );
      }

      toast.success('Livestock configuration saved successfully');
    } catch (error) {
      console.error('Error saving Livestock settings:', error);
      toast.error('Failed to save Livestock configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // If still loading tenant access or not a Livestock tenant, don't render content
  if (tenantLoading || !isLivestockTenant) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Configure Livestock - {slug}</title>
        <meta
          name="description"
          content="Configure livestock items for your team"
        />
      </Head>

      <main className="flex-1 overflow-y-auto focus:outline-none">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Configure Livestock
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Select which livestock are managed by your team.
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
              <div className="loader">Loading livestock items...</div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {livestockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {item.icon && (
                          <img 
                            src={item.icon} 
                            alt={item.name} 
                            className="w-8 h-8 mr-2"
                          />
                        )}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      setCheckedUser={(id, isActive) =>
                        toggleLivestockItem(item.id, isActive)
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

  const session = await getSession(context.req, context.res);
  const user = await getUserBySession(session);

  if (!user) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default withTenantAccess(ConfigureLivestockPage, 'configure-livestock');

