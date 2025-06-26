import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';

interface AddressFormProps {
  formik: FormikProps<VendorFormData>;
  inputClass: string;
  groupFieldClass: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ formik, inputClass, groupFieldClass }) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Address
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Address Line 1 *
          </label>
          <input
            type="text"
            name="address.addressLine1"
            value={formik.values.address.addressLine1}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter address line 1"
          />
          {formik.touched.address?.addressLine1 && formik.errors.address?.addressLine1 && (
            <div className="text-red-500 text-sm">
              {formik.errors.address.addressLine1}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Address Line 2
          </label>
          <input
            type="text"
            name="address.addressLine2"
            value={formik.values.address.addressLine2}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter address line 2 (optional)"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            City *
          </label>
          <input
            type="text"
            name="address.city"
            value={formik.values.address.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter city"
          />
          {formik.touched.address?.city && formik.errors.address?.city && (
            <div className="text-red-500 text-sm">
              {formik.errors.address.city}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            State *
          </label>
          <input
            type="text"
            name="address.state"
            value={formik.values.address.state}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter state"
          />
          {formik.touched.address?.state && formik.errors.address?.state && (
            <div className="text-red-500 text-sm">
              {formik.errors.address.state}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Zip Code *
          </label>
          <input
            type="text"
            name="address.zip"
            value={formik.values.address.zip}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter zip code"
          />
          {formik.touched.address?.zip && formik.errors.address?.zip && (
            <div className="text-red-500 text-sm">
              {formik.errors.address.zip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
