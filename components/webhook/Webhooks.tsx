import { WithLoadingAndError } from '@/components/shared';
import { EmptyState } from '@/components/shared';
import { Team, Webhook } from '@prisma/client';
import useWebhooks from 'hooks/useWebhooks';
import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import type { EndpointOut } from 'svix';

import { CreateWebhook, EditWebhook } from '@/components/webhook';
import { defaultHeaders } from '@/lib/common';
import type { ApiResponse } from 'types';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { Table } from '@/components/shared/table/Table';
import ButtonFromTheme from '../shared/ButtonFromTheme';

const Webhooks = ({ team }: { team: Team }) => {
  const { t } = useTranslation('common');
  const [createWebhookVisible, setCreateWebhookVisible] = useState(false);
  const [updateWebhookVisible, setUpdateWebhookVisible] = useState(false);
  const [webhook, setWebhook] = useState<Webhook | null>(null);

  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    React.useState(false);

  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(
    null
  );

  const { isLoading, isError, webhooks, mutateWebhooks } = useWebhooks(
    team.slug
  );

  const deleteWebhook = async (webhook: Webhook | null) => {
    if (!webhook) {
      return;
    }

    const sp = new URLSearchParams({ webhookId: webhook.id });

    const response = await fetch(
      `/api/teams/${team.slug}/webhooks?${sp.toString()}`,
      {
        method: 'DELETE',
        headers: defaultHeaders,
      }
    );

    const json = (await response.json()) as ApiResponse;

    if (!response.ok) {
      toast.error(json.error.message);
      return;
    }

    mutateWebhooks();
    toast.success(t('webhook-deleted'));
  };

  return (
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <h2 className="text-xl font-medium leading-none tracking-tight">
              {t('webhooks')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('webhooks-description')}
            </p>
          </div>
          <ButtonFromTheme
            onClick={() => setCreateWebhookVisible(!createWebhookVisible)}
          >
            {t('add-webhook')}
          </ButtonFromTheme>
        </div>
        {webhooks?.length === 0 ? (
          <EmptyState title={t('no-webhook-title')} />
        ) : (
          <div className="overflow-x-auto">
            <Table
              cols={[t('name'), t('url'), t('created-at'), t('actions')]}
              body={
                webhooks
                  ? webhooks.map((webhook) => {
                      return {
                        id: webhook.id,
                        cells: [
                          {
                            wrap: true,
                            text: webhook.description,
                          },
                          {
                            wrap: true,
                            text: webhook.url,
                          },
                          {
                            wrap: true,
                            text: webhook.createdAt.toLocaleString(),
                          },
                          {
                            buttons: [
                              {
                                text: t('edit'),
                                onClick: () => {
                                  setWebhook(webhook);
                                  setUpdateWebhookVisible(
                                    !updateWebhookVisible
                                  );
                                },
                              },
                              {
                                color: 'error',
                                text: t('remove'),
                                onClick: () => {
                                  setSelectedWebhook(webhook);
                                  setConfirmationDialogVisible(true);
                                },
                              },
                            ],
                          },
                        ],
                      };
                    })
                  : []
              }
            ></Table>
          </div>
        )}
        {webhook && (
          <EditWebhook
            visible={updateWebhookVisible}
            setVisible={setUpdateWebhookVisible}
            team={team}
            endpoint={webhook}
          />
        )}
      </div>
      <ConfirmationDialog
        visible={confirmationDialogVisible}
        onCancel={() => setConfirmationDialogVisible(false)}
        onConfirm={() => deleteWebhook(selectedWebhook)}
        title={t('confirm-delete-webhook')}
      >
        {t('delete-webhook-warning')}
      </ConfirmationDialog>
      <CreateWebhook
        visible={createWebhookVisible}
        setVisible={setCreateWebhookVisible}
        team={team}
      />
    </WithLoadingAndError>
  );
};

export default Webhooks;
