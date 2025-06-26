import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Loading, WithLoadingAndError } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import Link from 'next/link';
import { VscHistory } from 'react-icons/vsc';
import { FaFileCsv } from 'react-icons/fa6';
import useLocations from 'hooks/useLocationHooks';
import { BsCameraVideo } from 'react-icons/bs';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useCanAccess from 'hooks/useCanAccess';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import { useTenantAccess } from 'utils/tenantAccess';
import { useDownloadCSV } from 'hooks/useDownloadCSV';
import { exportToCSV } from '@/lib/exportToCSV';

const Locations = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { slug } = router.query;

  // Only fetch locations when team slug is available
  const {
    isLoading: isLocationsLoading,
    isError,
    locations,
  } = useLocations(slug as string);

  const [searchTerm, setSearchTerm] = useState('');

  // Combine loading states to prevent premature API calls
  const isDataLoading = isLocationsLoading || !slug;

  const { canAccess } = useCanAccess();

  const isAccessible = canAccess('location', ['create']);

  const currentTeamSlug = slug as string;

  const {
    downloadCSV,
    isLoading: isCSVLoading,
    error: csvError,
  } = useDownloadCSV({
    params: { start: new Date('2022-01-01'), end: new Date(Date.now()) },
  });

  const WEBVIS_STREAM_URL = 'http://172.206.1.94:8001';
  const WEBVIS_DATA_URL = 'http://172.206.1.94:8002';

  // Get tenant information
  const { tenantType, isLoading: isTenantLoading } = useTenantAccess();
  const isPPE = tenantType === 'PPE';
  const isFarm = tenantType === 'Farm';

  // Determine appropriate title based on tenant type
  const getLocationTitle = () => {
    if (isPPE) return 'Facilities';
    if (isFarm) return 'Farms';
    return 'Locations';
  };

  const handleExport = async () => {
    try {
      await exportToCSV(downloadCSV);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const navigateToStream = (locationId: string) => {
    router.push({
      pathname: `/teams/${currentTeamSlug}/locations/${locationId}/stream`,
      query: { webvisUrl: WEBVIS_STREAM_URL },
    });
  };

  const navigateToHistory = (locationId: string) => {
    router.push({
      pathname: `/teams/${currentTeamSlug}/locations/${locationId}/history`,
      query: { webvisUrl: WEBVIS_DATA_URL },
    });
  };

  const navigateToLiveMonitoring = () => {
    router.push({ pathname: `/teams/${slug}/live-monitoring` });
  };

  const filteredLocations = locations
    ? locations.filter((location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  // Define table columns based on tenant type
  const tableColumns = isPPE
    ? ['Facility Name', t('City'), t('Address'), t('actions')]
    : [
      isFarm ? 'Farm Name' : 'Location Name',
      t('City'),
      t('Address'),
      ...(isFarm ? [t('bulls'), t('cows'), t('calves'), t('total')] : []),
      t('actions'),
    ];

  return (
    /* eslint-disable i18next/no-literal-string */

    <WithLoadingAndError
      isLoading={isDataLoading || isTenantLoading}
      error={isError}
    >
      <div className="space-y-3 h-full flex flex-col py-5 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-none tracking-tight font-montserrat">
              {getLocationTitle()}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-10">
            <div className="flex justify-center items-center h-10 bg-white dark:bg-surfaceColor rounded-md w-full sm:w-auto">
              {' '}
              <MagnifyingGlassIcon className="h-5 text-center text-gray-400 dark:text-textColor ml-3" />
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input border-0 input-xs h-full px-3 text-sm placeholder:font-poppins placeholder:text-sm placeholder:dark:text-textColor focus:border-0 active:border-0 focus:outline-none w-full sm:w-60 dark:bg-surfaceColor dark:text-textColor"
              />
            </div>
            {isAccessible && (
              <ButtonFromTheme
                className={`rounded-md text-white font-normal px-4 sm:px-11 h-10 flex items-center justify-center`}
                onClick={() =>
                  router.push(`/teams/${currentTeamSlug}/locations/new`)
                }
              >
                + Add New {isPPE ? 'Facility' : isFarm ? 'Farm' : 'Location'}
              </ButtonFromTheme>
            )}
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-grow max-h-[calc(100vh-220px)]">
          <div className="min-w-full md:w-auto">
            <Table
              heading={`Active ${getLocationTitle()}`}
              cols={tableColumns}
              body={filteredLocations.map((location) => {
                const totalAnimals = location.Animal.reduce(
                  (sum, animal) =>
                    sum + animal.activeAnimal + animal.inactiveAnimal,
                  0
                );

                // Base cells that are always displayed
                const baseCells = [
                  {
                    wrap: false,
                    element: (
                      <Link
                        href={`/teams/${currentTeamSlug}/locations/${location.id}/view`}
                      >
                        <div className="flex items-center justify-start space-x-2">
                          <span
                            className="underline max-w-[150px] truncate"
                            title={location.name}
                          >
                            {location.name}
                          </span>
                        </div>
                      </Link>
                    ),
                  },
                  {
                    wrap: false,
                    element: (
                      <div
                        className="max-w-[120px] truncate"
                        title={location.city}
                      >
                        {location.city}
                      </div>
                    ),
                  },
                  {
                    wrap: false,
                    element: (
                      <div
                        className="max-w-[150px] truncate"
                        title={location.addressL1}
                      >
                        {location.addressL1}
                      </div>
                    ),
                  },
                ];

                // Animal cells that are conditionally displayed
                const animalCells = isFarm
                  ? [
                    {
                      wrap: false,
                      text: String(
                        location.Animal.filter((a) => a.name === 'Bulls')[0]
                          ?.activeAnimal || '0'
                      ),
                    },
                    {
                      wrap: false,
                      text: String(
                        location.Animal.filter((a) => a.name === 'Cows')[0]
                          ?.activeAnimal || '0'
                      ),
                    },
                    {
                      wrap: false,
                      text: String(
                        location.Animal.filter((a) => a.name === 'Calves')[0]
                          ?.activeAnimal || '0'
                      ),
                    },
                    { wrap: false, text: String(totalAnimals) },
                  ]
                  : [];

                // Action cell - conditionally rendered based on tenant type
                const actionCells = [
                  {
                    wrap: false,
                    actions: isPPE
                      ? [
                        {
                          text: t('Live Monitoring'),
                          icon: (
                            <BsCameraVideo className="text-[#606060] dark:text-textColor text-l" />
                          ),
                          onClick: navigateToLiveMonitoring,
                        },
                      ]
                      : [
                        {
                          text: t('Watch Stream'),
                          icon: (
                            <BsCameraVideo className="text-[#606060] dark:text-textColor text-l" />
                          ),
                          onClick: () => {
                            navigateToStream(location.id);
                          },
                        },
                        {
                          text: t('Count History'),
                          icon: (
                            <VscHistory className="text-[#606060] dark:text-textColor text-l ml-1" />
                          ),
                          onClick: () => {
                            navigateToHistory(location.id);
                          },
                        },
                        {
                          text: isCSVLoading
                            ? t('Exporting...')
                            : t('Export to CSV'),
                          icon: isCSVLoading ? (
                            <span className="text-[#606060] dark:text-textColor text-l ml-1">
                              <Loading />
                            </span>
                          ) : (
                            <FaFileCsv className="text-[#606060] dark:text-textColor text-l ml-1" />
                          ),
                          onClick: handleExport,
                          disabled: isCSVLoading,
                        },
                      ],
                  },
                ];

                return {
                  id: location.id,
                  cells: [...baseCells, ...animalCells, ...actionCells],
                };
              })}
            />
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
  /* eslint-disable i18next/no-literal-string */
};

export default Locations;
