import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from '@/lib/toast';
import { updateLicense } from './licenseService';
import { License, RenewalPeriod, LicenseStatus } from 'types/license';

interface EditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: License;
  teamSlug: string;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  type: string;
  price: number;
  renewalPeriod: RenewalPeriod;
  status: LicenseStatus;
  maxLocations?: number;
  maxUsers?: number;
  features: string[];
}

// Transform License to form data
const licenseToFormData = (license: License): FormData => {
  return {
    name: license.name,
    description: license.description || '',
    type: license.type,
    price: license.price,
    renewalPeriod: license.renewalPeriod,
    status: license.status,
    maxLocations: license.maxLocations ?? 0,
    maxUsers: license.maxUsers ?? 0,
    features: license.features || [],
  };
};

export const EditLicenseModal = ({
  isOpen,
  onClose,
  license,
  teamSlug,
  onSuccess,
}: EditLicenseModalProps) => {
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: FormData = licenseToFormData(license);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('license_name_required')),
    type: Yup.string().required(t('license_type_required')),
    price: Yup.number()
      .min(0, t('price_must_be_positive'))
      .required(t('price_required')),
    renewalPeriod: Yup.string().required(t('renewal_period_required')),
    status: Yup.string().required(t('status_required')),
  });

  const onSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      await updateLicense(teamSlug, license.id, values);
      toast.success(t('license_updated'));
      onSuccess();
    } catch (error) {
      toast.error(t('error_updating_license'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-white dark:bg-backgroundColor text-gray-800 dark:text-textColor">
        <h3 className="font-bold text-lg dark:text-textColor">
          {t('edit_license')}
        </h3>
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-500 dark:text-textColor"
          onClick={onClose}
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
                    {t('description')}
                  </span>
                </label>
                <Field
                  as="textarea"
                  name="description"
                  className="textarea textarea-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor"
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('license_type')}
                  </span>
                </label>
                <Field
                  as="select"
                  name="type"
                  className={`select select-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.type && errors.type ? 'select-error' : ''}`}
                >
                  <option value="">{t('select_license_type')}</option>
                  <option value="perpetual">{t('perpetual')}</option>
                  <option value="subscription">{t('subscription')}</option>
                  <option value="trial">{t('trial')}</option>
                </Field>
                <ErrorMessage name="type" component="label" className="label">
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
                    {t('price')}
                  </span>
                </label>
                <Field
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  className={`input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.price && errors.price ? 'input-error' : ''}`}
                />
                <ErrorMessage name="price" component="label" className="label">
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
                    {t('renewal_period')}
                  </span>
                </label>
                <Field
                  as="select"
                  name="renewalPeriod"
                  className={`select select-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.renewalPeriod && errors.renewalPeriod ? 'select-error' : ''}`}
                >
                  <option value={RenewalPeriod.MONTHLY}>{t('monthly')}</option>
                  <option value={RenewalPeriod.QUARTERLY}>
                    {t('quarterly')}
                  </option>
                  <option value={RenewalPeriod.SEMIANNUALLY}>
                    {t('semiannually')}
                  </option>
                  <option value={RenewalPeriod.ANNUALLY}>
                    {t('annually')}
                  </option>
                  <option value={RenewalPeriod.BIANNUALLY}>
                    {t('biannually')}
                  </option>
                </Field>
                <ErrorMessage
                  name="renewalPeriod"
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
                    {t('status')}
                  </span>
                </label>
                <Field
                  as="select"
                  name="status"
                  className={`select select-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor ${touched.status && errors.status ? 'select-error' : ''}`}
                >
                  <option value={LicenseStatus.ACTIVE}>{t('active')}</option>
                  <option value={LicenseStatus.EXPIRED}>{t('expired')}</option>
                  <option value={LicenseStatus.SUSPENDED}>
                    {t('suspended')}
                  </option>
                  <option value={LicenseStatus.PENDING}>{t('pending')}</option>
                </Field>
                <ErrorMessage name="status" component="label" className="label">
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
                    {t('max_locations')}
                  </span>
                </label>
                <Field
                  type="number"
                  name="maxLocations"
                  min="0"
                  className="input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor"
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('max_users')}
                  </span>
                </label>
                <Field
                  type="number"
                  name="maxUsers"
                  min="0"
                  className="input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor"
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text dark:text-textColor">
                    {t('features')}
                  </span>
                </label>
                <Field
                  type="text"
                  name="features"
                  placeholder="Feature1, Feature2, Feature3"
                  className="input input-bordered w-full dark:bg-surfaceColor dark:border-borderColor dark:text-textColor"
                />
                <label className="label">
                  <span className="label-text-alt dark:text-textColor">
                    {t('features_comma_separated')}
                  </span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn dark:bg-surfaceColor dark:hover:bg-surfaceColor/80 dark:text-textColor dark:border-borderColor"
                  onClick={onClose}
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
