import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { FiX, FiAlertCircle, FiMapPin } from 'react-icons/fi';
import { License, PurchasedLicense } from 'types/license';
import useLocations, {
  LocationWithAnimalsAndZonesAndVendors,
} from 'hooks/useLocationHooks';
import { toast } from '@/lib/toast';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import { useLicenseContext } from 'contexts/LicenseContext';

interface AssignLicenseToLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License;
  purchasedLicense: PurchasedLicense;
  teamSlug: string;
  onSuccess: () => void;
}

export const AssignLicenseToLocationModal = ({
  isOpen,
  onClose,
  license,
  purchasedLicense,
  teamSlug,
  onSuccess,
}: AssignLicenseToLocationModalProps) => {
  const { t } = useTranslation('common');
  const { locations, isLoading } = useLocations(teamSlug);
  const { fetchLicenseDetails } = useLicenseContext();

  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [originalAssignedLocations, setOriginalAssignedLocations] = useState<
    string[]
  >([]);
  const [locationsToUnassign, setLocationsToUnassign] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailedLicense, setDetailedLicense] =
    useState<PurchasedLicense | null>(null);

  const maxLocations = license.maxLocations || 0;
  const locationAssignedCount =
    detailedLicense?.locationLicense?.length ||
    purchasedLicense.locationLicense?.length ||
    0;
  const remainingLocations = locationAssignedCount > 0 ? 0 : 1;
  const availableCount = remainingLocations;

  const getLimitMessage = () => {
    if (locationAssignedCount > 0) {
      return t('This license is already assigned to a location');
    }
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLocationsToUnassign([]);

      const getDetailedLicense = async () => {
        try {
          const details = await fetchLicenseDetails(purchasedLicense.id);
          if (details) {
            setDetailedLicense(details);

            if (details.locationLicense && details.locationLicense.length > 0) {
              const assignedLocationIds = details.locationLicense.map(
                (ll) => ll.locationId
              );
              setOriginalAssignedLocations(assignedLocationIds);
              setSelectedLocations(assignedLocationIds);
            } else {
              setOriginalAssignedLocations([]);
              setSelectedLocations([]);
            }
          }
        } catch (err) {
          console.error('Error fetching license details:', err);

          if (
            purchasedLicense.locationLicense &&
            purchasedLicense.locationLicense.length > 0
          ) {
            const assignedLocationIds = purchasedLicense.locationLicense.map(
              (ll) => ll.locationId
            );
            setOriginalAssignedLocations(assignedLocationIds);
            setSelectedLocations(assignedLocationIds);
          } else {
            setOriginalAssignedLocations([]);
            setSelectedLocations([]);
          }
        }
      };

      getDetailedLicense();
    }
  }, [isOpen, purchasedLicense, fetchLicenseDetails]);

  const totalLicenseCount = 1;
  const availableSelections = Math.max(
    0,
    totalLicenseCount -
      selectedLocations.filter(
        (id) =>
          originalAssignedLocations.includes(id) &&
          !locationsToUnassign.includes(id)
      ).length
  );

  const handleLocationToggle = useCallback(
    (locationId: string) => {
      setError(null); // Clear error on any interaction

      setSelectedLocations((prev) => {
        // If already selected, always allow unselecting
        if (prev.includes(locationId)) {
          // If this was an originally assigned location, add it to the unassign list
          if (originalAssignedLocations.includes(locationId)) {
            setLocationsToUnassign((current) =>
              current.includes(locationId) ? current : [...current, locationId]
            );
          }
          return prev.filter((id) => id !== locationId);
        }

        // If it was previously marked for unassignment but is now being re-selected, remove from unassign list
        if (
          originalAssignedLocations.includes(locationId) &&
          locationsToUnassign.includes(locationId)
        ) {
          setLocationsToUnassign((current) =>
            current.filter((id) => id !== locationId)
          );
          return [...prev, locationId];
        }

        // For new selections, enforce the license limit
        const currentSelections = prev.filter(
          (id) =>
            !originalAssignedLocations.includes(id) ||
            !locationsToUnassign.includes(id)
        ).length;

        // If we've reached the limit for this license, show error and don't allow selection
        if (currentSelections >= totalLicenseCount) {
          setError(
            t('This license can only be assigned to one location at a time')
          );
          return prev;
        }

        return [...prev, locationId];
      });
    },
    [originalAssignedLocations, locationsToUnassign, totalLicenseCount, t]
  );

  const handleSave = async () => {
    try {
      const newlySelectedLocations = selectedLocations.filter(
        (id) => !originalAssignedLocations.includes(id)
      );

      if (
        newlySelectedLocations.length === 0 &&
        locationsToUnassign.length === 0
      ) {
        onSuccess();
        onClose();
        return;
      }

      const response = await fetch(
        `/api/teams/${teamSlug}/licenses/${purchasedLicense.id}/assign-location`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationIds: newlySelectedLocations,
            locationsToUnassign: locationsToUnassign,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update license assignments');
      }

      toast.success('License assignments updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error assigning license to location:', error);
      toast.error(`Failed to assign license: ${error.message}`);
      setError(t('Failed to assign license to location'));
    }
  };

  const renderLocationItem = (location: LocationWithAnimalsAndZonesAndVendors) => {
    const isOriginallyAssigned = originalAssignedLocations.includes(
      location.id
    );
    const isMarkedForUnassign = locationsToUnassign.includes(location.id);
    const isSelected = selectedLocations.includes(location.id);

    return (
      <div
        key={location.id}
        className={`flex items-center p-3 border rounded-lg transition-colors duration-150 ${
          isOriginallyAssigned && !isMarkedForUnassign
            ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
            : isOriginallyAssigned && isMarkedForUnassign
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              : isSelected
                ? 'border-primary-100 dark:border-primary-900/5 bg-primary-25 dark:bg-primary-900/5'
                : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
        }`}
        onClick={() => handleLocationToggle(location.id)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center w-full">
          <div className="flex-shrink-0 mr-3">
            {/* Direct checkbox - onClick stopPropagation to prevent double-toggle */}
            <input
              type="checkbox"
              id={`location-${location.id}`}
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation(); // Prevent parent click from firing
                handleLocationToggle(location.id);
              }}
              onClick={(e) => e.stopPropagation()} // Also stop click propagation
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 focus:ring-offset-1 border-gray-300 dark:border-gray-600 rounded transition-colors cursor-pointer"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {location.name}
              </span>
              {isOriginallyAssigned && !isMarkedForUnassign && (
                <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full">
                  {t('Assigned')}
                </span>
              )}
              {isOriginallyAssigned && isMarkedForUnassign && (
                <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                  {t('Will be unassigned')}
                </span>
              )}
            </div>
            {location.city && (
              <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                {location.city}
                {location.state ? `, ${location.state}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75 backdrop-blur-sm"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-backgroundColor rounded-xl text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-gray-800">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 relative">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none transition-colors duration-200"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <FiX className="h-5 w-5" />
            </button>

            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <FiMapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900 dark:text-textColor">
                {t('Assign {{name}} License to Locations', {
                  name: license.name,
                })}
              </h3>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="mt-1">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('Select a location to assign this license to')}
                </p>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-800 dark:text-blue-300 text-sm flex items-center">
                  <FiAlertCircle className="mr-2 flex-shrink-0" />
                  {t('Each license can be assigned to exactly one location')}
                </div>
              </div>

              {originalAssignedLocations.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-800 dark:text-blue-300 text-sm flex items-center">
                  <FiAlertCircle className="mr-2 flex-shrink-0" />
                  {t(
                    'You can unassign licenses by unchecking already assigned locations'
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-800 dark:text-red-300 text-sm flex items-center">
                  <FiAlertCircle className="mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto pr-1 -mr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="space-y-2.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg animate-pulse bg-white/50 dark:bg-surfaceColor/50"
                      >
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="ml-3 flex-1">
                          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : locations && locations.length > 0 ? (
                  <div className="space-y-2.5">
                    {locations.map(renderLocationItem)}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <p>{t('No locations found')}</p>
                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                      {t('Create locations first to assign licenses')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-surfaceColor px-6 py-4 sm:px-6 border-t border-gray-100 dark:border-gray-800 sm:flex sm:flex-row-reverse">
            <ButtonFromTheme
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={
                selectedLocations.filter(
                  (id) => !originalAssignedLocations.includes(id)
                ).length === 0 && locationsToUnassign.length === 0
              }
            >
              {t('Save Changes')}
            </ButtonFromTheme>
            <ButtonFromTheme
              outline={true}
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-surfaceColor text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
              onClick={onClose}
            >
              {t('Cancel')}
            </ButtonFromTheme>
          </div>
        </div>
      </div>
    </div>
  );
};
