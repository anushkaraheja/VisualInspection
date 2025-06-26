import {
  useLocationDetails,
  useLocationUsers,
  useLocationUserManagement,
  UserWithUserLocations,
} from 'hooks/useLocationHooks';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Error, Loading, WithLoadingAndError } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import { defaultHeaders } from '@/lib/common';
import bulls from 'assets/icons/bulls.svg';
import calves from 'assets/icons/calves.svg';
import cows from 'assets/icons/cows.svg';
import { IoIosArrowBack } from 'react-icons/io';
import AssignUserModal from '@/components/locations/AssignUserModal';
import { ImPencil } from 'react-icons/im';
import Switch from '@/components/shared/Switch';
import { BsThreeDots } from 'react-icons/bs';
import Image from 'next/image';
import ManageOrBuyLicenses from '@/components/licenses/ManageOrBuyLicenses';
import { usePurchasedLicense } from 'hooks/usePurchasedLicenseHooks';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { useTenantAccess } from 'utils/tenantAccess';
import ZoneViewSection from '@/components/zones/ZoneViewSection';
import { Zone } from 'services/zoneService';
import Link from 'next/link';

const LocationSettings = () => {
  const router = useRouter();

  const { slug: teamSlug, id: locationId } = router.query;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [assignedUsers, setAssignedUsers] = useState<UserWithUserLocations[]>(
    []
  );
  const [zones, setZones] = useState<Zone[]>([]);

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

  const { isLoading, isError, locationDetails } = useLocationDetails(
    teamSlug as string,
    locationId as string
  );



  // When locationDetails loads, extract zones
  useEffect(() => {
    if (locationDetails && locationDetails.Zone) {
      // Zones might be stored in metadata or as direct relationship
      const locationZones: Zone[] = (locationDetails.Zone || []).map((zone) => {
        return {
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
      });

      setZones(locationZones);
    }
  }, [locationDetails]);

  const { locationUsers } = useLocationUsers(
    teamSlug as string,
    locationId as string
  );

  const {
    isPurchasedLicenseLoading,
    isPurchasedLicenseError,
    purchasedLicenses,
  } = usePurchasedLicense(teamSlug as string);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const handleOpenUserModal = () => setIsUserModalOpen(true);
  const handleOpenLicenseModal = () => setIsLicenseModalOpen(true);
  const handleCloseLicenseModal = () => setIsLicenseModalOpen(false);

  //TODO: create hook for fetching location users
  const fetchLocationUsers = async () => {
    const response = await fetch(
      `/api/teams/${teamSlug}/locations/${locationId}/users`,
      {
        headers: defaultHeaders,
      }
    );
    const data = await response.json();
    setAssignedUsers(data);
  };

  const handleCloseUserModal = () => {
    fetchLocationUsers();
    setIsUserModalOpen(false);
  };

  const { toggleUserStatus, isProcessing: isUpdatingUserStatus } =
    useLocationUserManagement(teamSlug as string, locationId as string);

  const assignUser = async (userId: string, isChecked: boolean) => {
    await toggleUserStatus(userId, isChecked);

    // Update the UI state as needed
    setAssignedUsers((prev) => {
      if (isChecked && locationUsers) {
        // If a user was just added, find it and add it to the list
        const userToAdd = locationUsers.find((user) => user.id === userId);
        if (userToAdd && !prev.some((u) => u.id === userId)) {
          return [...prev, userToAdd];
        }
      } else {
        // If a user was removed, filter them out
        return prev.filter((user) => user.id !== userId);
      }
      return prev;
    });
  };

  // Add function to navigate to zone view page
  const handleNavigateToZone = (zone: Zone) => {
    router.push(`/teams/${teamSlug}/zones/${zone.id}/view`);
  };

  // Add function to navigate to zone devices
  const handleViewZoneDevices = (zoneId: string) => {
    // Find the zone to get its first device (if any)
    const zone = zones.find((z) => z.id === zoneId);
    if (zone && zone.devices && zone.devices.length > 0) {
      // Navigate to live monitoring with first device
      router.push({
        pathname: `/teams/${teamSlug}/live-monitoring`,
        query: { device: zone.devices[0].id },
      });
    } else {
      // If no devices, just navigate to zone view page
      router.push(`/teams/${teamSlug}/zones/${zoneId}/view`);
    }
  };

  if (isLoading || isUpdatingUserStatus || isTenantLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!locationDetails || !locationUsers) {
    return <Error message={'Location Not Found'} />;
  }

  const animals = locationDetails.Animal || [];

  const activeAnimal = animals.reduce(
    (total, animal) => total + animal.activeAnimal,
    0
  );
  const inactiveAnimal = animals.reduce(
    (total, animal) => total + animal.inactiveAnimal,
    0
  );

  const totalAnimals = activeAnimal + inactiveAnimal;

  const animalIcon = (name) => {
    switch (name) {
      case 'Bulls':
        return bulls.src;
      case 'Cows':
        return cows.src;
      case 'Calves':
        return calves.src;
      default:
        return bulls.src;
    }
  };

  return (
    /* eslint-disable i18next/no-literal-string */
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="py-5 lg:px-8">
        <div className="flex flex-col gap-4">
          <header className="flex justify-between mb-2">
            <div className="flex items-start">
              <button
                onClick={() => router.back()}
                className="text-3xl mt-1 text-[#5E6C84]"
              >
                <IoIosArrowBack />
              </button>
              <div className="ml-2">
                <h1 className="text-4xl font-semibold font-montserrat">
                  {locationDetails.name}
                </h1>
                <p className="text-[#5E6C84]">
                  {getLocationTypeName()} Details
                </p>
              </div>
            </div>
            <ButtonFromTheme
              className={`border border-solid text-white rounded-md my-2.5 px-10 hover:text-white`}
              onClick={() =>
                router.push(`/teams/${teamSlug}/locations/${locationId}/edit`)
              }
            >
              Edit
            </ButtonFromTheme>
          </header>

          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <h2 className="font-semibold text-xl">
              {getLocationTypeName()} Information
            </h2>
            <div className="flex flex-1 gap-2">
              <div className="flex flex-col flex-1">
                <p>Location Name</p>
                <p className="text-[#464A53] text-xl font-[600]">
                  {' '}
                  {locationDetails.name}
                </p>
              </div>
              <div className="flex flex-col flex-1">
                <p>Address</p>
                <p className="text-[#464A53] text-xl font-[600]">
                  {locationDetails.addressL1}, {locationDetails.addressL2}{' '}
                  <br /> {locationDetails.city}, {locationDetails.state} <br />{' '}
                  {locationDetails.zip}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <h2 className="font-semibold text-xl">Contact Information</h2>
            <div className="flex flex-1 gap-2">
              <div className="flex-1">
                <p>Phone Number</p>
                <p className="text-[#464A53] text-xl font-[600]">
                  {locationDetails.phone}
                </p>
              </div>
              <div className="flex-1">
                <p>Email</p>
                <p className="text-[#464A53] text-xl font-[600]">
                  {locationDetails.email}
                </p>
              </div>
            </div>
          </div>

          {/* Animal Information - only for FARM tenant type */}
          {isFarmTenant && (
            <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10 ">
              <div>
                <h2 className="text-poppins font-semibold text-xl">
                  Animal Information
                </h2>
                <p className="text-poppins font-normal">
                  Please Enter number of Active Animals
                </p>
              </div>
              <div className="flex gap-6">
                {animals.map((animal, index) => (
                  <div
                    key={index}
                    className="flex flex-col bg-[#F6FAFF] rounded-[20px] p-6 flex-1 gap-6 dark:bg-surfaceColor"
                  >
                    <div className="flex gap-6 items-center justify-start">
                      <Image
                        src={animalIcon(animal.name)}
                        width={15}
                        height={15}
                        alt={animal.name}
                        className="w-20 h-20"
                      />
                      <p className="text-poppins font-semibold text-[#17355D] dark:text-textColor text-2xl">
                        {animal.name}
                      </p>
                    </div>
                    <div className="flex">
                      <div className="flex-1">
                        <p>Active</p>
                        <p className="text-[#17355D] dark:text-textColor font-semibold text-2xl">
                          {animal.activeAnimal}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p>Inactive</p>
                        <p className="text-[#17355D] dark:text-textColor font-semibold text-2xl">
                          {animal.inactiveAnimal}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 font-medium text-left">
                      {`Total ${animal.name}: ${animal.activeAnimal + animal.inactiveAnimal}`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 py-4 px-8 font-medium text-left bg-[#F6FAFF] rounded-[20px] flex flex-col dark:bg-backgroundColor">
                <p className="font-semibold">{`Total Animals: ${totalAnimals}`}</p>
                <div className="flex gap-2">
                  <p>{`Total Active Animals: ${activeAnimal}`}</p>
                  <p> | </p>
                  <p>{`Total Inactive Animals: ${inactiveAnimal}`}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Section */}
          {locationDetails && locationDetails.locationVendors && locationDetails.locationVendors.length > 0 && (
            <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
              <div className="flex justify-between border-b pb-3 items-center">
                <h2 className="font-semibold text-xl">Vendors</h2>
              </div>
              <ul className="mt-4">
                <Table
                  cols={['Vendor Name', 'Company Name', 'Status', 'Created At', 'Actions']}
                  body={locationDetails.locationVendors.map((locationVendors) => {
                    return {
                      id: locationVendors.id,
                      cells: [
                        {
                          wrap: true,
                          element: (
                            <Link 
                              href={`/teams/${teamSlug}/vendors/${locationVendors.vendor.id}/view`}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {locationVendors.vendor.contactName}
                            </Link>
                          ),
                        },
                        { wrap: true, text: locationVendors.vendor.companyName },
                        {
                          wrap: true,
                          element: (
                            <span className={`px-2 py-1 rounded ${locationVendors.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {locationVendors.active ? 'Active' : 'Inactive'}
                            </span>
                          )
                        },
                        { wrap: true, text: new Date(locationVendors.createdAt).toLocaleDateString() },
                        {
                          wrap: false,
                          actions: [
                            {
                              text: 'Edit Vendor',
                              icon: (
                                <ImPencil className="text-[#606060] dark:text-textColor" />
                              ),
                              onClick: () => {
                                router.push(`/teams/${teamSlug}/vendors/${locationVendors.vendor.id}/edit`);
                              },
                            },
                          ],
                        },
                      ],
                    };
                  })}
                />
              </ul>
            </div>
          )}

          {/* Zones Section - use ZoneViewSection for both PPE and FARM tenants */}
          {locationDetails && zones.length > 0 && (
            <ZoneViewSection
              zones={zones}
              onAddZone={() => { }}
              onEditZone={() => { }}
              onZoneClick={handleNavigateToZone}
              onViewDevices={handleViewZoneDevices}
              locationId={locationId as string}
              teamSlug={teamSlug as string}
            />
          )}

          {/* Users Section */}
          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <div className="flex justify-between border-b pb-3 items-center">
              <h2 className="font-semibold text-xl">Users</h2>
              <ButtonFromTheme
                outline={true}
                className={`py-2 px-10 border rounded-md hover:text-white`}
                onClick={handleOpenUserModal}
              >
                Assign User
              </ButtonFromTheme>
            </div>
            {locationUsers.length === 0 ? (
              <p className="text-black mt-4 text-center">
                There is no assigned user yet.
              </p>
            ) : (
              <ul className="mt-4">
                <Table
                  cols={['Display Name', 'Email', 'Role', 'Active', 'Action']}
                  body={locationUsers.map((user) => {
                    return {
                      id: user.id,
                      cells: [
                        {
                          wrap: true,
                          text: user.name,
                        },
                        { wrap: true, text: user.email },
                        { wrap: true, text: user.TeamMember[0].teamRole.name },
                        {
                          wrap: true,
                          element: (
                            <Switch
                              setCheckedUser={assignUser}
                              userId={user.id}
                              isActive={user.UserLocation[0].isActive}
                            />
                          ),
                        },
                        {
                          actions: [
                            {
                              text: 'Edit',
                              icon: (
                                <ImPencil className="text-[#606060] dark:text-textColor " />
                              ),
                              onClick: () => {
                                // Edit action
                              },
                            },
                            {
                              text: 'Options',
                              icon: (
                                <BsThreeDots className="text-[#606060] dark:text-textColor" />
                              ),
                              onClick: () => {
                                // Options action
                              },
                            },
                          ],
                        },
                      ],
                    };
                  })}
                />
              </ul>
            )}
          </div>

          {/* License Section */}
          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <div className="flex justify-between border-b pb-3 items-center">
              <h2 className="font-semibold text-xl">License</h2>
              <ButtonFromTheme
                outline={true}
                className={`py-2 px-10 border rounded-md hover:text-white`}
                onClick={handleOpenLicenseModal}
              >
                Manage or Buy New License
              </ButtonFromTheme>
            </div>
            {isPurchasedLicenseLoading ? (
              <Loading />
            ) : isPurchasedLicenseError ? (
              <Error message={isPurchasedLicenseError.message} />
            ) : purchasedLicenses && purchasedLicenses.length === 0 ? (
              <p className="text-black dark:text-textColor mt-4 text-center">
                You don&#x2019;t have any active License,{' '}
                <span className="text-[#1A79F8]">Buy Now</span>.
              </p>
            ) : (
              <ul className="mt-6 flex gap-2">
                {purchasedLicenses &&
                  purchasedLicenses.map((purchasedLicense, index) => (
                    <li
                      key={index}
                      className="text-[#17355D] border rounded-xl bg-[#F6F6F6] dark:text-textColor flex flex-col items-start p-4 flex-1 dark:bg-surfaceColor"
                    >
                      <div className="flex justify-between w-full mb-6 text-poppins font-normal ">
                        <div className="flex-1 ">
                          <input
                            type="checkbox"
                            className="mr-2 accent-white"
                          />
                          <span className="overflow-hidden text-ellipsis">
                            {purchasedLicense.License.name}
                          </span>
                        </div>
                        <span className="overflow-hidden text-ellipsis text-right">
                          ${purchasedLicense.License.price}
                        </span>
                      </div>
                      <span
                        className="overflow-hidden text-ellipsis w-full"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {purchasedLicense.License.description}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
        <AssignUserModal
          setAssignedUsers={setAssignedUsers}
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          teamSlug={`${teamSlug}`}
          locationName={locationDetails.name}
          locationId={`${locationId}`}
        />
        <ManageOrBuyLicenses
          isOpen={isLicenseModalOpen}
          onClose={handleCloseLicenseModal}
          purchasedLicenses={purchasedLicenses}
        />
      </div>
    </WithLoadingAndError>
    /* eslint-enable i18next/no-literal-string */
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

export default LocationSettings;
