import React from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { Table } from '@/components/shared/table/Table';
import { TableBodyType } from '@/components/shared/table/TableBody';
import { VendorDetails } from 'hooks/useVendors';

interface VendorDetailsViewProps {
  vendorDetails: VendorDetails;
  onBack: () => void;
  onEdit: () => void;
  onViewLocation: (locationId: string) => void;
  locationTableData: TableBodyType[];
  formattedLivestockItems: { livestockId: string; name: string; icon?: string | null }[];
}

const VendorDetailsView: React.FC<VendorDetailsViewProps> = ({
  vendorDetails,
  onBack,
  onEdit,
  onViewLocation,
  locationTableData,
  formattedLivestockItems
}) => {
  const {
    companyName, 
    contactName, 
    contactEmail, 
    contactPhone, 
    address, 
    active, 
    notes, 
    locations = []
  } = vendorDetails;

  return (
    <div className="py-5 lg:px-8">
      <div className="flex flex-col gap-4">
        {/* Header Section */}
        <header className="flex justify-between mb-2">
          <div className="flex items-start">
            <button
              onClick={onBack}
              className="text-3xl mt-1 text-[#5E6C84]"
            >
              <IoIosArrowBack />
            </button>
            <div className="ml-2">
              <h1 className="text-4xl font-semibold font-montserrat">
                {companyName}
              </h1>
              <p className="text-[#5E6C84]">
                Vendor Details
              </p>
            </div>
          </div>
          <ButtonFromTheme
            className="border border-solid text-white rounded-md my-2.5 px-10 hover:text-white"
            onClick={onEdit}
          >
            Edit
          </ButtonFromTheme>
        </header>

        {/* Vendor Information Section */}
        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="font-semibold text-xl">
            Vendor Information
          </h2>
          <div className="flex flex-1 gap-2">
            <div className="flex flex-col flex-1">
              <p>Company Name</p>
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {companyName}
              </p>
            </div>
            <div className="flex flex-col flex-1">
              <p>Contact Name</p>
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {contactName}
              </p>
            </div>
          </div>
          <div className="flex flex-1 gap-2 mt-4">
            <div className="flex flex-col flex-1">
              <p>Status</p>
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {active ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                    Inactive
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="font-semibold text-xl">Contact Information</h2>
          <div className="flex flex-1 gap-2">
            <div className="flex-1">
              <p>Email</p>
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {contactEmail}
              </p>
            </div>
            <div className="flex-1">
              <p>Phone Number</p>
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {contactPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <h2 className="font-semibold text-xl">Address</h2>
          <div className="flex flex-1">
            <div className="flex-1">
              <p className="text-[#464A53] dark:text-gray-300 text-xl font-[600]">
                {address.addressLine1}
                {address.addressLine2 && <span>, {address.addressLine2}</span>}
                <br />
                {address.city}, {address.state} {address.zip}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section (if exists) */}
        {notes && (
          <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
            <h2 className="font-semibold text-xl">Notes</h2>
            <div className="flex flex-1">
              <p className="text-[#464A53] dark:text-gray-300">
                {notes}
              </p>
            </div>
          </div>
        )}

        {/* Locations Section */}
        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <div className="flex justify-between border-b pb-3 items-center">
            <h2 className="font-semibold text-xl">Locations</h2>
          </div>
          {locations.length === 0 ? (
            <p className="text-black dark:text-gray-300 mt-4 text-center">
              This vendor is not associated with any locations.
            </p>
          ) : (
            <div className="mt-4">
              <Table
                cols={['Location Name', 'Address', 'Action']}
                body={locationTableData}
              />
            </div>
          )}
        </div>

        {/* Livestock Section */}
        <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
          <div className="flex justify-between border-b pb-3 items-center">
            <h2 className="font-semibold text-xl">Livestock Categories</h2>
          </div>
          {formattedLivestockItems.length === 0 ? (
            <p className="text-black dark:text-gray-300 mt-4 text-center">
              No livestock categories are associated with this vendor.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {formattedLivestockItems.map((item) => (
                <div
                  key={item.livestockId}
                  className="p-4 bg-[#F6FAFF] dark:bg-surfaceColor rounded-lg flex items-center"
                >
                  {item.icon && (
                    <div className="mr-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-6 h-6"
                      />
                    </div>
                  )}
                  <span className="text-[#16355D] dark:text-gray-300 font-medium">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetailsView;
