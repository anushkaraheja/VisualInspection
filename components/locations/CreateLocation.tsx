import { defaultHeaders, maxLengthPolicies } from '@/lib/common';
import type { Location } from '@prisma/client';
import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import type { ApiResponse } from 'types';
import * as Yup from 'yup';
import Modal from '../shared/Modal';
import { InputWithLabel } from '../shared';
import useLocations from 'hooks/useLocationHooks';
import useTeams from 'hooks/useTeams';

interface CreateLocationProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const CreateLocation = ({ visible, setVisible }: CreateLocationProps) => {
  const { t } = useTranslation('common');
  const { teams } = useTeams();
  const { mutateLocations } = useLocations(teams ? teams[0].slug : '');
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      name: '',
      teamId: teams ? teams[0].slug : '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required().max(maxLengthPolicies.team),
    }),
    onSubmit: async (values) => {
      if (!teams || teams.length === 0) {
        toast.error(t('no-teams-found'));
        return;
      }
      const response = await fetch(`/api/teams/${teams[0].slug}/locations`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(values),
      });

      const json = (await response.json()) as ApiResponse<Location>;

      if (!response.ok) {
        toast.error(json.error.message);
        return;
      }

      formik.resetForm();
      mutateLocations();
      setVisible(false);
      toast.success(t('location-created'));
      router.push(`/teams/${teams[0].slug}/locations/${json.data.id}/settings`);
    },
  });

  const onClose = () => {
    setVisible(false);
    router.push(`/locations`);
  };

  return (
    <Modal open={visible} close={onClose}>
      <form onSubmit={formik.handleSubmit} method="POST">
        <Modal.Header>{t('create-location')}</Modal.Header>
        <Modal.Description>{t('details-of-a-location')}</Modal.Description>
        <Modal.Body>
          <InputWithLabel
            label={t('Location Name')}
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            placeholder={t('location-name')}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose} size="md">
            {t('close')}
          </Button>
          <Button
            type="submit"
            color="primary"
            loading={formik.isSubmitting}
            size="md"
            disabled={!formik.dirty || !formik.isValid}
          >
            {t('create-location')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreateLocation;
