import React, { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import { useRouter } from 'next/router';
import { TeamPPEItem, DeviceType, DeviceStatus, Zone } from '@prisma/client';
import { DeviceData } from 'hooks/useZoneDevice';

// Connection type options
const connectionTypes = [
  { value: 'rtsp', label: 'RTSP (Real Time Streaming Protocol)' },
  { value: 'webrtc', label: 'WebRTC' },
  { value: 'onvif', label: 'ONVIF' },
  { value: 'http', label: 'HTTP/HTTPS Stream' },
  { value: 'ws', label: 'WebSocket' },
];

// Resolution options
const resolutions = [
  '640x480',
  '1280x720',
  '1920x1080',
  '2560x1440',
  '3840x2160',
];

// Device types
const deviceTypes = [
  { value: 'CAMERA', label: 'Camera' },
  { value: 'SENSOR', label: 'Sensor' },
  { value: 'ACCESS_CONTROL', label: 'Access Control' },
  { value: 'OTHER', label: 'Other' },
];

// Device status options
const statusOptions = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'ERROR', label: 'Error' },
];

export type PPEItem = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  ppeItem?: {
    id: string;
    name: string;
    description?: string;
  };
  ppeItemId?: string;
};

export type TeamPPEItemWithDetails = TeamPPEItem & { ppeItem: PPEItem };

interface DeviceFormProps {
  onSubmit: (formData: DeviceData) => void;
  onCancel: () => void;
  initialData?: DeviceData;
  isEdit?: boolean;
  isSubmitting?: boolean;
  availablePPEItems?: TeamPPEItemWithDetails[];
  tenantType?: string; // Add tenant type to props
}

