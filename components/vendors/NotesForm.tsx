import React from 'react';
import { FormikProps } from 'formik';
import { VendorFormData } from './types';

interface NotesFormProps {
  formik: FormikProps<VendorFormData>;
  inputClass: string;
  groupFieldClass: string;
}

const NotesForm: React.FC<NotesFormProps> = ({ formik, inputClass, groupFieldClass }) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="text-xl font-semibold text-[#16355D] dark:text-white">
        Additional Notes
      </h2>
      <div className="flex flex-col gap-2">
        <textarea
          name="notes"
          value={formik.values.notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`${inputClass} min-h-[100px]`}
          placeholder="Enter any additional notes about this vendor"
        />
      </div>
    </div>
  );
};

export default NotesForm;
