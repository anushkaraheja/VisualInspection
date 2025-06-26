import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
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
      default:
        res.setHeader('Allow', 'GET');
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

// Get license details including location assignments
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LICENSE', 'read');

  const { id } = req.query;

  if (!id) {
    const error: any = new Error('License ID is required');
    error.status = 400;
    throw error;
  }

  // Fetch the purchased license with all its relationships
  const purchasedLicense = await prisma.purchasedLicense.findUnique({
    where: {
      id: id as string,
    },
    include: {
      License: true,
      userLicense: true,
      locationLicense: {
        include: {
          location: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              addressL1: true,
              addressL2: true,
              zip: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!purchasedLicense) {
    const error: any = new Error('License not found');
    error.status = 404;
    throw error;
  }

  // Check if the license belongs to the team
  if (purchasedLicense.teamId !== teamMember.teamId) {
    const error: any = new Error('Unauthorized access to license');
    error.status = 403;
    throw error;
  }

  res.status(200).json({ data: purchasedLicense });
};
