import React from 'react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Input } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import { maxLengthPolicies } from '@/lib/common';
import { availableRoles } from '@/lib/permissions';
import type { Team } from '@prisma/client';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import useTeamInvitation from 'hooks/useTeamInvitation';

interface InviteViaEmailProps {
  team: Team;
  setVisible: (visible: boolean) => void;
}

const InviteViaEmail = ({ setVisible, team }: InviteViaEmailProps) => {
  const { t } = useTranslation('common');
  const { sendInvitation, isLoading } = useTeamInvitation();

  const FormValidationSchema = Yup.object().shape({
    email: Yup.string()
      .email()
      .max(maxLengthPolicies.email)
      .required(t('require-email')),
    role: Yup.string()
      .required(t('required-role'))
      .oneOf(availableRoles.map((r) => r.id)),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      role: availableRoles[0].id,
      sentViaEmail: true,
    },
    validationSchema: FormValidationSchema,
    onSubmit: async (values) => {
      const success = await sendInvitation({
        email: values.email,
        role: values.role,
        teamSlug: team.slug,
      });

      if (success) {
        setVisible(false);
        formik.resetForm();
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} method="POST" className="pb-6">
      <h3 className="font-medium text-[14px] pb-2">{t('invite-via-email')}</h3>
      <div className="flex gap-1">
        <Input
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
          placeholder="example@brickredsys.com"
          required
          className="text-sm w-1/2 dark:bg-surfaceColor dark:text-textColor"
          type="email"
        />
        <select
          className="select-bordered select rounded dark:bg-surfaceColor dark:text-textColor"
          name="role"
          onChange={formik.handleChange}
          value={formik.values.role}
          required
        >
          {availableRoles.map((role) => (
            <option value={role.id} key={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <ButtonFromTheme
          type="submit"
          loading={formik.isSubmitting || isLoading}
          disabled={!formik.isValid || !formik.dirty}
          className="flex-grow"
        >
          {t('send-invite')}
        </ButtonFromTheme>
      </div>
    </form>
  );
};

export default InviteViaEmail;
