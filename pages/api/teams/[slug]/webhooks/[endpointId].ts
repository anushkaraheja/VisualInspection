import { ApiError } from '@/lib/errors';
import { sendAudit } from '@/lib/retraced';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import env from '@/lib/env';
import {
  getWebhookSchema,
  updateWebhookEndpointSchema,
  validateWithSchema,
} from '@/lib/zod';
import { getWebhookByIdDB, updateWebhookDB } from '@/lib/webhooks';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    if (!env.teamFeatures.webhook) {
      throw new ApiError(404, 'Not Found');
    }

    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (err: any) {
    const message = err?.body?.detail || err.message || 'Something went wrong';
    const status = err.status || err.code || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get a Webhook
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'TEAM_WEBHOOK', 'read');

  const { endpointId } = validateWithSchema(
    getWebhookSchema,
    req.query as {
      endpointId: string;
    }
  );

  const result = await getWebhookByIdDB(endpointId, teamMember.team.id);

  if (!result.success) {
    throw new ApiError(404, result.error || 'Webhook not found');
  }

  recordMetric('webhook.fetched');

  res.status(200).json({ data: result.data });
};

// Update a Webhook
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'TEAM_WEBHOOK', 'update');

  const { name, url, eventTypes, endpointId } = validateWithSchema(
    updateWebhookEndpointSchema,
    {
      ...req.query,
      ...req.body,
    }
  );

  const result = await updateWebhookDB(endpointId, teamMember.team.id, {
    url,
    description: name,
    eventTypes,
    teamMemberId: teamMember.id,
  });

  if (!result.success) {
    throw new ApiError(400, result.error || 'Failed to update webhook');
  }

  sendAudit({
    action: 'webhook.update',
    crud: 'u',
    user: teamMember.user,
    team: teamMember.team,
  });

  recordMetric('webhook.updated');

  res.status(200).json({ data: result.data });
};
