import React from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import {
  Error as ErrorComponent,
  Loading,
  WithLoadingAndError,
} from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { IoIosArrowBack } from 'react-icons/io';
// Import custom hooks
import {
  useZoneDetails,
  useUpdateZone,
} from '@/components/teamDashboard/liveMonitoring/hooks';

const EditZone = () => {
  const router = useRouter();
  const { slug, id: zoneId } = router.query;

  // Use custom hooks for fetching zone details and updating
  const {
    zoneDetails: zone,
    isLoading,
    error,
  } = useZoneDetails(slug as string, zoneId as string);
  const {
    updateZone,
    isUpdating,
    error: updateError,
  } = useUpdateZone(slug as string, zoneId as string);

  const formik = useFormik({
    initialValues: {
      zoneName: zone?.name || '',
      description: zone?.description || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      zoneName: Yup.string().required('Zone name is required'),
      description: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (!zone) return;

      try {
        const updatedZone = await updateZone(
          {
            name: values.zoneName,
            description: values.description,
          },
          zone.locationId
        );

        if (updatedZone) {
          router.push(`/teams/${slug}/zones/${zoneId}/view`);
        }
      } catch (err) {
        console.error('Error updating zone:', err);
      }
    },
  });

  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';

  const inputClass =
    'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  return (
    <WithLoadingAndError
      isLoading={isLoading || isUpdating}
      error={error || updateError}
    >
      <form
        onSubmit={formik.handleSubmit}
        className="bg-[#f6f6fa] dark:bg-backgroundColor py-5 lg:px-8"
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <header className="flex justify-between items-center">
            <div className="flex items-start">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-3xl mt-1 text-[#5E6C84]"
              >
                <IoIosArrowBack />
              </button>
              <div className="ml-2">
                <h1 className="text-4xl font-semibold font-montserrat">
                  Edit Zone
                </h1>
                <p className="text-[#5E6C84]">
                  Update the details of {zone?.name}
                </p>
              </div>
            </div>
            <ButtonFromTheme
              type="button"
              className="border border-solid rounded-md py-1 px-6"
              onClick={() => router.back()}
              outline={true}
            >
              Cancel
            </ButtonFromTheme>
          </header>

          {/* Zone Information */}
          <div className={groupFieldClass}>
            <h2 className="font-semibold text-xl">Zone Information</h2>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label htmlFor="zoneName" className="mb-1">
                  Zone Name*
                </label>
                <input
                  id="zoneName"
                  name="zoneName"
                  placeholder="Enter zone name"
                  value={formik.values.zoneName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputClass}
                />
                {formik.touched.zoneName && formik.errors.zoneName ? (
                  <div className="text-red-500">{formik.errors.zoneName}</div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Zone Description */}
          <div className={groupFieldClass}>
            <h2 className="font-semibold text-xl">Description</h2>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label htmlFor="description" className="mb-1">
                  Zone Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter zone description"
                  value={formik.values.description || ''}
                  onChange={formik.handleChange}
                  className={`${inputClass} min-h-[100px]`}
                />
              </div>
            </div>
          </div>

          {/* Location Information (read-only) */}
          <div className={groupFieldClass}>
            <h2 className="font-semibold text-xl">Location</h2>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label className="mb-1">Located in</label>
                <div className="border border-[#949494] p-2 bg-gray-50 dark:bg-surfaceColor">
                  {zone?.location?.name || 'Unknown Location'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-4">
            <ButtonFromTheme
              type="button"
              className="border border-solid rounded-md py-1 px-6"
              onClick={() => router.back()}
              outline={true}
            >
              Cancel
            </ButtonFromTheme>

            <ButtonFromTheme
              type="submit"
              className="border border-solid text-white rounded-md py-1 px-6 hover:text-white"
            >
              Save Changes
            </ButtonFromTheme>
          </div>
        </div>
      </form>
    </WithLoadingAndError>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default EditZone;
