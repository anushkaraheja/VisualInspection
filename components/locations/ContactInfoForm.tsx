import React from 'react';
import { FormikProps } from 'formik';

interface ContactInfoFormProps {
  formik: FormikProps<any>;
  inputClass: string;
  groupFieldClass: string;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({
  formik,
  inputClass,
  groupFieldClass,
}) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="text-poppins font-semibold">Contact Information</h2>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-20">
        <label className="flex flex-col flex-1 gap-2">
          Phone Number
          <input
            type="text"
            className={inputClass}
            name="phoneNumber"
            onChange={formik.handleChange}
            value={formik.values.phoneNumber}
            placeholder="Phone Number"
          />
          {formik.touched.phoneNumber && formik.errors.phoneNumber && (
            <div className="text-red-500">{formik.errors.phoneNumber}</div>
          )}
        </label>
        <label className="flex flex-col flex-1 gap-2">
          Email Id of the Location Manager (Optional, if any)
          <input
            type="email"
            className={`${inputClass}`}
            name="email"
            onChange={formik.handleChange}
            value={formik.values.email}
            placeholder="Email Id"
          />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-500">{formik.errors.email}</div>
          )}
        </label>
      </div>
    </div>
  );
};

export default ContactInfoForm;
