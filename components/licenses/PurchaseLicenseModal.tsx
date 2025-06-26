import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { toast } from '@/lib/toast';
import { purchaseLicense } from './licenseService';
import { License } from 'types/license';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import Modal from '../shared/Modal';

interface PurchaseLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License;
  teamSlug: string;
  onSuccess: () => void;
}

export const PurchaseLicenseModal = ({
  isOpen,
  onClose,
  license,
  teamSlug,
  onSuccess,
}: PurchaseLicenseModalProps) => {
  const { t } = useTranslation('common');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 1) {
      toast.error(t('Quantity must be at least 1'));
      return;
    }

    try {
      setIsSubmitting(true);

      if (!license || !license.id) {
        throw new Error('Invalid license selected');
      }

      const result = await purchaseLicense(teamSlug, {
        licenseId: license.id,
        quantity: quantity,
        metadata: {},
      });

      toast.success(t('License Purchased Successfully'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('License purchase error:', error);
      toast.error(error.message || t('Error Purchasing License'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} close={onClose}>
      <Modal.Header>{t('Purchase License')}</Modal.Header>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('License Name')}
          </label>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
            {license.name}
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('Quantity')}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <ButtonFromTheme
            type="button"
            className="btn btn-secondary w-full sm:w-auto mb-2 sm:mb-0"
            onClick={onClose}
          >
            {t('Cancel')}
          </ButtonFromTheme>
          <ButtonFromTheme
            type="submit"
            className="btn btn-primary w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Submitting...') : t('Purchase')}
          </ButtonFromTheme>
        </div>
      </form>
    </Modal>
  );
};
