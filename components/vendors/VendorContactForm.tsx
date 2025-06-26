import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';

interface VendorContactFormProps {
  formik: FormikProps<VendorFormData>;
  inputClass: string;
  groupFieldClass: string;
}

const VendorContactForm: React.FC<VendorContactFormProps> = ({ formik, inputClass, groupFieldClass }) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Contact Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Email *
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formik.values.contactEmail}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter email address"
          />
          {formik.touched.contactEmail && formik.errors.contactEmail && (
            <div className="text-red-500 text-sm">
              {formik.errors.contactEmail}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#16355D] dark:text-white">
            Phone Number *
          </label>
          <input
            type="text"
            name="contactPhone"
            value={formik.values.contactPhone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
            placeholder="Enter phone number"
          />
          {formik.touched.contactPhone && formik.errors.contactPhone && (
            <div className="text-red-500 text-sm">
              {formik.errors.contactPhone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorContactForm;
