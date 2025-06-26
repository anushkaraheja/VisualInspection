import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed, getCurrentUser } from 'models/user';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get licenses
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LICENSE', 'read');

  const licenses = await prisma.license.findMany({
    where: {
      team: {
        id: teamMember.teamId as string,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(200).json({ data: licenses });
};

// Create a license **NOT TO BE USED**
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LICENSE', 'create');

  const { slug } = req.query;
  const {
    name,
    description,
    price,
    type,
    renewalPeriod,
    features,
    maxUsers,
    maxLocations,
    metadata,
  } = req.body;

  // Basic validation
  if (!name || !type || !price || !renewalPeriod) {
    const error: any = new Error('Missing required fields');
    error.status = 400;
    throw error;
  }

  const team = await prisma.team.findUnique({
    where: { slug: slug as string },
  });

  if (!team) {
    const error: any = new Error('Team not found');
    error.status = 404;
    throw error;
  }

  const license = await prisma.license.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      type,
      renewalPeriod,
      features: features || [],
      maxUsers,
      maxLocations,
      metadata: metadata || {},
      teamId: team.id,
      vmIPAddress: '', //not creating licenses here in saas
    },
  });

  res.status(200).json({ data: license });
};
