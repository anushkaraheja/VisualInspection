import React from 'react';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { Error, Loading } from '@/components/shared';

interface LicensesSectionProps {
  groupFieldClass: string;
  isPurchasedLicenseLoading: boolean;
  isPurchasedLicenseError: any;
  purchasedLicenses: any[];
  handleOpenLicenseModal: () => void;
}

const LicensesSection: React.FC<LicensesSectionProps> = ({
  groupFieldClass,
  isPurchasedLicenseLoading,
  isPurchasedLicenseError,
  purchasedLicenses,
  handleOpenLicenseModal,
}) => {
  return (
    <div className={groupFieldClass}>
      <div className="flex flex-col md:flex-row md:justify-between border-b pb-3 items-center">
        <h2 className="font-semibold mb-4 md:mb-0">License</h2>
        {/* <div className="flex gap-4 w-full md:w-auto">
          <ButtonFromTheme
            className={`py-2 px-10 border rounded-md hover:text-white w-full md:w-auto`}
            onClick={handleOpenLicenseModal}
          >
            Manage or Buy New License
          </ButtonFromTheme>
        </div> */}
      </div>
      {isPurchasedLicenseLoading ? (
        <Loading />
      ) : isPurchasedLicenseError ? (
        <Error message={isPurchasedLicenseError.message} />
      ) : purchasedLicenses && purchasedLicenses.length === 0 ? (
        <p className="text-black mt-4 text-center dark:text-white">
          You don&#x2019;t have any active License,{' '}
          <span className="text-[#1A79F8]">Buy Now</span>.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col md:flex-row gap-2">
          {purchasedLicenses &&
            purchasedLicenses.map((purchasedLicense, index) => (
              <li
                key={index}
                className="text-[#17355D] border rounded-xl bg-[#F6F6F6] dark:bg-surfaceColor dark:text-white dark:border dark:border-borderColor flex flex-col items-start p-4 flex-1 mb-2 md:mb-0"
              >
                <div className="flex justify-between w-full mb-6 text-poppins font-normal">
                  <div className="flex-1">
                    <input type="checkbox" className="mr-2 accent-white" />
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
  );
};

export default LicensesSection;
