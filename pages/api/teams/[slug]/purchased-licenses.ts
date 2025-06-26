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

// Get purchased licenses with additional includes
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LICENSE', 'read');

  const purchasedLicenses = await prisma.purchasedLicense.findMany({
    where: {
      teamId: teamMember.teamId as string,
    },
    include: {
      License: true,
      userLicense: true,
      locationLicense: true, // Make sure this is included
    },
    orderBy: {
      purchasedAt: 'desc',
    },
  });

  res.status(200).json({ data: purchasedLicenses });
};
