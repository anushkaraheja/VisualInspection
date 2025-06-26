import React, { useState, useEffect } from 'react';
import { useLicense } from 'hooks/useLicenseHooks';
import { useRouter } from 'next/router';
import axios from 'axios';
import { License } from '@prisma/client';
import toast from 'react-hot-toast';
import ButtonFromTheme from '../shared/ButtonFromTheme';

const ManageOrBuyLicenses = ({ isOpen, onClose, purchasedLicenses }) => {
  const router = useRouter();
  const { slug: teamSlug } = router.query;
  const { licenses } = useLicense(teamSlug as string);
  const [selectedLicenses, setSelectedLicenses] = useState<License[]>([]);
  const [availableLicenses, setAvailableLicenses] = useState<License[]>([]);

  useEffect(() => {
    if (licenses && purchasedLicenses) {
      const purchasedLicenseIds = purchasedLicenses.map(
        (purchasedLicense) => purchasedLicense.licenseId
      );
      const filteredLicenses = licenses.filter(
        (license) => !purchasedLicenseIds.includes(license.id)
      );
      setAvailableLicenses(filteredLicenses);
    }
  }, [licenses, purchasedLicenses]);

  const handleCheckboxChange = (license) => {
    setSelectedLicenses((prevSelected) =>
      prevSelected.includes(license)
        ? prevSelected.filter((item) => item !== license)
        : [...prevSelected, license]
    );
  };

  const handleBuySelected = async () => {
    try {
      await axios.post(`/api/teams/${teamSlug}/licenses`, {
        licenses: selectedLicenses,
      });
      toast.success(`License Purchased`, { duration: 5000 });
      onClose();
      // Optionally, you can add logic to handle the response, such as closing the modal or showing a success message
    } catch (error) {
      toast.error(`Error purchasing license: ${error}`, { duration: 5000 });
      // Optionally, you can add logic to handle the error, such as showing an error message
    }
  };

  return (
    /* eslint-disable i18next/no-literal-string */
    <div
      className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="relative top-1/4 mx-auto p-5 dark:border-borderColor border w-3/4 shadow-lg rounded-md bg-white dark:bg-backgroundColor">
        <div className="flex justify-between items-center pb-3">
          <p className="text-2xl font-bold">Manage or Buy New License</p>
          <div className="cursor-pointer z-50" onClick={onClose}>
            <svg
              className="fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <path d="M14.53 3.47a.75.75 0 00-1.06 0L9 7.94 4.53 3.47a.75.75 0 10-1.06 1.06L7.94 9l-4.47 4.47a.75.75 0 101.06 1.06L9 10.06l4.47 4.47a.75.75 0 101.06-1.06L10.06 9l4.47-4.47a.75.75 0 000-1.06z" />
            </svg>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          {availableLicenses &&
            availableLicenses.map((license, index) => (
              <div
                key={index}
                className="text-[#17355D] dark:text-textColor border rounded-xl bg-[#F6F6F6] dark:bg-surfaceColor flex flex-col items-start p-4 flex-1"
              >
                <div className="flex justify-between w-full mb-6 text-poppins font-normal">
                  <div className="flex-1">
                    <input
                      type="checkbox"
                      className="mr-2 accent-white "
                      onChange={() => handleCheckboxChange(license)}
                    />
                    <span className="overflow-hidden text-ellipsis">
                      {license.name}
                    </span>
                  </div>
                  <span className="overflow-hidden text-ellipsis text-right">
                    ${license.price}
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
                  {license.description}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-end">
          <ButtonFromTheme
            className={`px-4 py-2 rounded ${
              selectedLicenses.length > 0
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleBuySelected}
            disabled={selectedLicenses.length === 0}
          >
            Buy Selected Licenses
          </ButtonFromTheme>
        </div>
      </div>
    </div>
    /* eslint-disable i18next/no-literal-string */
  );
};

export default ManageOrBuyLicenses;
