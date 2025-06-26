import { useRouter } from 'next/router';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { AddLicenseModal } from './AddLicenseModal';
import { EditLicenseModal } from './EditLicenseModal';
import { PurchaseLicenseModal } from './PurchaseLicenseModal';
import { License } from 'types/license';
import { LicenseTiles } from './LicenseTiles';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import { LicenseProvider } from 'contexts/LicenseContext';
import { usePurchasedLicenses } from 'hooks/usePurchasedLicenses';

export const Licenses = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;

  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutate } = usePurchasedLicenses(slug as string);

  // Search state for both sections
  const [purchasedSearchTerm, setPurchasedSearchTerm] = useState('');

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setIsEditModalOpen(true);
  };

  const handlePurchase = (license: License) => {
    setSelectedLicense(license);
    setIsPurchaseModalOpen(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    mutate();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <LicenseProvider teamSlug={slug as string}>
      <div className="container mx-auto py-6 md:py-10 px-3 md:px-4 transition-colors lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8"></div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-textColor mb-4 sm:mb-0">
          {t('Licenses')}
        </h1>

        <div className="mb-8 md:mb-12 bg-white dark:bg-backgroundColor p-4 md:p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-lg md:text-xl font-semibold dark:text-textColor mb-4 sm:mb-0">
              {t('Your Purchased Licenses')}
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:ml-auto">
              <div className="relative w-full sm:w-auto mb-3 sm:mb-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-borderColor rounded-md leading-5 bg-white/50 dark:bg-surfaceColor placeholder-gray-500 focus:outline-none focus:border-primary-300 dark:focus:border-primary-600 text-sm transition-colors sm:w-64"
                  placeholder={t('Search purchased licenses...')}
                  value={purchasedSearchTerm}
                  onChange={(e) => setPurchasedSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={handleRefresh}
                className="ml-0 sm:ml-2 p-2 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                title={t('Refresh')}
                disabled={isRefreshing}
              >
                <FiRefreshCw
                  className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          <LicenseTiles
            mode="purchased"
            searchTerm={purchasedSearchTerm}
            onEdit={handleEdit}
            onPurchase={handlePurchase}
          />
        </div>

        <AddLicenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          teamSlug={slug as string}
          onSuccess={() => setIsAddModalOpen(false)}
        />

        {selectedLicense && (
          <>
            <EditLicenseModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setSelectedLicense(null);
                setIsEditModalOpen(false);
              }}
              license={selectedLicense}
              teamSlug={slug as string}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setSelectedLicense(null);
              }}
            />

            <PurchaseLicenseModal
              isOpen={isPurchaseModalOpen}
              onClose={() => {
                setSelectedLicense(null);
                setIsPurchaseModalOpen(false);
              }}
              license={selectedLicense}
              teamSlug={slug as string}
              onSuccess={() => {
                setIsPurchaseModalOpen(false);
                setSelectedLicense(null);
              }}
            />
          </>
        )}
      </div>
    </LicenseProvider>
  );
};
