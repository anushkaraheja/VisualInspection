import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { WithLoadingAndError } from '@/components/shared';
import DeviceForm from '@/components/devices/DeviceForm';
import toast from 'react-hot-toast';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { IoIosArrowBack } from 'react-icons/io';
import useZoneDevice, { DeviceData } from 'hooks/useZoneDevice';
import useTeam from 'hooks/useTeam';

interface DeviceEditPageProps {
  slug: string;
  deviceId: string;
}

const DeviceEditPage: React.FC<DeviceEditPageProps> = ({ slug, deviceId }) => {
  const router = useRouter();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');

  // Get team information to access tenant type
  const { team } = useTeam();

  // First, we need to get the zone and location IDs from the device info
  // since getDevice requires them as parameters
  useEffect(() => {
    const getDeviceBasicInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teams/${slug}/locations/`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch device info');
        }
        
        const data = await response.json();
        if (!data.data?.zone) {
          throw new Error('Invalid device data returned');
        }
        
        setZoneId(data.data.zone.id);
        setLocationId(data.data.zone.location.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch device info');
        toast.error('Error loading device information');
      }
    };

    if (slug && deviceId) {
      getDeviceBasicInfo();
    }
  }, [slug, deviceId]);

  // Get device hook with the retrieved zoneId and locationId
  const { updateDevice, getDevice, isLoading: isSubmitting } = useZoneDevice({
    teamSlug: slug,
    locationId,
  });

  // Now that we have zoneId and locationId, use getDevice
  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (!zoneId || !locationId) return;
      
      try {
        // Use the hook's getDevice function to get full device details
        const deviceData = await getDevice(zoneId, deviceId);
        
        if (deviceData) {
          setDevice(deviceData);
        } else {
          throw new Error('Failed to fetch device details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch device details');
        toast.error('Error loading device data');
      } finally {
        setIsLoading(false);
      }
    };

    if (zoneId && locationId) {
      fetchDeviceDetails();
    }
  }, [zoneId, locationId, deviceId, getDevice]);

  // Handle form submission
  const handleSubmitDevice = async (formData: DeviceData) => {
    if (!device || !zoneId) {
      toast.error('Missing device information');
      return;
    }

    try {
      // Prepare device data for API
      const deviceData: DeviceData = {
        ...device, // Start with existing device data to maintain required fields
        id: device.id, // Ensure ID is preserved
        zoneId: device.zoneId, // Ensure zoneId is preserved
        createdAt: device.createdAt, // Preserve timestamps
        updatedAt: device.updatedAt,
        lastPing: device.lastPing,
        name: formData.name,
        deviceType: formData.deviceType,
        serialNumber: formData.serialNumber,
        model: formData.model,
        manufacturer: formData.manufacturer,
        ipAddress: formData.ipAddress,
        macAddress: formData.macAddress,
        firmwareVersion: formData.firmwareVersion,
        status: formData.status,
        config: {
          ...formData.config,
          fps: typeof formData.config?.fps === 'string' 
            ? parseInt(formData.config?.fps, 10) 
            : formData.config?.fps,
        },
        // Preserve optional fields if they exist
        ppeItems: formData.ppeItems,
        zone: device.zone,
        location: device.location
      };

      // Use the hook's updateDevice function
      const updatedDevice = await updateDevice(zoneId, deviceId, deviceData);
      
      if (updatedDevice) {
        toast.success('Device updated successfully');
        // Navigate back or to device list
        router.push(`/teams/${slug}/devices`);
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update device'
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Convert DeviceData to DeviceFormData format to avoid type errors
  // Using useMemo for performance optimization
  const formInitialData = useMemo(() => {
    if (!device) return undefined;
    
    // Ensure fps is properly converted to a number
    const fps = device.config?.fps;
    const parsedFps = fps !== undefined 
      ? (typeof fps === 'string' ? parseInt(fps, 10) : fps) 
      : 30;
    
    // Make sure we pass a complete DeviceData object
    return {
      // Keep all original fields from device
      ...device,
      // Ensure all required fields are present
      id: device.id,
      name: device.name,
      deviceType: device.deviceType,
      serialNumber: device.serialNumber ?? '',
      status: device.status,
      model: device.model ?? '',
      manufacturer: device.manufacturer ?? '',
      ipAddress: device.ipAddress ?? '',
      macAddress: device.macAddress ?? '',
      firmwareVersion: device.firmwareVersion ?? '',
      zoneId: device.zoneId,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      lastPing: device.lastPing,
      config: {
        ...(device.config || {}),
        connectionType: device.config?.connectionType || 'rtsp',
        rtspUrl: device.config?.rtspUrl || '',
        username: device.config?.username || '',
        password: device.config?.password || '', 
        fps: parsedFps,
        resolution: device.config?.resolution || '1920x1080',
        authenticated: device.config?.authenticated ?? true,
        apiEndpoint: device.config?.apiEndpoint || '',
        apiKey: device.config?.apiKey || '',
        webSocketUrl: device.config?.webSocketUrl || '',
      },
      ppeItems: device.ppeItems || [],
      // Keep zone if it exists
      zone: device.zone,
      // Keep location if it exists
      location: device.location
    };
  }, [device]);

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
                  Edit Device
                </h1>
                <p className="text-[#5E6C84]">
                  {device?.name}
                </p>
              </div>
            </div>
          </header>

          {device && formInitialData && (
            <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col p-8">
              <DeviceForm
                onSubmit={handleSubmitDevice}
                onCancel={handleCancel}
                initialData={formInitialData}
                isEdit={true}
                isSubmitting={isSubmitting}
                tenantType={team?.tenantTypeId!} // Pass the tenant type
              />
            </div>
          )}
        </div>
      </div>
    </WithLoadingAndError>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { slug, deviceId } = context.params || {};

  // Handle missing parameters
  if (!slug || !deviceId) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      slug,
      deviceId,
      ...(context.locale
        ? await serverSideTranslations(context.locale, ['common'])
        : {}),
    },
  };
}

export default DeviceEditPage;
