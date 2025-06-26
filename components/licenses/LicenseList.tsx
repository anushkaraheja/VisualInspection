import {
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiShoppingCart,
  FiSearch,
} from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from '@/lib/toast';
import { deleteLicense } from './licenseService';
import { Table } from '@/components/shared/table/Table';
import { TableBodyType } from '@/components/shared/table/TableBody';
import { License } from 'types/license';

interface LicenseListProps {
  licenses: License[];
  isLoading: boolean;
  onEdit: (license: License) => void;
  onPurchase: (license: License) => void;
  onRefresh: () => void;
  searchTerm: string; // Add search term as a prop
}

export const LicenseList = ({
  licenses,
  isLoading,
  onEdit,
  onPurchase,
  onRefresh,
  searchTerm = '',
}: LicenseListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter licenses based on search term
  const filteredLicenses = useMemo(() => {
    if (!searchTerm.trim()) return licenses;

    const lowerCaseSearch = searchTerm.toLowerCase();
    return licenses.filter(
      (license) =>
        license.name.toLowerCase().includes(lowerCaseSearch) ||
        license.description?.toLowerCase()?.includes(lowerCaseSearch) ||
        license.type.toLowerCase().includes(lowerCaseSearch) ||
        (license.features &&
          license.features.some((f) =>
            f.toLowerCase().includes(lowerCaseSearch)
          ))
    );
  }, [licenses, searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm(t('Confirm Delete License'))) {
      try {
        setDeletingId(id);
        await deleteLicense(slug as string, id);
        toast.success(t('License Deleted'));
        onRefresh();
      } catch (error) {
        toast.error(t('Error Deleting License'));
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Define table columns based on Prisma schema and the imported License type
  const columns = [
    t('Name'),
    t('Type'),
    t('Price'),
    t('Status'),
    t('Renewal Period'),
    t('Actions'),
  ];

  // Format license data for the Table component using available fields
  const tableData: TableBodyType[] = filteredLicenses.map((license) => ({
    id: license.id,
    cells: [
      // Name
      {
        text: license.name,
        wrap: false,
      },
      // Type
      {
        text: license.type || '',
        wrap: false,
      },
      // Price - ensure price exists and is a number
      {
        text:
          typeof license.price === 'number'
            ? `$${license.price.toFixed(2)}`
            : '$0.00',
        wrap: false,
      },
      // Status - handle both string and enum values
      {
        badge: {
          text: t((license.status || 'ACTIVE').toLowerCase()),
          color:
            license.status === 'ACTIVE'
              ? 'success'
              : license.status === 'EXPIRED'
                ? 'error'
                : license.status === 'SUSPENDED'
                  ? 'warning'
                  : 'info',
        },
      },
      // Renewal Period - ensure it exists
      {
        text: license.renewalPeriod
          ? t(license.renewalPeriod.toLowerCase())
          : '',
        wrap: false,
      },
      // Actions
      {
        actions: [
          {
            text: t('purchase'),
            icon: <FiShoppingCart className="w-4 h-4" />,
            onClick: () => onPurchase(license),
            className: 'text-green-600 hover:text-green-700',
          },
          {
            text: t('edit'),
            icon: <FiEdit2 className="w-4 h-4" />,
            onClick: () => onEdit(license),
          },
          {
            text: t('delete'),
            icon:
              deletingId === license.id ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FiTrash2 className="w-4 h-4" />
              ),
            onClick: () => handleDelete(license.id),
            destructive: true,
          },
        ],
      },
    ],
  }));

  if (isLoading) {
    return (
      <div className="dark:bg-backgroundColor rounded-lg p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="skeleton h-12 my-2 dark:bg-surfaceColor"
          ></div>
        ))}
      </div>
    );
  }

  if (!licenses || licenses.length === 0) {
    return (
      <div className="p-5 text-center bg-gray-50 dark:bg-backgroundColor rounded-lg">
        <p className="text-gray-600 dark:text-textColor">
          {t('No Licenses Found')}
        </p>
        <button
          className="btn btn-ghost btn-circle mt-4 dark:text-textColor dark:hover:bg-surfaceColor"
          onClick={onRefresh}
          aria-label="Refresh"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Remove the search bar since it's now in parent component */}

      {filteredLicenses.length > 0 ? (
        <div className="overflow-x-auto">
          <Table
            heading={
              <div className="flex justify-between items-center w-full">
                <h2 className="text-md font-normal dark:text-textColor">
                  {searchTerm ? t('Search results') : t('License Management')}
                  {searchTerm && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({filteredLicenses.length})
                    </span>
                  )}
                </h2>
              </div>
            }
            cols={columns}
            body={tableData}
          />
        </div>
      ) : searchTerm ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-backgroundColor rounded-lg">
          {t('No licenses found matching')}{' '}
          <span className="font-medium">"{searchTerm}"</span>
        </div>
      ) : (
        <div className="p-5 text-center bg-gray-50 dark:bg-backgroundColor rounded-lg">
          <p className="text-gray-600 dark:text-textColor">
            {t('No Licenses Found')}
          </p>
          <button
            className="btn btn-ghost btn-circle mt-4 dark:text-textColor dark:hover:bg-surfaceColor"
            onClick={onRefresh}
            aria-label="Refresh"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
