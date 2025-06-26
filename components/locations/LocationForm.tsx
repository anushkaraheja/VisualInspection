import React from 'react';
import { FormikProps } from 'formik';

interface LocationFormProps {
  formik: FormikProps<any>;
  inputClass: string;
  groupFieldClass: string;
}

const LocationForm: React.FC<LocationFormProps> = ({
  formik,
  inputClass,
  groupFieldClass,
}) => {
  return (
    <div className={groupFieldClass}>
      <h2 className="font-bold">Location Information</h2>
      <label className="flex flex-col w-full sm:w-1/2 gap-2">
        Location Name
        <input
          type="text"
          name="locationName"
          className={inputClass}
          onChange={formik.handleChange}
          value={formik.values.locationName}
          placeholder="Please enter name of the location"
        />
        {formik.touched.locationName && formik.errors.locationName && (
          <div className="text-red-500">{formik.errors.locationName}</div>
        )}
      </label>
      <label className="flex flex-col w-full sm:w-1/2">
        Address of the location
        <div className="flex flex-col mt-2 gap-4">
          <input
            className={inputClass}
            type="text"
            name="address1"
            onChange={formik.handleChange}
            value={formik.values.address1}
            placeholder="Address Line 1"
          />
          {formik.touched.address1 && formik.errors.address1 && (
            <div className="text-red-500">{formik.errors.address1}</div>
          )}
          <input
            type="text"
            className={inputClass}
            name="address2"
            onChange={formik.handleChange}
            value={formik.values.address2}
            placeholder="Address Line 2"
          />
          <div className="flex flex-col sm:flex-row gap-2 overflow-hidden">
            <input
              type="text"
              className={`${inputClass} w-full sm:w-1 sm:flex-1`}
              name="zip"
              onChange={formik.handleChange}
              value={formik.values.zip}
              placeholder="Zip Code"
            />
            {formik.touched.zip && formik.errors.zip && (
              <div className="text-red-500">{formik.errors.zip}</div>
            )}
            <input
              type="text"
              className={`${inputClass} w-full sm:flex-1`}
              name="state"
              onChange={formik.handleChange}
              value={formik.values.state}
              placeholder="State"
            />
            {formik.touched.state && formik.errors.state && (
              <div className="text-red-500">{formik.errors.state}</div>
            )}
            <input
              type="text"
              className={`${inputClass} w-full sm:flex-1`}
              name="city"
              onChange={formik.handleChange}
              value={formik.values.city}
              placeholder="City"
            />
            {formik.touched.city && formik.errors.city && (
              <div className="text-red-500">{formik.errors.city}</div>
            )}
          </div>
        </div>
      </label>
    </div>
  );
};

export default LocationForm;
