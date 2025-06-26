/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import { WithLoadingAndError } from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTenantAccess, withTenantAccess } from 'utils/tenantAccess';
import useLocations from 'hooks/useLocationHooks';
import { useTeamLivestock, useCreateVendor } from 'hooks/useVendors';
// Import our new components
import VendorHeader from '@/components/vendors/VendorHeader';
import VendorForm from '@/components/vendors/VendorForm';
import VendorContactForm from '@/components/vendors/VendorContactForm';
import AddressForm from '@/components/vendors/AddressForm';
import NotesForm from '@/components/vendors/NotesForm';
import LocationsSection from '@/components/vendors/LocationsSection';
import LivestockSection from '@/components/vendors/LivestockSection';
import FormActions from '@/components/vendors/FormActions';

const NewVendor = () => {
    const router = useRouter();
    const { slug } = router.query;
    const [livestockItems, setLivestockItems] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

    // Fetch team livestock items using the hook from useVendors.ts
    const {
        livestockItems: teamLivestockData,
        isLoading: isLoadingTeamLivestock,
        error: teamLivestockError
    } = useTeamLivestock(slug as string);

    // Fetch team locations
    const {
        locations,
        isLoading: isLocationsLoading,
        isError: isLocationsError
    } = useLocations(slug as string);

    // Create vendor using the hook from useVendors.ts
    const {
        createVendor,
        isCreating,
        error: createError,
    } = useCreateVendor(slug as string);

    const groupFieldClass =
        'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';
    const inputClass =
        'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

    const formik = useFormik({
        initialValues: {
            companyName: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            address: {
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zip: '',
            },
            notes: '',
            active: true,
        },
        validationSchema: Yup.object().shape({
            companyName: Yup.string().required('Company name is required'),
            contactName: Yup.string().required('Contact name is required'),
            contactEmail: Yup.string().email('Invalid email format').required('Email is required'),
            contactPhone: Yup.string().required('Phone number is required'),
            address: Yup.object().shape({
                addressLine1: Yup.string().required('Address Line 1 is required'),
                city: Yup.string().required('City is required'),
                state: Yup.string().required('State is required'),
                zip: Yup.string().required('Zip code is required'),
            }),
        }),
        onSubmit: async (values) => {
            // Validate that at least one location is selected
            if (selectedLocations.length === 0) {
                alert('Please select at least one location for this vendor');
                return;
            }

            const result = await createVendor({
                ...values,
                // Include selected locations
                locationIds: selectedLocations,
                // Include livestock items if items selected
                ...(livestockItems.length > 0 ? {
                    livestockItems: livestockItems
                } : {}),
            });

            if (result) {
                router.push(`/teams/${slug}/vendors`);
            }
        },
    });

    return (
        <WithLoadingAndError
            isLoading={isCreating}
            error={createError || teamLivestockError || isLocationsError}
        >
            <form
                onSubmit={formik.handleSubmit}
                className="bg-[#f6f6fa] dark:bg-backgroundColor p-4 md:p-6 py-5 lg:px-8"
            >
                <div className="flex flex-col gap-4 max-w-7xl mx-auto">
                    <VendorHeader
                        title="New Vendor"
                        subtitle="Fill in the details below to add a new vendor to your system"
                        onBack={() => router.back()}
                        actionLabel="Cancel"
                    />

                    <VendorForm
                        formik={formik}
                        inputClass={inputClass}
                        groupFieldClass={groupFieldClass}
                    />

                    <VendorContactForm
                        formik={formik}
                        inputClass={inputClass}
                        groupFieldClass={groupFieldClass}
                    />

                    <AddressForm
                        formik={formik}
                        inputClass={inputClass}
                        groupFieldClass={groupFieldClass}
                    />

                    {/* Location selection section */}
                    <LocationsSection
                        formik={formik}
                        inputClass={inputClass}
                        groupFieldClass={groupFieldClass}
                        locations={locations}
                        selectedLocations={selectedLocations}
                        setSelectedLocations={setSelectedLocations}
                        isLoading={isLocationsLoading}
                    />

                    <NotesForm
                        formik={formik}
                        inputClass={inputClass}
                        groupFieldClass={groupFieldClass}
                    />

                    {/* Show livestock section always, but conditionally render team livestock */}
                    <LivestockSection
                        formik={formik}
                        groupFieldClass={groupFieldClass}
                        livestockItems={livestockItems}
                        setLivestockItems={setLivestockItems}
                        teamLivestockData={teamLivestockData}
                        isLoadingTeamLivestock={isLoadingTeamLivestock}
                    />

                    <FormActions
                        onSave={(e) => formik.handleSubmit(e as any)}
                        onCancel={() => router.back()}
                        saveLabel="Save Vendor"
                    />
                </div>
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

export default withTenantAccess(NewVendor, 'vendors');

