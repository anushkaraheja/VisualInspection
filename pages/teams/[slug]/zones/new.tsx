import React, { useState } from 'react';
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
import { useTeamLocations } from '@/components/teamDashboard/liveMonitoring/hooks';

const NewZone = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch team locations for the dropdown
  const {
    data: locationsResponse,
    error: locationsError,
    isLoading: locationsLoading,
  } = useTeamLocations(slug as string);

  const locations = locationsResponse?.data || [];

  const formik = useFormik({
    initialValues: {
      zoneName: '',
      description: '',
      locationId: '',
    },
    validationSchema: Yup.object().shape({
      zoneName: Yup.string().required('Zone name is required'),
      description: Yup.string(),
      locationId: Yup.string().required('Please select a location'),
    }),
    onSubmit: async (values) => {
      try {
        setIsCreating(true);
        setError(null);

        const response = await fetch(
          `/api/teams/${slug}/locations/${values.locationId}/zones`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: values.zoneName,
              description: values.description,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to create zone');
        }

        const createdZone = await response.json();

        // Redirect to the zone list page or the new zone's view page
        router.push(`/teams/${slug}/locations/${values.locationId}`);
      } catch (err) {
        console.error('Error creating zone:', err);
        setError(err as Error);
      } finally {
        setIsCreating(false);
      }
    },
  });

  const groupFieldClass =
    'bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10';

  const inputClass =
    'bg-[#6A707E00] border border-[#949494] placeholder:text-[#ABAFB3] p-2 rounded-[0px] outline-none';

  return (
    <WithLoadingAndError
      isLoading={locationsLoading || isCreating}
      error={error || locationsError}
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
                  Create New Zone
                </h1>
                <p className="text-[#5E6C84]">
                  Add a new zone to your location
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

          {/* Location Selection */}
          <div className={groupFieldClass}>
            <h2 className="font-semibold text-xl">Select Location</h2>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label htmlFor="locationId" className="mb-1">
                  Location*
                </label>
                <select
                  id="locationId"
                  name="locationId"
                  value={formik.values.locationId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputClass}
                >
                  <option value="">Select a location</option>
                  {locations.map((location: any) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {formik.touched.locationId && formik.errors.locationId ? (
                  <div className="text-red-500">{formik.errors.locationId}</div>
                ) : null}
              </div>
            </div>
          </div>

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
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  className={`${inputClass} min-h-[100px]`}
                />
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
              disabled={isCreating}
            >
              Create Zone
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

export default NewZone;
