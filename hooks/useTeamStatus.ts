import { useState } from 'react';
import { toast } from '@/lib/toast';
import { useTranslation } from 'next-i18next';
import { useTeamComplianceStatuses } from './useAlerts';
import { ComplianceStatusInfo } from './useAlerts';

/**
 * Hook to manage team compliance status operations
 * @param teamSlug The team slug for API calls
 */
export function useTeamStatus(teamSlug: string | undefined) {
  const { t } = useTranslation('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatusInfo | null>(null);
  
  const { statuses, isLoading, error, mutate } = useTeamComplianceStatuses(teamSlug);

  /**
   * Creates a new team compliance status
   * @param data Status data to create
   */
  const createStatus = async (data: Omit<ComplianceStatusInfo, 'id'>) => {
    if (!teamSlug) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamSlug}/compliance-statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(t('status-created'));
        await mutate();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || t('something-went-wrong'));
        return false;
      }
    } catch (error) {
      toast.error(t('something-went-wrong'));
      return false;
    }
  };

  /**
   * Creates default statuses in a batch
   * @param statuses Array of statuses to create
   */
  const createDefaultStatuses = async (statuses: Omit<ComplianceStatusInfo, 'id'>[]) => {
    if (!teamSlug) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamSlug}/compliance-statuses/defaults`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statuses }),
      });

      if (response.ok) {
        await mutate();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || t('something-went-wrong'));
        return false;
      }
    } catch (error) {
      toast.error(t('something-went-wrong'));
      return false;
    }
  };

  /**
   * Updates an existing team compliance status
   * @param statusId ID of the status to update
   * @param data Updated status data
   */
  const updateStatus = async (statusId: string, data: Partial<ComplianceStatusInfo>) => {
    if (!teamSlug) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamSlug}/compliance-statuses/${statusId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(t('status-updated'));
        await mutate();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || t('something-went-wrong'));
        return false;
      }
    } catch (error) {
      toast.error(t('something-went-wrong'));
      return false;
    }
  };

  /**
   * Deletes a team compliance status
   * @param statusId ID of the status to delete
   */
  const deleteStatus = async (statusId: string) => {
    if (!teamSlug) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamSlug}/compliance-statuses/${statusId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('status-deleted'));
        await mutate();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || t('something-went-wrong'));
        return false;
      }
    } catch (error) {
      toast.error(t('something-went-wrong'));
      return false;
    }
  };

  /**
   * Modal management functions
   */
  const openCreateModal = () => {
    setSelectedStatus(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (status: ComplianceStatusInfo) => {
    setSelectedStatus(status);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (status: ComplianceStatusInfo) => {
    setSelectedStatus(status);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStatus(null);
  };

  return {
    // State
    statuses,
    isLoading,
    error,
    selectedStatus,
    isModalOpen,
    isDeleteModalOpen,
    isEditing,
    
    // API Actions
    createStatus,
    createDefaultStatuses,
    updateStatus,
    deleteStatus,
    refreshStatuses: mutate,
    
    // Modal Actions
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    closeDeleteModal,
  };
}
