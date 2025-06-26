/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import { Error, Loading, WithLoadingAndError } from '@/components/shared';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { usePurchasedLicense } from 'hooks/usePurchasedLicenseHooks';
import AddUser from 'components/users/AddUser';
import AssignUserModal from '@/components/locations/AssignUserModal';
import ManageOrBuyLicenses from '@/components/licenses/ManageOrBuyLicenses';
import {
  useLocationDetails,
  useLocationUsers,
  useUpdateLocation,
  useLocationUserManagement,
  UserWithUserLocations,
} from 'hooks/useLocationHooks';
import LocationHeader from '@/components/locations/LocationHeader';
import LocationForm from '@/components/locations/LocationForm';
import ContactInfoForm from '@/components/locations/ContactInfoForm';
import AnimalCountForm from '@/components/locations/AnimalCountForm';
import UsersSection from '@/components/locations/UsersSection';
import LicensesSection from '@/components/locations/LicensesSection';
import FormActions from '@/components/locations/FormActions';
import { useTenantAccess } from 'utils/tenantAccess';
import ZonesSection from '@/components/zones/ZonesSection';
import ZoneForm from '@/components/zones/ZoneForm';
import { Zone } from 'services/zoneService';

const EditLocation = () => {
  const router = useRouter();
  const { slug, id: locationId } = router.query;

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Partial<Zone>>(
    {} as Partial<Zone>
  );
  const { canAccess } = useCanAccess();
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Get tenant type access information
  const { tenantType, isLoading: isTenantLoading } = useTenantAccess();
  const isFarmTenant = tenantType === 'Farm';
  const isPPETenant = tenantType === 'PPE';

  // Function to get location type name based on tenant
  const getLocationTypeName = () => {
    if (isPPETenant) return 'Facility';
    if (isFarmTenant) return 'Farm';
    return 'Location';
  };

  // Custom hooks for data management
  const {
    isLoading: isLocationLoading,
    isError: isLocationError,
    locationDetails,
  } = useLocationDetails(slug as string, locationId as string);

  const [zones, setZones] = useState<Zone[]>([]);

  // When locationDetails loads, extract zones from it if PPE tenant
  useEffect(() => {
    if (isPPETenant && locationDetails) {
      // Zones might be stored in metadata or as direct relationship
      // Convert Date objects to strings for Zone type compatibility
      const locationZones: Zone[] = (locationDetails.Zone || []).map(
        (zone) => ({
          ...zone,
          createdAt:
            typeof zone.createdAt === 'object' && zone.createdAt !== null
              ? new Date(zone.createdAt as any).toISOString()
              : (zone.createdAt as string),
          updatedAt:
            typeof zone.updatedAt === 'object' && zone.updatedAt !== null
              ? new Date(zone.updatedAt as any).toISOString()
              : (zone.updatedAt as string),
        })
      );

      setZones(locationZones);
    }
  }, [locationDetails, isPPETenant]);

  const { locationUsers, isLoading: isUsersLoading } = useLocationUsers(
    slug as string,
    locationId as string
  );

  const {
    updateLocation,
    isUpdating,
    error: updateError,
  } = useUpdateLocation(slug as string, locationId as string);

  const {
    toggleUserStatus,
    isProcessing: isUserUpdateProcessing,
    error: userManagementError,
  } = useLocationUserManagement(slug as string, locationId as string);

  const {
    isPurchasedLicenseLoading,
    isPurchasedLicenseError,
    purchasedLicenses,
  } = usePurchasedLicense(slug as string);

  const [teamUsers, setTeamUsers] = useState<UserWithUserLocations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenUserModal = () => setIsUserModalOpen(true);
  const handleCloseUserModal = () => setIsUserModalOpen(false);

  const handleOpenZoneModal = (zone: Partial<Zone> | null = null) => {
    // If zone exists, convert Date objects to strings for compatibility
    if (zone) {
      const formattedZone: Partial<Zone> = {
        ...zone,
        createdAt:
          typeof zone.createdAt === 'object' && zone.createdAt !== null
            ? new Date(zone.createdAt as any).toISOString()
            : (zone.createdAt as string),
        updatedAt:
          typeof zone.updatedAt === 'object' && zone.updatedAt !== null
            ? new Date(zone.updatedAt as any).toISOString()
            : (zone.updatedAt as string),
      };
      setSelectedZone(formattedZone);
    } else {
      setSelectedZone({} as Partial<Zone>);
    }
    setIsZoneModalOpen(true);
  };

  const handleCloseZoneModal = () => setIsZoneModalOpen(false);
  const handleOpenLicenseModal = () => setIsLicenseModalOpen(true);
  const handleCloseLicenseModal = () => setIsLicenseModalOpen(false);

  useEffect(() => {
    if (locationUsers && !isUsersLoading) {
      // Ensure locationUsers matches the UserWithUserLocations type
      setTeamUsers(locationUsers);
      setIsLoading(false);
    }
  }, [locationUsers, isUsersLoading]);

  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';
  const inputClass =
    'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  const initializeAnimalCounts = (animals) => {
    const counts = {
      bullsActive: 0,
      bullsInactive: 0,
      cowsActive: 0,
      cowsInactive: 0,
      calvesActive: 0,
      calvesInactive: 0,
    };

    if (animals && animals.length > 0) {
      animals.forEach((animal) => {
        if (animal.name === 'Bulls') {
          counts.bullsActive = animal.activeAnimal;
          counts.bullsInactive = animal.inactiveAnimal;
        } else if (animal.name === 'Cows') {
          counts.cowsActive = animal.activeAnimal;
          counts.cowsInactive = animal.inactiveAnimal;
        } else if (animal.name === 'Calves') {
          counts.calvesActive = animal.activeAnimal;
          counts.calvesInactive = animal.inactiveAnimal;
        }
      });
    }

    return counts;
  };

  const formik = useFormik({
    initialValues: {
      locationName: locationDetails?.name || '',
      address1: locationDetails?.addressL1 || '',
      address2: locationDetails?.addressL2 || '',
      zip: locationDetails?.zip || '',
      state: locationDetails?.state || '',
      city: locationDetails?.city || '',
      phoneNumber: locationDetails?.phone || '',
      email: locationDetails?.email || '',
      ...initializeAnimalCounts(locationDetails?.Animal || []),
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      locationName: Yup.string().required('Location name is required'),
      address1: Yup.string().required('Address Line 1 is required'),
      zip: Yup.string().required('Zip code is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required'),
      phoneNumber: Yup.string().required('Phone number is required'),
      email: Yup.string().email('Invalid email format'),
    }),
    onSubmit: async (values) => {
      // Include zones in the update data if we're a PPE tenant
      const updateData = {
        ...values,
        ...(isPPETenant ? { zones } : {}),
      };

      const result = await updateLocation(updateData);
      if (result) {
        router.push(`/teams/${slug}/locations/${locationId}/view`);
      }
    },
  });

  const getTotalAnimals = () => {
    const totalBulls = formik.values.bullsActive + formik.values.bullsInactive;
    const totalCows = formik.values.cowsActive + formik.values.cowsInactive;
    const totalCalves =
      formik.values.calvesActive + formik.values.calvesInactive;
    const totalActive =
      formik.values.bullsActive +
      formik.values.cowsActive +
      formik.values.calvesActive;
    const totalInactive =
      formik.values.bullsInactive +
      formik.values.cowsInactive +
      formik.values.calvesInactive;
    const totalAnimals = totalBulls + totalCows + totalCalves;

    return { totalAnimals, totalActive, totalInactive };
  };

  const { totalAnimals, totalActive, totalInactive } = getTotalAnimals();

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    await toggleUserStatus(userId, isActive);
  };

  const handleAddOrUpdateZone = (zoneData: Partial<Zone>) => {
    if (selectedZone && selectedZone.id) {
      // Update existing zone
      setZones(
        zones.map((zone) =>
          zone.id === selectedZone.id ? { ...zone, ...zoneData } : zone
        )
      );
    } else {
      // Add new zone
      const newZone: Zone = {
        ...zoneData,
        id: `temp-${Date.now()}`, // Temporary ID until saved to the server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        locationId: locationId as string,
        name: zoneData.name || '',
      };
      setZones([...zones, newZone]);
    }
    setIsZoneModalOpen(false);
    setSelectedZone({} as Partial<Zone>);
  };

  const isAccessible = canAccess('location', ['update']);

  if (
    isLocationLoading ||
    isLoading ||
    isUpdating ||
    isUserUpdateProcessing ||
    isTenantLoading
  ) {
    return <Loading />;
  }

  if (isLocationError) {
    return <Error message={isLocationError.message} />;
  }

  if (!isAccessible) {
    return <p>You do not have access to edit this location.</p>;
  }

  const combinedError = updateError || userManagementError;

  return (
    <WithLoadingAndError
      isLoading={isUpdating || isUserUpdateProcessing}
      error={combinedError}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="bg-[#f6f6fa] dark:bg-backgroundColor py-5 lg:px-8"
      >
        <div className="flex flex-col gap-4">
          <LocationHeader
            title={`Edit ${getLocationTypeName()}`}
            subtitle={`Update the details of ${locationDetails?.name}`}
            onBack={() => router.back()}
            actionLabel="Cancel"
          />

          <LocationForm
            formik={formik}
            inputClass={inputClass}
            groupFieldClass={groupFieldClass}
          />

          <ContactInfoForm
            formik={formik}
            inputClass={inputClass}
            groupFieldClass={groupFieldClass}
          />

          {/* Show animal count form only for FARM tenant type */}
          {isFarmTenant && (
            <AnimalCountForm
              formik={formik}
              groupFieldClass={groupFieldClass}
              totalAnimals={totalAnimals}
              totalActive={totalActive}
              totalInactive={totalInactive}
            />
          )}

          {/* Show zones section only for PPE tenant type */}
          {isPPETenant && (
            <ZonesSection
              zones={zones}
              groupFieldClass={groupFieldClass}
              onAddZone={() => handleOpenZoneModal()}
              onEditZone={handleOpenZoneModal}
              setZones={setZones}
              locationId={locationId as string}
              slug={slug as string}
            />
          )}

          <UsersSection
            users={teamUsers}
            groupFieldClass={groupFieldClass}
            onAddUser={() => setShowAddUserModal(true)}
            onAssignUser={handleOpenUserModal}
            toggleUserStatus={handleToggleUserStatus}
            slug={slug as string}
            locationId={locationId as string}
          />

          <LicensesSection
            groupFieldClass={groupFieldClass}
            isPurchasedLicenseLoading={isPurchasedLicenseLoading}
            isPurchasedLicenseError={isPurchasedLicenseError}
            purchasedLicenses={purchasedLicenses || []}
            handleOpenLicenseModal={handleOpenLicenseModal}
          />

          <FormActions
            onSave={formik.handleSubmit}
            onCancel={() => router.back()}
            isEdit={true}
          />
        </div>

        {showAddUserModal && (
          <AddUser onClose={() => setShowAddUserModal(false)} />
        )}

        <AssignUserModal
          setAssignedUsers={setTeamUsers}
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          teamSlug={`${slug}`}
          locationName={locationDetails?.name || ''}
          locationId={`${locationId}`}
        />

        <ManageOrBuyLicenses
          isOpen={isLicenseModalOpen}
          onClose={handleCloseLicenseModal}
          purchasedLicenses={purchasedLicenses}
        />

        {/* Zone modal for PPE tenant type */}
        {isPPETenant && (
          <ZoneForm
            isOpen={isZoneModalOpen}
            onClose={handleCloseZoneModal}
            onSave={handleAddOrUpdateZone}
            initialValues={selectedZone}
            locationId={locationId as string}
            isEdit={!!selectedZone}
          />
        )}
      </form>
    </WithLoadingAndError>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default EditLocation;
