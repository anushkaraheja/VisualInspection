import { FormikProps } from 'formik';

export interface VendorFormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  active: boolean;
}

export interface FormSectionProps {
  formik: FormikProps<VendorFormData>;
  inputClass: string;
  groupFieldClass: string;
}
