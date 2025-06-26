import React, { useState, useEffect } from 'react';
import ModalRightScreen from '../shared/ModalRightScreen';
import { Zone } from 'services/zoneService';
import DeviceForm from '../devices/DeviceForm';
import toast from 'react-hot-toast';
import useZoneDevice, { DeviceData } from '../../hooks/useZoneDevice';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: Zone;
  teamSlug: string;
  locationId: string;
  onAddDevice: (zoneId: string, device: DeviceData) => void;
  initialDevice?: DeviceData | null;
}

const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  zone,
  teamSlug,
  locationId,
  onAddDevice,
  initialDevice = null,
}) => {
  const [editingDevice, setEditingDevice] = useState<DeviceData | null>(null);
  const { updateDevice, isLoading } = useZoneDevice({ teamSlug, locationId });

  // When initialDevice changes, set the editing device with all required fields
  useEffect(() => {
    if (initialDevice) {
      // Only add missing fields, don't overwrite existing ones
      const completeDevice: DeviceData = {
        ...initialDevice,
        // Only set these if they're undefined/null
        serialNumber: initialDevice.serialNumber ?? '',
        model: initialDevice.model ?? '',
        manufacturer: initialDevice.manufacturer ?? '',
        ipAddress: initialDevice.ipAddress ?? '',
        macAddress: initialDevice.macAddress ?? '',
        firmwareVersion: initialDevice.firmwareVersion ?? '',
        config: {
          ...initialDevice.config, // Keep existing config values
          // Only set defaults for missing config values
          connectionType: initialDevice.config?.connectionType ?? 'http',
          rtspUrl: initialDevice.config?.rtspUrl ?? '',
          username: initialDevice.config?.username ?? '',
          password: initialDevice.config?.password ?? '',
          fps: initialDevice.config?.fps ?? 30,
          resolution: initialDevice.config?.resolution ?? '1920x1080',
          authenticated: initialDevice.config?.authenticated ?? true,
          apiEndpoint: initialDevice.config?.apiEndpoint ?? '',
          apiKey: initialDevice.config?.apiKey ?? '',
          webSocketUrl: initialDevice.config?.webSocketUrl ?? '',
        },
        ppeItems: initialDevice.ppeItems ?? [],
      };
      

      setEditingDevice(completeDevice);
    }
  }, [initialDevice]);

  const handleSubmitDevice = async (formData: DeviceData) => {
    try {
      // Preserve existing data, just ensure required fields exist
      const deviceData: DeviceData = {
        ...formData,
        // Only set defaults if the values are undefined/null
        serialNumber: formData.serialNumber ?? '',
        model: formData.model ?? '',
        manufacturer: formData.manufacturer ?? '',
        ipAddress: formData.ipAddress ?? '',
        macAddress: formData.macAddress ?? '',
        firmwareVersion: formData.firmwareVersion ?? '',
        config: {
          ...formData.config,
        },
        ppeItems: formData.ppeItems ?? [],
      };
      


      if (editingDevice?.id) {
        // Use the hook to update the device
        const updatedDevice = await updateDevice(zone.id, editingDevice.id, deviceData);

        if (updatedDevice) {
          toast.success('Device updated successfully');
          // Update the device in the UI
          onAddDevice(zone.id, updatedDevice);
          handleModalClose();
        }
      } else {
        // This shouldn't happen in edit-only mode, but handle just in case
        toast.error('Cannot create new device in edit mode');
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update device'
      );
    }
  };

  const handleCancelForm = () => {
    handleModalClose();
  };

  const handleModalClose = () => {
    setEditingDevice(null);
    onClose();
  };

  return (
    <ModalRightScreen isOpen={isOpen} onClose={handleModalClose} width="w-2/5">
      <ModalRightScreen.Header>
        <div>
          <ModalRightScreen.Title>Edit Device</ModalRightScreen.Title>
          <ModalRightScreen.Subtitle className="mt-1">
            Update device details in zone:{' '}
            <span className="text-[#DB282E]">{zone.name}</span>
          </ModalRightScreen.Subtitle>
        </div>
      </ModalRightScreen.Header>

      <ModalRightScreen.Content>
        {/* Only render the form when we have a complete editingDevice */}
        {editingDevice ? (
          <DeviceForm
            onSubmit={handleSubmitDevice}
            onCancel={handleCancelForm}
            initialData={editingDevice}
            isEdit={true}
            isSubmitting={isLoading}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        )}
      </ModalRightScreen.Content>
    </ModalRightScreen>
  );
};

export default DeviceModal;
