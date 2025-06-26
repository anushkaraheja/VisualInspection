/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { Loading, Error as ErrorComponent, WithLoadingAndError } from '@/components/shared';
import { useTenantAccess, withTenantAccess } from 'utils/tenantAccess';
import { TableBodyType } from '@/components/shared/table/TableBody';
import { useVendorDetails } from 'hooks/useVendors';
// Import our new component
import VendorDetailsView from '@/components/vendors/VendorDetailsView';

const VendorView: React.FC = () => {
    const router = useRouter();
    const { slug: teamSlug, vendorId } = router.query as { slug: string; vendorId: string };


    // Fetch vendor details using the hook from useVendors.ts
    const { isLoading, error, vendorDetails } = useVendorDetails(
        teamSlug,
        vendorId
    );

    const handleNavigateToEdit = (): void => {
        router.push(`/teams/${teamSlug}/vendors/${vendorId}/edit`);
    };

    const handleNavigateBack = (): void => {
        router.back();
    };

    const handleViewLocation = (locationId: string): void => {
        router.push(`/teams/${teamSlug}/locations/${locationId}/view`);
    };

    if (error) {
        return <ErrorComponent message={error.message} />;
    }

    if (!vendorDetails) {
        return <ErrorComponent message="Vendor not found" />;
    }

    // Create the locations table data with proper typing
    const locationTableData: TableBodyType[] = vendorDetails.locations.map((loc) => {
        return {
            id: loc.locationId,
            cells: [
                {
                    wrap: true,
                    text: loc.location.name
                },
                {
                    wrap: true,
                    text: `${loc.location.city}, ${loc.location.state}`
                },
                {
                    actions: [
                        {
                            text: 'View Location',
                            icon: <></>, // Empty placeholder for icon
                            onClick: () => handleViewLocation(loc.locationId)
                        }
                    ]
                }
            ]
        };
    });

    // Format livestock items for display
    const formattedLivestockItems = vendorDetails.livestockItems.map(item => ({
        livestockId: item.livestockId,
        name: item.livestock.name,
        icon: item.livestock.icon
    }));

    return (
        <WithLoadingAndError isLoading={isLoading} error={error}>
            <VendorDetailsView
                vendorDetails={vendorDetails}
                onBack={handleNavigateBack}
                onEdit={handleNavigateToEdit}
                onViewLocation={handleViewLocation}
                locationTableData={locationTableData}
                formattedLivestockItems={formattedLivestockItems}
            />
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

export default withTenantAccess(VendorView, 'vendors');
