import { FiMapPin } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { License, LicenseStatus, PurchasedLicense } from 'types/license';
import SemiCircleProgress from '../shared/SemiCircleProgress';
import { useState } from 'react';

interface LicenseTileItemProps {
  license: License;
  purchasedLicense: PurchasedLicense;
  count: number;
  usedCount: number;
  locationLicenses: any[];
  usagePercentage: number;
  usageColor: string;
  hasReachedLocationLimit: boolean;
  onAssignToLocation: (
    license: License,
    purchasedLicense: PurchasedLicense
  ) => void;
  getStatusColor: (status: LicenseStatus) => string;
  formatDate: (date: string | Date | null | undefined) => string;
}

export const LicenseTileItem = ({
  license,
  purchasedLicense,
  count,
  usedCount,
  locationLicenses,
  usagePercentage,
  usageColor,
  hasReachedLocationLimit,
  onAssignToLocation,
  getStatusColor,
  formatDate,
}: LicenseTileItemProps) => {
  const { t } = useTranslation('common');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <div className="bg-white/50 dark:bg-surfaceColor backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden w-full transition-all duration-200 hover:shadow-md">
      <div className="p-4 md:p-6">
        {/* Top section with header and status */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">
            {license.name}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${getStatusColor(license.status)}`}
          >
            {t(license.status.toLowerCase())}
          </span>
        </div>

        {/* Main content area with description on left and semi-circle on right */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full md:w-2/3 flex flex-col">
            {/* Description */}
            {license.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-prose">
                {license.description}
              </p>
            )}

            {/* Price section moved below description */}
            <div className="flex flex-col mt-auto">
              <div className="flex flex-wrap items-center gap-y-2 mb-1">
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  ${license.price.toFixed(2)}
                </div>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  / {t(license.renewalPeriod.toLowerCase())}
                </span>
              </div>

              {purchasedLicense.expiresAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('Expires')}: {formatDate(purchasedLicense.expiresAt)}
                </div>
              )}
            </div>
          </div>

          {/* Semi-Circle Progress Indicator */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
            <SemiCircleProgress
              percentage={usagePercentage}
              color={usageColor}
              size={120}
              usedCount={usedCount}
              totalCount={count}
            />
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center font-light">
                <span className="font-medium">{usedCount}</span> / {count}{' '}
                {t('licenses assigned')}
              </div>
              {/* Active status indicator */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${purchasedLicense.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                ></span>
                {purchasedLicense.isActive ? t('Active') : t('Inactive')}
              </div>
            </div>
          </div>
        </div>

        {/* Details area with cleaner layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                {t('Type')}:
              </span>
              <span className="font-medium ml-2">{license.type}</span>
            </div>

            {license.maxUsers && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                  {t('Max Users')}:
                </span>
                <span className="font-medium ml-2">{license.maxUsers}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {license.maxLocations && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                  {t('Max Locations')}:
                </span>
                <span className="font-medium ml-2">{license.maxLocations}</span>
              </div>
            )}
          </div>
        </div>

        {/* Features section - redesigned to be more visually appealing */}
        {license.features && license.features.length > 0 ? (
          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {t('License Features')}
              </h4>
              {license.features.length > 4 && (
                <button
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 focus:outline-none"
                >
                  {showAllFeatures ? t('Show Less') : t('Show All')}
                </button>
              )}
            </div>

            <div className="mt-2 p-3 bg-gray-50/70 dark:bg-gray-800/30 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {(showAllFeatures
                  ? license.features
                  : license.features.slice(0, 4)
                ).map((feature, idx) => (
                  <div key={idx} className="flex items-start py-1">
                    <div className="mt-0.5 w-4 h-4 mr-2.5 text-green-500 dark:text-green-400 flex-shrink-0">
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {!showAllFeatures && license.features.length > 4 && (
                <button
                  onClick={() => setShowAllFeatures(true)}
                  className="mt-3 w-full text-xs px-3 py-1.5 bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border border-gray-200 dark:border-gray-700 rounded hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {t('Show all')} {license.features.length} {t('features')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('No features available for this license')}
            </p>
          </div>
        )}

        {/* Assign to Location Button - Always enabled */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => onAssignToLocation(license, purchasedLicense)}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30"
          >
            <FiMapPin className="w-4 h-4 mr-2" />
            {hasReachedLocationLimit
              ? t('Manage Location Assignments')
              : t('Assign to Location')}
          </button>
        </div>
      </div>
    </div>
  );
};
