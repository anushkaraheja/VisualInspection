import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';

interface VendorFormProps {
  formik: FormikProps<VendorFormData>;
  inputClass: string;
  groupFieldClass: string;
}

const VendorForm: React.FC<VendorFormProps> = ({ formik, inputClass, groupFieldClass }) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Vendor Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Company Name *
          </label>
          <input
            type="text"
            name="companyName"
            value={formik.values.companyName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter company name"
          />
          {formik.touched.companyName && formik.errors.companyName && (
            <div className="text-red-500 text-sm">
              {formik.errors.companyName}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Contact Name *
          </label>
          <input
            type="text"
            name="contactName"
            value={formik.values.contactName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter contact name"
          />
          {formik.touched.contactName && formik.errors.contactName && (
            <div className="text-red-500 text-sm">
              {formik.errors.contactName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorForm;
