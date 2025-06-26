import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import ModalRightScreen from '@/components/shared/ModalRightScreen';
import { Zone } from '../../services/zoneService';

interface ZoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zoneData: Partial<Zone>) => void;
  initialValues?: Partial<Zone> | null;
  locationId: string;
  isEdit: boolean;
}

const ZoneForm: React.FC<ZoneFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  locationId,
  isEdit,
}) => {
  const getTeamSlug = () => {
    // Use window.location in browser context
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const teamIndex = pathParts.indexOf('teams');
      if (teamIndex !== -1 && pathParts.length > teamIndex + 1) {
        return pathParts[teamIndex + 1];
      }
    }
    return '';
  };

  const formik = useFormik({
    initialValues: initialValues || {
      name: '',
      description: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Zone name is required'),
      description: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (isEdit && initialValues?.id) {
        try {
          if (locationId) {
            const teamSlug = getTeamSlug();
            await fetch(
              `/api/teams/${teamSlug}/locations/${locationId}/zones/${initialValues.id}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
              }
            );
          }

          // Call parent's onSave function with merged data to preserve ID and other fields
          onSave({
            ...initialValues,
            ...values,
          });

          // Reset form state after successful submission
          formik.resetForm();
        } catch (error) {
          console.error('Failed to update zone:', error);
          alert('Failed to update zone. Please try again.');
        }
      } else {
        try {
          // If we have a real location ID, save to the server
          if (locationId && !locationId.startsWith('temp-')) {
            const teamSlug = getTeamSlug();
            const response = await fetch(
              `/api/teams/${teamSlug}/locations/${locationId}/zones`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
              }
            );

            if (response.ok) {
              const newZone = await response.json();
              onSave(newZone);
              formik.resetForm();
              return;
            }
          }

          // If server save fails or we're working with a temp location, use the values directly
          onSave(values);
          formik.resetForm();
        } catch (error) {
          console.error('Failed to create zone:', error);
          // Still save locally if API call fails
          onSave(values);
          formik.resetForm();
        }
      }
    },
  });

  // Handle cancel with proper form reset
  const handleCancel = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <ModalRightScreen isOpen={isOpen} onClose={handleCancel} width="w-1/3">
      <ModalRightScreen.Header>
        <div>
          <ModalRightScreen.Title>
            {isEdit ? 'Edit Zone' : 'Add New Zone'}
          </ModalRightScreen.Title>
          {isEdit && (
            <ModalRightScreen.Subtitle>
              Editing zone "{initialValues?.name}"
            </ModalRightScreen.Subtitle>
          )}
        </div>
      </ModalRightScreen.Header>

      <ModalRightScreen.Content>
        <form id="zoneForm" onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 font-medium">
              Zone Name*
            </label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
              placeholder={
                isEdit ? initialValues?.name || '' : 'Enter zone name'
              }
              className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
              autoFocus={isEdit}
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 mt-1">{formik.errors.name}</div>
            ) : null}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block mb-2 font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description ?? ''}
              placeholder={
                isEdit
                  ? 'Original description: ' +
                    (initialValues?.description || 'None')
                  : 'Enter zone description'
              }
              className="w-full p-2 border border-gray-300 dark:border-borderColor dark:bg-surfaceColor rounded-md"
            />
          </div>
        </form>
      </ModalRightScreen.Content>

      <ModalRightScreen.Footer>
        <ButtonFromTheme
          type="submit"
          onClick={() => formik.handleSubmit()}
          className="px-4 py-2 text-sm font-medium text-white rounded-md"
        >
          {isEdit ? 'Update Zone' : 'Add Zone'}
        </ButtonFromTheme>
        <ButtonFromTheme
          type="button"
          onClick={handleCancel}
          outline={true}
          className="px-4 py-2 text-sm font-medium rounded-md"
        >
          Cancel
        </ButtonFromTheme>
      </ModalRightScreen.Footer>
    </ModalRightScreen>
  );
};

export default ZoneForm;
