/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import { WithLoadingAndError } from '@/components/shared';
import useCanAccess from 'hooks/useCanAccess';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { usePurchasedLicense } from 'hooks/usePurchasedLicenseHooks';
import AddUser from 'components/users/AddUser';
import ManageOrBuyLicenses from '@/components/licenses/ManageOrBuyLicenses';
import {
  useCreateLocation,
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
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { useTenantAccess } from 'utils/tenantAccess';
import ZoneForm from '@/components/zones/ZoneForm';
import AssignUserModal from '@/components/locations/AssignUserModal';
import ZonesSection from '@/components/zones/ZonesSection';

const NewLocation = () => {
  const router = useRouter();
  const { slug } = router.query;

  const [teamUsers, setTeamUsers] = useState<UserWithUserLocations[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const { canAccess } = useCanAccess();
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zones, setZones] = useState<any[]>([]);

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

  const handleOpenLicenseModal = () => setIsLicenseModalOpen(true);
  const handleCloseLicenseModal = () => setIsLicenseModalOpen(false);
  const handleOpenUserModal = () => setIsUserModalOpen(true);
  const handleCloseUserModal = () => setIsUserModalOpen(false);
  const handleOpenZoneModal = () => setIsZoneModalOpen(true);
  const handleCloseZoneModal = () => setIsZoneModalOpen(false);

  const {
    createLocation,
    isCreating,
    error: createError,
  } = useCreateLocation(slug as string);

  const {
    isPurchasedLicenseLoading,
    isPurchasedLicenseError,
    purchasedLicenses,
  } = usePurchasedLicense(slug as string);

  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';
  const inputClass =
    'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  const formik = useFormik({
    initialValues: {
      locationName: '',
      address1: '',
      address2: '',
      zip: '',
      state: '',
      city: '',
      phoneNumber: '',
      email: '',
      bullsActive: 0,
      bullsInactive: 0,
      cowsActive: 0,
      cowsInactive: 0,
      calvesActive: 0,
      calvesInactive: 0,
    },
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
      const result = await createLocation({
        ...values,
        // If we're a PPE tenant, include the zones in the metadata
        ...(isPPETenant && zones.length > 0 ? { zones } : {}),
      });

      if (result && result.id && teamUsers.length > 0) {
        // After creating the location, we need to assign users
        const locationUserManagement = useLocationUserManagement(
          slug as string,
          result.id
        );
        await locationUserManagement.assignMultipleUsers(
          teamUsers.map((user) => user.id)
        );
      }

      if (result) {
        router.push(`/teams/${slug}/locations`);
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

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    // This is a placeholder for new.tsx as there are no users to toggle yet
    console.log(`Toggle user ${userId} to ${isActive ? 'active' : 'inactive'}`);
  };

  const isAccessible = canAccess('location', ['create']);

  if (!isAccessible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#f6f6fa] dark:bg-backgroundColor p-4 md:p-8 rounded-[20px] border dark:border-borderColor">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600 dark:text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[#17355D] dark:text-white mb-2 text-center">
          Access Restricted
        </h2>
        <p className="text-[#5E6C84] dark:text-gray-300 text-center max-w-md mb-6">
          You do not have permission to create a new location. Please contact
          your administrator for access.
        </p>
        <ButtonFromTheme
          onClick={() => router.back()}
          className="bg-[#16355D] hover:bg-[#BA2025] text-white py-2 px-6 rounded-md transition-colors w-full md:w-auto"
        >
          Go Back
        </ButtonFromTheme>
      </div>
    );
  }

  const handleAddZone = (zone) => {
    setZones([...zones, zone]);
    setIsZoneModalOpen(false);
  };

  return (
    <WithLoadingAndError
      isLoading={isCreating || isTenantLoading}
      error={createError}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="bg-[#f6f6fa] dark:bg-backgroundColor p-4 md:p-6 py-5 lg:px-8"
      >
        <div className="flex flex-col gap-4 max-w-7xl mx-auto">
          <LocationHeader
            title={`New ${getLocationTypeName()}`}
            subtitle={`Fill in the details below to add a ${getLocationTypeName().toLowerCase()}`}
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
              onAddZone={handleOpenZoneModal}
              setZones={setZones}
              locationId=""
              slug={slug as string}
            />
          )}

          <UsersSection
            users={teamUsers}
            groupFieldClass={groupFieldClass}
            onAddUser={() => setShowAddUserModal(true)}
            onAssignUser={handleOpenUserModal}
            toggleUserStatus={toggleUserStatus}
            slug={slug as string}
            locationId="" // Empty as we don't have a locationId yet
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
            saveLabel="Save Location"
          />
        </div>

        {showAddUserModal && (
          <AddUser onClose={() => setShowAddUserModal(false)} />
        )}

        <ManageOrBuyLicenses
          isOpen={isLicenseModalOpen}
          onClose={handleCloseLicenseModal}
          purchasedLicenses={purchasedLicenses}
        />

        {/* User assignment modal */}
        <AssignUserModal
          setAssignedUsers={setTeamUsers}
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          teamSlug={`${slug}`}
          locationName={formik.values.locationName}
          locationId=""
        />

        {/* Zone creation modal - only for PPE tenant type */}
        {isPPETenant && (
          <ZoneForm
            isOpen={isZoneModalOpen}
            onClose={handleCloseZoneModal}
            onSave={handleAddZone}
            locationId=""
            isEdit={false}
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

export default NewLocation;
