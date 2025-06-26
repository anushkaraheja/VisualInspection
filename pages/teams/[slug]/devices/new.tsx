import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getSession } from '@/lib/session';
import { getUserBySession } from 'models/user';
import { prisma } from 'lib/prisma';
import DeviceForm, {
  TeamPPEItemWithDetails,
} from 'components/devices/DeviceForm';
import useOrgTheme from 'hooks/useOrgTheme';
import { useTenantType } from 'utils/tenantAccess';
import { toast } from '@/lib/toast';
import { IoIosArrowBack } from 'react-icons/io';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { useAllLocationZones } from '@/components/teamDashboard/liveMonitoring/hooks';
import { DeviceData } from 'hooks/useZoneDevice';

export default function NewDevicePage() {
  const router = useRouter();
  const { slug, zoneId: urlZoneId } = router.query as {
    slug: string;
    zoneId?: string;
  };
  const { theme } = useOrgTheme(slug || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePPEItems, setActivePPEItems] = useState<
    TeamPPEItemWithDetails[]
  >([]);
  const { hasAccess: isPPETenant } = useTenantType('PPE');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Use the hook to get all zones from all locations
  const {
    allZones,
    isLoading: zonesLoading,
    error: zonesError,
  } = useAllLocationZones(slug);

  useEffect(() => {
    // Pre-select zone if provided in URL
    if (urlZoneId && !selectedZoneId) {
      setSelectedZoneId(urlZoneId);
    }

    // Only fetch PPE items if this is a PPE tenant
    if (isPPETenant && slug) {
      fetchPPEItems();
    }
  }, [slug, isPPETenant, urlZoneId, selectedZoneId]);

  const fetchPPEItems = async () => {
    try {
      const response = await fetch(`/api/teams/${slug}/ppe-items`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PPE items: ${response.statusText}`);
      }

      const data = await response.json();
      // Only use items that are active in the team
      const activeItems = data.data.filter(
        (item: TeamPPEItemWithDetails) => item.active
      );
      setActivePPEItems(activeItems);
    } catch (error: any) {
      console.error('Failed to fetch PPE items:', error);
      toast.error(`Error loading PPE items: ${error.message}`);
    }
  };

  const handleSubmit = async (formData: DeviceData) => {
    if (!selectedZoneId) {
      toast.error('Please select a zone for the device');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the location ID from the selected zone
      const selectedZone = allZones.find((zone) => zone.id === selectedZoneId);
      if (!selectedZone) {
        throw new Error('Selected zone not found');
      }

      // Convert deviceType to enum value expected by API
      const deviceData = {
        ...formData,
        deviceType: formData.deviceType,
        ppeItems: formData.ppeItems,
        zoneId: selectedZoneId,
      };


      const response = await fetch(
        `/api/teams/${slug}/locations/${selectedZone.locationId}/zones/${selectedZoneId}/devices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deviceData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create device');
      }

      toast.success('Device created successfully');
      router.push(`/teams/${slug}/devices`);
    } catch (error: any) {
      toast.error(
        error.message || 'An error occurred while creating the device'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10 mb-6';

  const inputClass =
    'bg-[#6A707E00] border border-[#949494] dark:border-borderColor dark:bg-surfaceColor placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  return (
    <>
      <Head>
        <title>Add New Device</title>
        <meta name="description" content="Add a new device to your system" />
      </Head>

      <div className="bg-[#f6f6fa] dark:bg-backgroundColor py-5 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-3xl mt-1 text-[#5E6C84]"
            >
              <IoIosArrowBack />
            </button>
            <div className="ml-2">
              <h1 className="text-4xl font-semibold font-montserrat dark:text-white">
                Create New Device
              </h1>
              <p className="text-[#5E6C84] dark:text-gray-400">
                Add a new device to your system
              </p>
            </div>
          </div>
          <ButtonFromTheme
            type="button"
            className="border border-solid rounded-md py-1 px-6"
            onClick={handleCancel}
            outline={true}
          >
            Cancel
          </ButtonFromTheme>
        </header>

        {/* Zone Selection */}
        <div className={groupFieldClass}>
          <h2 className="font-semibold text-xl dark:text-gray-300">
            Select Zone
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <label htmlFor="zoneId" className="mb-1 dark:text-gray-300">
                Zone*
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a zone</option>
                {allZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.locationName || 'Unknown Location'})
                  </option>
                ))}
              </select>
              {!selectedZoneId && (
                <p className="mt-1 text-sm text-red-500">
                  Please select a zone for this device
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Device Form */}
        {selectedZoneId && (
          <DeviceForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            availablePPEItems={activePPEItems}
          />
        )}
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { locale, params, query } = context;
  const { slug } = params as { slug: string };
  const { zoneId } = query as { zoneId?: string };

  const session = await getSession(context.req, context.res);
  const user = await getUserBySession(session);

  if (!user) {
    return {
      redirect: {
        destination: `/auth/login?callbackUrl=/teams/${slug}/devices`,
        permanent: false,
      },
    };
  }

  // Get team to verify it exists
  const team = await prisma.team.findUnique({
    where: { slug },
  });

  if (!team) {
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
