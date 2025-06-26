import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { WithLoadingAndError } from '@/components/shared';
import { Table } from '@/components/shared/table/Table';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ButtonFromTheme from '../../../shared/ButtonFromTheme';
import { Vendor } from 'types/vendor';
import { defaultHeaders } from '@/lib/common';
import { ImPencil } from 'react-icons/im';
import { MdDeleteOutline } from 'react-icons/md';

// Custom hook for vendors
const useVendors = (teamSlug:string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useState(() => {
    if (!teamSlug) return;

    const fetchVendors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teams/${teamSlug}/vendors`, {
                method: 'GET',
                headers: defaultHeaders,
              });
        if (!response.ok) throw new Error('Failed to fetch vendors');
        const data = await response.json();

        setVendors(data.data);
        setIsError(false);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setIsError(true);
      } 
    };

    fetchVendors();
  });

  return { isLoading, isError, vendors };
};

const Vendors = ({ canCreate = true }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { slug } = router.query;
  const { isLoading, isError, vendors } = useVendors(slug as string);

  const [searchTerm, setSearchTerm] = useState('');

  const currentTeamSlug = slug as string;



  const filteredVendors = vendors
    ? vendors.filter((vendor) =>
        vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="space-y-3 h-full flex flex-col py-5 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-none tracking-tight font-montserrat">
              Vendors
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-10">
            <div className="flex justify-center items-center h-10 bg-white dark:bg-surfaceColor rounded-md w-full sm:w-auto">
              <MagnifyingGlassIcon className="h-5 text-center text-gray-400 dark:text-textColor ml-3" />
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input border-0 input-xs h-full px-3 text-sm placeholder:font-poppins placeholder:text-sm placeholder:dark:text-textColor focus:border-0 active:border-0 focus:outline-none w-full sm:w-60 dark:bg-surfaceColor dark:text-textColor"
              />
            </div>
            {canCreate && (
              <ButtonFromTheme
                className={`rounded-md text-white font-normal px-4 sm:px-11 h-10 flex items-center justify-center`}
                onClick={() =>
                  router.push(`/teams/${currentTeamSlug}/vendors/new`)
                }
              >
                + Add New Vendor
              </ButtonFromTheme>
            )}
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-grow max-h-[calc(100vh-220px)]">
          <div className="min-w-full md:w-auto">
            <Table
              heading="Active Vendors"
              cols={['Company Name', 'Contact', 'Email/Phone', 'Location', 'Status', 'Actions']}
              body={filteredVendors.map((vendor) => {
                return {
                  id: vendor.id,
                  cells: [
                    {
                      wrap: false,
                      element: (
                        <Link
                          href={`/teams/${currentTeamSlug}/vendors/${vendor.id}/view`}
                        >
                          <div className="flex items-center justify-start space-x-2">
                            <span
                              className="underline max-w-[150px] truncate"
                              title={vendor.companyName}
                            >
                              {vendor.companyName}
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
                          title={vendor.contactName}
                        >
                          {vendor.contactName}
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      element: (
                        <div className="max-w-[200px]">
                          <div className="truncate" title={vendor.contactEmail}>
                            {vendor.contactEmail}
                          </div>
                          <div className="truncate text-gray-500 dark:text-gray-400" title={vendor.contactPhone}>
                            {vendor.contactPhone}
                          </div>
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      element: (
                        <div
                          className="max-w-[150px] truncate"
                          title={`${vendor.address.city}, ${vendor.address.state}`}
                        >
                          {vendor.address.city}, {vendor.address.state}
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      element: (
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              vendor.active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {vendor.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ),
                    },
                    {
                      wrap: false,
                      actions: [
                        {
                          text: t('Edit'),
                          icon: <ImPencil/>,
                          onClick: () => router.push(`/teams/${currentTeamSlug}/vendors/${vendor.id}/edit`),
                        },
                        {
                          text: t('Delete'),
                          icon: <MdDeleteOutline/>,
                          onClick: () => {
                            if (confirm('Are you sure you want to delete this vendor?')) {
                              fetch(`/api/teams/${currentTeamSlug}/vendors/${vendor.id}`, {
                                method: 'DELETE',
                              }).then(() => {
                                window.location.reload();
                              });
                            }
                          },
                        },
                      ],
                    },
                  ],
                };
              })}
            />
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
};

export default Vendors;