const DeviceForm: React.FC<DeviceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
  isSubmitting = false,
  availablePPEItems = [],
  tenantType = '', // Default to empty string
}) => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [teamPPEItems, setTeamPPEItems] = useState<TeamPPEItemWithDetails[]>(
    []
  );

  // Check if the tenant is a PPE tenant
  const isPPETenant = tenantType === 'PPE';

  useEffect(() => {
    // Only fetch PPE items if this is a PPE tenant
    if (!isPPETenant) return;

    // If availablePPEItems is provided as prop, use it
    if (availablePPEItems.length > 0) {
      setTeamPPEItems(availablePPEItems);
    } else if (slug) {
      // Otherwise fetch team's active PPE items
      const fetchTeamPPE = async () => {
        try {
          const response = await fetch(`/api/teams/${slug}/ppe-items`);
          if (response.ok) {
            const data = await response.json();
            const activeItems = data.data.filter(
              (item: TeamPPEItemWithDetails) => item.active
            );
            setTeamPPEItems(activeItems);
          }
        } catch (error) {
          console.error('Failed to fetch team PPE items:', error);
        }
      };
      fetchTeamPPE();
    }
  }, [slug, isPPETenant, availablePPEItems]);

  // Convert DeviceData to DeviceFormData format to avoid type errors
  // Using useMemo for performance optimization
  const formInitialData = useMemo(() => {
    if (!initialData) return undefined;

    // Ensure fps is properly converted to a number
    const fps = initialData.config?.fps;
    const parsedFps =
      fps !== undefined
        ? typeof fps === 'string'
          ? parseInt(fps, 10)
          : fps
        : 30;

    return {
      // Ensure all required fields from DeviceData interface are included
      id: initialData.id || '',
      zoneId: initialData.zoneId || '',
      createdAt: initialData.createdAt || '',
      updatedAt: initialData.updatedAt || '',
      lastPing: initialData.lastPing || '',
      name: initialData.name,
      deviceType: initialData.deviceType,
      serialNumber: initialData.serialNumber ?? '',
      status: initialData.status,
      model: initialData.model ?? '',
      manufacturer: initialData.manufacturer ?? '',
      ipAddress: initialData.ipAddress ?? '',
      macAddress: initialData.macAddress ?? '',
      firmwareVersion: initialData.firmwareVersion ?? '',
      config: {
        connectionType: initialData.config?.connectionType || 'rtsp',
        rtspUrl: initialData.config?.rtspUrl || '',
        username: initialData.config?.username || '',
        password: initialData.config?.password || '',
        fps: parsedFps,
        resolution: initialData.config?.resolution || '1920x1080',
        authenticated: initialData.config?.authenticated ?? true,
        apiEndpoint: initialData.config?.apiEndpoint || '',
        apiKey: initialData.config?.apiKey || '',
        webSocketUrl: initialData.config?.webSocketUrl || '',
      },
      ppeItems: initialData.ppeItems || [],
      // Include zone property if it exists in original data
      ...(initialData.zone && { zone: initialData.zone }),
      // Include location property if it exists in original data
      ...(initialData.location && { location: initialData.location }),
    };
  }, [initialData]);

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: formInitialData || {
      id: '',
      name: '',
      deviceType: 'CAMERA' as DeviceType, // Cast as DeviceType to fix type issue
      serialNumber: '',
      status: 'OFFLINE' as DeviceStatus, // Cast as DeviceStatus to fix type issue
      model: '',
      manufacturer: '',
      ipAddress: '',
      macAddress: '',
      firmwareVersion: '',
      zoneId: '', // Required by the interface
      createdAt: '', // Required by the interface
      updatedAt: '', // Required by the interface
      lastPing: '', // Required by the interface
      config: {
        connectionType: 'http',
        rtspUrl: '',
        username: '',
        password: '',
        fps: 30,
        resolution: '1920x1080',
        authenticated: true,
        apiEndpoint: '',
        apiKey: '',
        webSocketUrl: '',
      },
      ppeItems: [],
    },
    enableReinitialize: true, // This ensures the form reinitializes when initialData changes
    validationSchema: Yup.object({
      name: Yup.string().required('Device name is required'),
      // Add more validation as needed
    }),
    onSubmit: (values) => {
      // Ensure config is defined
      const config = values.config || {};

      // Connection-specific validation
      if (config.connectionType === 'rtsp') {
        if (!config.rtspUrl) {
          alert('RTSP URL is required for RTSP connection type');
          return;
        }
        if (config.authenticated && (!config.username || !config.password)) {
          alert(
            'Username and Password are required when authentication is enabled'
          );
          return;
        }
      } else if (config.connectionType === 'http' && !config.apiEndpoint) {
        alert('API Endpoint is required for HTTP connection type');
        return;
      } else if (config.connectionType === 'ws' && !config.webSocketUrl) {
        alert('WebSocket URL is required for WebSocket connection type');
        return;
      }



      // Make sure the submission data preserves existing values and has correct types
      const submissionData: DeviceData = {
        ...values,
        // Ensure deviceType is of type DeviceType enum
        deviceType: values.deviceType as DeviceType,
        // Ensure status is of type DeviceStatus enum
        status: values.status as DeviceStatus,
        // Set defaults only for missing fields
        serialNumber: values.serialNumber ?? '',
        model: values.model ?? '',
        manufacturer: values.manufacturer ?? '',
        ipAddress: values.ipAddress ?? '',
        macAddress: values.macAddress ?? '',
        firmwareVersion: values.firmwareVersion ?? '',
        config: values.config || {},
        ppeItems: values.ppeItems ?? [], // Set empty array as default if not provided
      };

      onSubmit(submissionData);
      formik.resetForm();
    },
  });

  const handleCancel = () => {
    formik.resetForm();
    onCancel();
  };

  // Function to handle PPE item checkbox changes
  const handlePPEItemChange = (id: string, checked: boolean) => {
    // Initialize ppeItems as an empty array if it doesn't exist or isn't an array
    const currentPPEItems = Array.isArray(formik.values.ppeItems)
      ? [...formik.values.ppeItems]
      : [];

    if (checked) {
      if (!currentPPEItems.includes(id)) {
        formik.setFieldValue('ppeItems', [...currentPPEItems, id]);
      }
    } else {
      formik.setFieldValue(
        'ppeItems',
        currentPPEItems.filter((itemId) => itemId !== id)
      );
    }
  };

  // Render connection-specific fields based on selected connection type
  const renderConnectionSpecificFields = () => {
    const connectionType = formik.values.config?.connectionType || 'http';

    switch (connectionType) {
      case 'rtsp':
        return (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                RTSP URL*
              </label>
              <input
                type="text"
                id="config.rtspUrl"
                name="config.rtspUrl"
                value={formik.values.config?.rtspUrl || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
                placeholder="rtsp://username:password@ip:port/stream"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: rtsp://username:password@ip:port/stream
              </p>
            </div>

            <div className="col-span-2 mb-2">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="config.authenticated"
                  name="config.authenticated"
                  checked={formik.values.config?.authenticated || false}
                  onChange={formik.handleChange}
                  className="mr-2"
                />
                <label
                  htmlFor="config.authenticated"
                  className="text-sm font-medium"
                >
                  Requires Authentication
                </label>
              </div>
            </div>

            {formik.values.config?.authenticated && (
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username*
                  </label>
                  <input
                    type="text"
                    id="config.username"
                    name="config.username"
                    value={formik.values.config?.username || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password*
                  </label>
                  <input
                    type="password"
                    id="config.password"
                    name="config.password"
                    value={formik.values.config?.password || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </>
        );
      case 'http':
        return (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                API Endpoint*
              </label>
              <input
                type="text"
                id="config.apiEndpoint"
                name="config.apiEndpoint"
                value={formik.values.config?.apiEndpoint || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
                placeholder="https://api.example.com/stream"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="text"
                id="config.apiKey"
                name="config.apiKey"
                value={formik.values.config?.apiKey || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
                placeholder="Enter API key"
              />
            </div>
          </>
        );
      case 'ws':
        return (
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              WebSocket URL*
            </label>
            <input
              type="text"
              id="config.webSocketUrl"
              name="config.webSocketUrl"
              value={formik.values.config?.webSocketUrl || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
              placeholder="ws://server:port/stream"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Updated styling based on zones/new.tsx
  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10 mb-6';

  const inputClass =
    'bg-[#6A707E00] border border-[#949494] dark:border-borderColor dark:bg-surfaceColor placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  return (
    <div className="bg-[#f6f6fa] dark:bg-backgroundColor py-5">
      <div className="flex flex-col gap-4">
        {/* Basic Information Section */}
        <div className={groupFieldClass}>
          <h2 className="font-semibold text-xl dark:text-gray-300">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Device Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="Enter device name"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 mt-1 text-sm">
                  {formik.errors.name}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                id="deviceType"
                name="deviceType"
                value={formik.values.deviceType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
              >
                {deviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Serial Number*
              </label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formik.values.serialNumber || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="Enter serial number"
              />
              {formik.touched.serialNumber && formik.errors.serialNumber && (
                <div className="text-red-500 mt-1 text-sm">
                  {formik.errors.serialNumber}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className={groupFieldClass}>
          <h2 className="font-semibold text-xl dark:text-gray-300">
            Additional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formik.values.model || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="e.g., DH-SD59230U-HNI"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Manufacturer
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formik.values.manufacturer || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="e.g., Dahua"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                IP Address
              </label>
              <input
                type="text"
                id="ipAddress"
                name="ipAddress"
                value={formik.values.ipAddress || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                MAC Address
              </label>
              <input
                type="text"
                id="macAddress"
                name="macAddress"
                value={formik.values.macAddress || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
                placeholder="e.g., 00:11:22:33:44:55"
              />
            </div>
          </div>
        </div>

        {/* Connection Settings Section */}
        <div className={groupFieldClass}>
          <h2 className="font-semibold text-xl dark:text-gray-300">
            Connection Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Connection Type
              </label>
              <select
                id="config.connectionType"
                name="config.connectionType"
                value={formik.values.config?.connectionType || 'http'}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass}
              >
                {connectionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formik.values.deviceType === 'CAMERA' && (
              <>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Resolution
                  </label>
                  <select
                    id="config.resolution"
                    name="config.resolution"
                    value={formik.values.config?.resolution || '1920x1080'}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={inputClass}
                  >
                    {resolutions.map((res) => (
                      <option key={res} value={res}>
                        {res}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    FPS
                  </label>
                  <input
                    type="number"
                    id="config.fps"
                    name="config.fps"
                    value={formik.values.config?.fps || 30}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="1"
                    max="60"
                    className={inputClass}
                    placeholder="e.g., 30"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {renderConnectionSpecificFields()}
          </div>
        </div>

        {/* PPE Section - Only show for PPE tenants */}
        {isPPETenant && teamPPEItems.length > 0 && (
          <div className={groupFieldClass}>
            <h2 className="font-semibold text-xl dark:text-gray-300">
              Required PPE Equipment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teamPPEItems.map((item) => (
                <div key={item.id} className="flex items-center">
                  <input
                    id={`ppe-${item.id}`}
                    name={`ppe-${item.id}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={
                      Array.isArray(formik.values.ppeItems) &&
                      formik.values.ppeItems?.includes(item.id)
                    }
                    onChange={(e) =>
                      handlePPEItemChange(item.id, e.target.checked)
                    }
                  />
                  <label
                    htmlFor={`ppe-${item.id}`}
                    className="ml-3 block text-sm font-medium leading-6 text-gray-700 dark:text-gray-300"
                  >
                    {item.ppeItem?.name || 'Unknown Item'}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <ButtonFromTheme
            type="button"
            onClick={handleCancel}
            outline={true}
            className="px-4 py-2 text-sm font-medium rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </ButtonFromTheme>
          <ButtonFromTheme
            type="submit"
            onClick={formik.handleSubmit}
            className="px-4 py-2 text-sm font-medium rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : isEdit
              ? 'Update Device'
              : 'Save Device'}
          </ButtonFromTheme>
        </div>
      </div>
    </div>
  );
};

export default DeviceForm;
