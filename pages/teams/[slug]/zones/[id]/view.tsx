import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { WithLoadingAndError } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import { IoIosArrowBack } from 'react-icons/io';
import { ImPencil } from 'react-icons/im';
import { MdDeleteOutline } from 'react-icons/md';
import { BsCameraVideo } from 'react-icons/bs';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { DeviceStatus, DeviceType } from '@prisma/client';
import DeviceModal from '@/components/devices/DeviceModal';
import { useZoneDetails } from '@/components/teamDashboard/liveMonitoring/hooks';
import { DeviceData } from 'hooks/useZoneDevice';

const ZoneView = () => {
  const router = useRouter();
  const { slug, id: zoneId } = router.query;

  // Use the custom hook instead of manual fetching
  const {
    zoneDetails: zone,
    isLoading,
    error,
  } = useZoneDetails(slug as string, zoneId as string);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);



  const handleDeleteZone = async () => {
    if (
      !window.confirm('Are you sure you want to delete this zone?') ||
      !zone ||
      !slug
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teams/${slug}/locations/${zone.locationId}/zones/${zone.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        router.push(`/teams/${slug}/zones`);
      } else {
        throw new Error('Failed to delete zone');
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  const getDeviceStatusClass = (status: DeviceStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleEditDevice = (device: DeviceData) => {
   
    setSelectedDevice(device);
    setIsDeviceModalOpen(true);
  };

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
    setSelectedDevice(null);
  };

  const handleAddDevice = (zoneId: string, device: DeviceData) => {
    if (zone) {
      // Preserve all original data, just ensure required fields are present
      const completeDevice: DeviceData = {
        ...device,
        // Only set defaults for missing fields
        serialNumber: device.serialNumber ?? '',
        model: device.model ?? '',
        manufacturer: device.manufacturer ?? '',
        ipAddress: device.ipAddress ?? '',
        macAddress: device.macAddress ?? '',
        firmwareVersion: device.firmwareVersion ?? '',
        config: {
          ...(device.config || {}),
        },
        ppeItems: device.ppeItems ?? [],
      };

      const updatedDevices =
        zone.devices?.map((d) => (d.id === completeDevice.id ? completeDevice : d)) || [];

      if (!zone.devices?.some((d) => d.id === completeDevice.id)) {
        updatedDevices.push(completeDevice);
      }

      zone.devices = updatedDevices;
    }
  };

  const handleViewDevice = (device: DeviceData) => {
    router.push({
      pathname: `/teams/${slug}/live-monitoring`,
      query: { device: device.id },
    });
  };

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="py-5 lg:px-8">
        <div className="flex flex-col gap-4">
          <header className="flex justify-between mb-2">
            <div className="flex items-start">
              <button
                onClick={() => router.back()}
                className="text-3xl mt-1 text-[#5E6C84]"
              >
                <IoIosArrowBack />
              </button>
              <div className="ml-2">
                <h1 className="text-4xl font-semibold font-montserrat">
                  {zone?.name}
                </h1>
                <p className="text-[#5E6C84]">Zone Details</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <ButtonFromTheme
                outline={true}
                className="border border-solid rounded-md my-2.5 px-6 hover:text-white"
                onClick={handleDeleteZone}
              >
                Delete
              </ButtonFromTheme>
              <ButtonFromTheme
                className="border border-solid text-white rounded-md my-2.5 px-6 hover:text-white"
                onClick={() =>
                  router.push(`/teams/${slug}/zones/${zoneId}/edit`)
                }
              >
                Edit
              </ButtonFromTheme>
            </div>
          </header>

          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <h2 className="font-semibold text-xl">Zone Information</h2>
            <div className="flex flex-1 gap-2">
              <div className="flex flex-col flex-1">
                <p>Zone Name</p>
                <p className="text-[#464A53] text-xl font-[600] dark:text-textColor">
                  {zone?.name}
                </p>
              </div>
              <div className="flex flex-col flex-1">
                <p>Description</p>
                <p className="text-[#464A53] text-xl font-[600] dark:text-textColor">
                  {zone?.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <h2 className="font-semibold text-xl">Location Information</h2>
            <div className="flex flex-1 gap-2">
              <div className="flex flex-col flex-1">
                <p>Location Name</p>
                <p className="text-[#464A53] text-xl font-[600] dark:text-textColor">
                  {zone?.location?.name || 'N/A'}
                </p>
              </div>
              <div className="flex flex-col flex-1">
                <p>Address</p>
                <p className="text-[#464A53] text-xl font-[600] dark:text-textColor">
                  {zone?.location ? (
                    <>
                      {zone.location.addressL1},{' '}
                      {zone.location.addressL2 &&
                        `${zone.location.addressL2}, `}
                      {zone.location.city}, {zone.location.state}{' '}
                      {zone.location.zip}
                    </>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <div className="flex justify-between border-b pb-3 items-center">
              <h2 className="font-semibold text-xl">Devices</h2>
              <ButtonFromTheme
                outline={true}
                className="py-2 px-10 border rounded-md hover:text-white"
                onClick={() =>
                  router.push(
                    `/teams/${slug}/devices?location=${zone?.locationId}&zone=${zone?.id}`
                  )
                }
              >
                Manage Devices
              </ButtonFromTheme>
            </div>
            {!zone?.devices ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : zone.devices.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No devices have been added to this zone yet.
              </div>
            ) : (
              <div className="mt-4">
                <Table
                  cols={[
                    'Device Name',
                    'Type',
                    'Status',
                    'IP Address',
                    'Model',
                    'Actions',
                  ]}
                  body={(zone.devices || []).map((device) => {
                    return {
                      id: device.id || '',
                      cells: [
                        {
                          wrap: false,
                          element: (
                            <button
                              onClick={() => handleViewDevice(device)}
                              className="text-left text-blue-600 hover:underline"
                            >
                              {device.name}
                            </button>
                          ),
                        },
                        {
                          wrap: false,
                          text: device.deviceType
                            ? device.deviceType.replace('_', ' ')
                            : 'Unknown',
                        },
                        {
                          wrap: false,
                          element: (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getDeviceStatusClass(device.status)}`}
                            >
                              {device.status}
                            </span>
                          ),
                        },
                        {
                          wrap: false,
                          text: device.ipAddress || 'N/A',
                        },
                        {
                          wrap: false,
                          text: device.model || 'N/A',
                        },
                        {
                          wrap: false,
                          actions: [
                            {
                              text: 'View Live Feed',
                              icon: (
                                <BsCameraVideo className="text-[#606060] dark:text-textColor text-l ml-1" />
                              ),
                              onClick: () => handleViewDevice(device),
                            },
                            {
                              text: 'Edit Device',
                              icon: (
                                <ImPencil className="text-[#606060] dark:text-textColor text-l ml-1" />
                              ),
                              onClick: () => handleEditDevice(device),
                            },
                            {
                              text: 'Delete Device',
                              icon: (
                                <MdDeleteOutline className="text-[#606060] dark:text-textColor text-l ml-1" />
                              ),
                              onClick: () => {
                                console.log('Delete device:', device.id);
                              },
                            },
                          ],
                        },
                      ],
                    };
                  })}
                  showDropdown={false}
                />
              </div>
            )}
          </div>

          {zone && (
            <DeviceModal
              isOpen={isDeviceModalOpen}
              onClose={handleCloseDeviceModal}
              zone={zone}
              teamSlug={slug as string}
              locationId={zone.locationId}
              onAddDevice={handleAddDevice}
              initialDevice={selectedDevice}
            />
          )}
        </div>
      </div>
    </WithLoadingAndError>
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

export default ZoneView;