import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from '@/lib/toast';
// Import the correct types from the types/license module
import { CreateLicenseData, RenewalPeriod } from 'types/license';
import { createLicense } from './licenseService';

interface AddLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSlug: string;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  licenseType: string;
  licenseKey: string;
  expiryDate: string;
  active: boolean;
}

// Transform FormData to the proper CreateLicenseData type
const transformFormData = (formData: FormData): CreateLicenseData => {
  return {
    name: formData.name,
    description: undefined,
    price: 0,
    type: formData.licenseType,
    // Use the proper enum value for renewalPeriod
    renewalPeriod: RenewalPeriod.MONTHLY,
    features: [],
    maxLocations: undefined,
    maxUsers: undefined,
  };
};

export const AddLicenseModal = ({
  isOpen,
  onClose,
  teamSlug,
  onSuccess,
}: AddLicenseModalProps) => {
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: FormData = {
    name: '',
    licenseType: '',
    licenseKey: '',
    expiryDate: '',
    active: true,
  };

  const validationSchema = Yup.object({
    name: Yup.string().required(t('license_name_required')),
    licenseType: Yup.string().required(t('license_type_required')),
    licenseKey: Yup.string().required(t('license_key_required')),
    expiryDate: Yup.string().required(t('expiry_date_required')),
    active: Yup.boolean(),
  });

  const onSubmit = async (values: FormData, { resetForm }: any) => {
    try {
      setIsSubmitting(true);
      const licenseData = transformFormData(values);
      await createLicense(teamSlug, licenseData);
      toast.success(t('license_created'));
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(t('error_creating_license'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-white dark:bg-backgroundColor text-gray-800 dark:text-textColor">
        <h3 className="font-bold text-lg dark:text-textColor">
          {t('add_license')}
        </h3>
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-500 dark:text-textColor"
          onClick={handleClose}
        >
          ✕
        </button>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched, isSubmitting: formIsSubmitting }) => (
            <Form className="pt-4">
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('license_name')}
                  </span>
                </label>
                <Field
                  type="text"
                  name="name"
                  className={`input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.name && errors.name ? 'input-error' : ''}`}
                />
                <ErrorMessage name="name" component="label" className="label">
                  {(msg) => (
                    <span className="label-text-alt text-error dark:text-red-400">
                      {msg}
                    </span>
                  )}
                </ErrorMessage>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('license_type')}
                  </span>
                </label>
                <Field
                  as="select"
                  name="licenseType"
                  className={`select select-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.licenseType && errors.licenseType ? 'select-error' : ''}`}
                >
                  <option value="">{t('select_license_type')}</option>
                  <option value="perpetual">{t('perpetual')}</option>
                  <option value="subscription">{t('subscription')}</option>
                  <option value="trial">{t('trial')}</option>
                </Field>
                <ErrorMessage
                  name="licenseType"
                  component="label"
                  className="label"
                >
                  {(msg) => (
                    <span className="label-text-alt text-error dark:text-red-400">
                      {msg}
                    </span>
                  )}
                </ErrorMessage>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('license_key')}
                  </span>
                </label>
                <Field
                  type="text"
                  name="licenseKey"
                  className={`input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.licenseKey && errors.licenseKey ? 'input-error' : ''}`}
                />
                <ErrorMessage
                  name="licenseKey"
                  component="label"
                  className="label"
                >
                  {(msg) => (
                    <span className="label-text-alt text-error dark:text-red-400">
                      {msg}
                    </span>
                  )}
                </ErrorMessage>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('expiry_date')}
                  </span>
                </label>
                <Field
                  type="date"
                  name="expiryDate"
                  className={`input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.expiryDate && errors.expiryDate ? 'input-error' : ''}`}
                />
                <ErrorMessage
                  name="expiryDate"
                  component="label"
                  className="label"
                >
                  {(msg) => (
                    <span className="label-text-alt text-error dark:text-red-400">
                      {msg}
                    </span>
                  )}
                </ErrorMessage>
              </div>

              <div className="form-control mb-4">
                <label className="cursor-pointer label">
                  <span className="label-text dark:text-textColor">
                    {t('status')}
                  </span>
                  <Field
                    type="checkbox"
                    name="active"
                    className="toggle toggle-success"
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt dark:text-textColor">
                    {t('license_active_helper')}
                  </span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn dark:bg-surfaceColor dark:hover:bg-surfaceColor/80 dark:text-textColor dark:border-borderColor"
                  onClick={handleClose}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting || formIsSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting || formIsSubmitting}
                >
                  {t('save')}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
