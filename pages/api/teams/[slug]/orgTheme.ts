import { ApiError } from '@/lib/errors';
import {
  getOrgTheme,
  updateOrgColors,
  updateOrgLogo,
  getOrgLogo,
} from 'models/orgTheme';
import { getCurrentUserWithTeam } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get theme or logo for the current team
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);
  throwIfNotAllowed(user, 'TEAM', 'read');

  const { slug, element } = req.query;
  if (!slug) {
    throw new ApiError(400, 'Team slug is required');
  }

  if (element === 'logo') {
    const logo = await getOrgLogo(user.team.id);
    res.json({ data: logo });
  } else {
    const theme = await getOrgTheme(user.team.id);
    res.json({ data: theme });
  }
};

// Update theme for the current team
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);
  throwIfNotAllowed(user, 'TEAM', 'update');

  const { slug, element } = req.query;
  const { primaryColor, secondaryColor, logo } = req.body;
  if (!slug) {
    throw new ApiError(400, 'Team slug is required');
  }
  if (!element) {
    throw new ApiError(400, 'Element is required');
  }

  let theme;
  if (element === 'colors') {
    if (!primaryColor || !secondaryColor) {
      throw new ApiError(400, 'Colors are required');
    }
    theme = await updateOrgColors(user.team.id, primaryColor, secondaryColor);
  } else if (element === 'logo') {
    if (!logo) {
      throw new ApiError(400, 'Logo is required');
    }
    theme = await updateOrgLogo(user.team.id, logo);
  } else {
    throw new ApiError(400, 'Invalid request');
  }

  res.json({ data: theme });
};
