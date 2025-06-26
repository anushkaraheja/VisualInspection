import {
  FiRefreshCw,
  FiUsers,
  FiHome,
  FiShoppingCart,
  FiSearch,
  FiMapPin,
} from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { License, LicenseStatus, PurchasedLicense } from 'types/license';
import { useMemo, useState } from 'react';
import { AssignLicenseToLocationModal } from './AssignLicenseToLocationModal';
import { useLicenseContext } from 'contexts/LicenseContext';
import { LicenseTileItem } from './LicenseTileItem';

interface LicenseTilesProps {
  mode: 'available' | 'purchased';
  searchTerm: string;
  onEdit: (license: License) => void;
  onPurchase: (license: License) => void;
}

export const LicenseTiles = ({
  mode = 'purchased',
  searchTerm = '',
  onEdit,
  onPurchase,
}: LicenseTilesProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;

  // Use the license context
  const {
    licenses,
    purchasedLicenses,
    groupedLicenses,
    isLoading,
    refreshLicenses,
    calculateUsagePercentage,
    getUsageColor,
  } = useLicenseContext();

  // State for managing assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [selectedPurchasedLicense, setSelectedPurchasedLicense] =
    useState<PurchasedLicense | null>(null);

  // Handle opening the assign modal
  const handleAssignToLocation = (
    license: License,
    purchasedLicense: PurchasedLicense
  ) => {
    setSelectedLicense(license);
    setSelectedPurchasedLicense(purchasedLicense);
    setIsAssignModalOpen(true);
  };

  // Handle closing the assign modal
  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedLicense(null);
    setSelectedPurchasedLicense(null);
  };

  // Handle successful assignment
  const handleAssignSuccess = () => {
    refreshLicenses(); // Refresh data after successful assignment
    handleCloseAssignModal();
  };

  // Filter licenses based on search term
  const filteredLicenses = useMemo(() => {
    if (!groupedLicenses || !searchTerm.trim()) return groupedLicenses;

    const lowerCaseSearch = searchTerm.toLowerCase();
    return Object.entries(groupedLicenses)
      .filter(
        ([_, group]) =>
          group.license.name.toLowerCase().includes(lowerCaseSearch) ||
          group.license.description?.toLowerCase()?.includes(lowerCaseSearch) ||
          group.license.type.toLowerCase().includes(lowerCaseSearch) ||
          (group.license.features &&
            group.license.features.some((f) =>
              f.toLowerCase().includes(lowerCaseSearch)
            ))
      )
      .reduce(
        (acc, [id, group]) => {
          acc[id] = group;
          return acc;
        },
        {} as Record<
          string,
          (typeof groupedLicenses)[keyof typeof groupedLicenses]
        >
      );
  }, [groupedLicenses, searchTerm]);

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

  // Helper function to format dates (both string and Date objects)
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white/50 dark:bg-surfaceColor backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm w-full h-64 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-3/4">
                <div className="skeleton h-8 w-3/4 rounded-md mb-2"></div>
                <div className="skeleton h-4 w-full rounded-md"></div>
              </div>
              <div className="skeleton h-6 w-20 rounded-full"></div>
            </div>

            <div className="flex flex-wrap justify-between mb-6">
              <div>
                <div className="skeleton h-8 w-24 rounded-md mb-1"></div>
                <div className="skeleton h-4 w-32 rounded-md"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="skeleton w-24 h-12 rounded-full mb-2"></div>
                <div className="skeleton w-32 h-4 rounded-md"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="skeleton h-4 w-full rounded-md mb-2"></div>
                <div className="skeleton h-4 w-2/3 rounded-md"></div>
              </div>
              <div>
                <div className="skeleton h-4 w-full rounded-md mb-2"></div>
                <div className="skeleton h-4 w-2/3 rounded-md"></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="skeleton h-4 w-20 rounded-md mb-2"></div>
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full"></div>
                <div className="skeleton h-6 w-16 rounded-full"></div>
                <div className="skeleton h-6 w-16 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!purchasedLicenses || purchasedLicenses.length === 0) {
    return (
      <div className="p-5 text-center bg-gray-50 dark:bg-backgroundColor rounded-lg">
        <p className="text-gray-600 dark:text-textColor">
          {t('No Purchased Licenses Found')}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {t('Purchase licenses from the available licenses list below')}
        </p>
        <button
          className="btn btn-ghost btn-circle mt-4 dark:text-textColor dark:hover:bg-surfaceColor"
          onClick={refreshLicenses}
          aria-label="Refresh"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Vertical layout for license tiles */}
      <div className="space-y-6">
        {Object.values(filteredLicenses || {}).map((group) => {
          const license = group.license;
          const count = group.count;
          const purchasedLicense = group.purchases[0];

          const locationLicenses = purchasedLicense.locationLicense || [];

          const locationAssignedCount = locationLicenses.length;
          const usedCount = locationAssignedCount;

          const usagePercentage = calculateUsagePercentage(usedCount, count);
          const usageColor = getUsageColor(usagePercentage);

          // Check if all licenses are assigned
          const hasReachedLocationLimit = usedCount >= count;

          return (
            <LicenseTileItem
              key={license.id}
              license={license}
              purchasedLicense={purchasedLicense}
              count={count}
              usedCount={usedCount}
              locationLicenses={locationLicenses}
              usagePercentage={usagePercentage}
              usageColor={usageColor}
              hasReachedLocationLimit={hasReachedLocationLimit}
              onAssignToLocation={handleAssignToLocation}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          );
        })}
      </div>

      {/* No results message */}
      {Object.keys(filteredLicenses || {}).length === 0 && searchTerm && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {t('No licenses found matching')}{' '}
          <span className="font-medium">"{searchTerm}"</span>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedLicense && selectedPurchasedLicense && (
        <AssignLicenseToLocationModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          license={selectedLicense}
          purchasedLicense={selectedPurchasedLicense}
          teamSlug={slug as string}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};
