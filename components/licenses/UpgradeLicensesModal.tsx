import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { toast } from '@/lib/toast';
import { purchaseLicense } from './licenseService';
import { License, LicenseStatus } from 'types/license';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import Modal from '../shared/Modal';
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiCheck,
  FiShoppingCart,
  FiUsers,
  FiHome,
} from 'react-icons/fi';

interface UpgradeLicensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSlug: string;
  availableLicenses: License[];
  onSuccess: () => void;
}

interface LicenseSelection {
  license: License;
  quantity: number;
}

export const UpgradeLicensesModal = ({
  isOpen,
  onClose,
  teamSlug,
  availableLicenses,
  onSuccess,
}: UpgradeLicensesModalProps) => {
  const { t } = useTranslation('common');
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseSelection[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'browse' | 'cart'>('browse');

  // Reset the form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLicenses([]);
      setSearchTerm('');
      setView('browse');
    }
  }, [isOpen]);

  // Filter licenses based on search term
  const filteredLicenses = useMemo(() => {
    if (!searchTerm.trim()) return availableLicenses;

    const lowerCaseSearch = searchTerm.toLowerCase();
    return availableLicenses.filter(
      (license) =>
        license.name.toLowerCase().includes(lowerCaseSearch) ||
        license.description?.toLowerCase().includes(lowerCaseSearch) ||
        license.type.toLowerCase().includes(lowerCaseSearch) ||
        license.features.some((f) => f.toLowerCase().includes(lowerCaseSearch))
    );
  }, [availableLicenses, searchTerm]);

  // Calculate total price
  const totalPrice = selectedLicenses.reduce(
    (total, item) => total + item.license.price * item.quantity,
    0
  );

  // Check if a license is selected
  const isLicenseSelected = (licenseId: string) => {
    return selectedLicenses.some((item) => item.license.id === licenseId);
  };

  // Get quantity for a selected license
  const getLicenseQuantity = (licenseId: string) => {
    const selection = selectedLicenses.find(
      (item) => item.license.id === licenseId
    );
    return selection ? selection.quantity : 0;
  };

  const handleSelectLicense = (license: License) => {
    if (isLicenseSelected(license.id)) {
      // Remove if already selected
      setSelectedLicenses(
        selectedLicenses.filter((item) => item.license.id !== license.id)
      );
    } else {
      // Add if not selected
      setSelectedLicenses([...selectedLicenses, { license, quantity: 1 }]);
    }
  };

  const handleChangeQuantity = (licenseId: string, quantity: number) => {
    setSelectedLicenses(
      selectedLicenses.map((item) =>
        item.license.id === licenseId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handleRemoveLicense = (licenseId: string) => {
    setSelectedLicenses(
      selectedLicenses.filter((item) => item.license.id !== licenseId)
    );
  };

  const getStatusColor = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case LicenseStatus.EXPIRED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case LicenseStatus.SUSPENDED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case LicenseStatus.PENDING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedLicenses.length === 0) {
      toast.error(t('Please select at least one license'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Purchase licenses sequentially
      for (const selection of selectedLicenses) {
        await purchaseLicense(teamSlug, {
          licenseId: selection.license.id,
          quantity: selection.quantity,
          metadata: {},
        });
      }

      toast.success(t('Licenses Purchased Successfully'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('License purchase error:', error);
      toast.error(error.message || t('Error Purchasing Licenses'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} close={onClose}>
      <Modal.Header>{t('Upgrade Licenses')}</Modal.Header>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="mb-4 flex items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 sm:text-sm"
              placeholder={t('Search licenses...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-4 flex items-center">
            <button
              type="button"
              className={`btn ${view === 'browse' ? 'btn-primary' : 'btn-ghost'} mr-2`}
              onClick={() => setView('browse')}
            >
              {t('Browse')}
            </button>
            <button
              type="button"
              className={`btn ${view === 'cart' ? 'btn-primary' : 'btn-ghost'} flex items-center`}
              onClick={() => setView('cart')}
              disabled={selectedLicenses.length === 0}
            >
              <FiShoppingCart className="mr-2" />
              {t('Cart')}
              {selectedLicenses.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedLicenses.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {view === 'browse' ? (
          <div className="overflow-y-auto max-h-96 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLicenses.map((license) => {
                const isSelected = isLicenseSelected(license.id);
                const quantity = getLicenseQuantity(license.id);

                return (
                  <div
                    key={license.id}
                    className={`border rounded-lg ${isSelected ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-surfaceColor overflow-hidden`}
                  >
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-textColor line-clamp-1">
                          {license.name}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(license.status)}`}
                        >
                          {t(license.status.toLowerCase())}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {license.description || t('No description available')}
                      </p>

                      <div className="text-xl font-bold text-gray-900 dark:text-textColor mb-3">
                        ${license.price.toFixed(2)}{' '}
                        <span className="text-sm font-normal">
                          / {t(license.renewalPeriod.toLowerCase())}
                        </span>
                      </div>

                      <div className="space-y-2 mt-auto">
                        {license.maxUsers && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <FiUsers className="w-4 h-4 mr-1" />
                            <span>
                              {license.maxUsers} {t('users')}
                            </span>
                          </div>
                        )}

                        {license.maxLocations && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <FiHome className="w-4 h-4 mr-1" />
                            <span>
                              {license.maxLocations} {t('locations')}
                            </span>
                          </div>
                        )}

                        {license.features && license.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {license.features
                              .slice(0, 2)
                              .map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-300"
                                >
                                  {feature}
                                </span>
                              ))}
                            {license.features.length > 2 && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-300">
                                +{license.features.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {isSelected ? (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-circle btn-ghost"
                              onClick={() =>
                                handleChangeQuantity(license.id, quantity - 1)
                              }
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            <span className="text-gray-700 dark:text-gray-300 w-8 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-circle btn-ghost"
                              onClick={() =>
                                handleChangeQuantity(license.id, quantity + 1)
                              }
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span></span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectLicense(license)}
                          className={`btn btn-sm ${isSelected ? 'btn-error' : 'btn-primary'}`}
                        >
                          {isSelected ? t('Remove') : t('Select')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredLicenses.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('No licenses found matching your search')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto max-h-96">
            {selectedLicenses.length > 0 ? (
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="py-2 px-4 text-left">{t('License')}</th>
                      <th className="py-2 px-4 text-center">{t('Quantity')}</th>
                      <th className="py-2 px-4 text-right">{t('Price')}</th>
                      <th className="py-2 px-4 text-right">{t('Total')}</th>
                      <th className="py-2 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {selectedLicenses.map((item) => (
                      <tr key={item.license.id} className="dark:text-gray-200">
                        <td className="py-3 px-4">{item.license.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() =>
                                handleChangeQuantity(
                                  item.license.id,
                                  item.quantity - 1
                                )
                              }
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <span className="mx-2">{item.quantity}</span>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() =>
                                handleChangeQuantity(
                                  item.license.id,
                                  item.quantity + 1
                                )
                              }
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${item.license.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${(item.license.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleRemoveLicense(item.license.id)}
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold dark:text-gray-200">
                      <td className="py-3 px-4" colSpan={3}>
                        {t('Total')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${totalPrice.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('Your cart is empty. Select licenses to purchase.')}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-6 border-t dark:border-gray-700 pt-4">
          <div className="text-lg font-semibold dark:text-textColor">
            {selectedLicenses.length > 0 && (
              <span>
                {t('Total')}: ${totalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex">
            <ButtonFromTheme
              type="button"
              className="btn btn-secondary mr-2"
              onClick={onClose}
            >
              {t('Cancel')}
            </ButtonFromTheme>
            <ButtonFromTheme
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || selectedLicenses.length === 0}
            >
              {isSubmitting ? t('Processing...') : t('Purchase')}
            </ButtonFromTheme>
          </div>
        </div>
      </form>
    </Modal>
  );
};
