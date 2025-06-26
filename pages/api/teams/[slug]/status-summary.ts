import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, 'LOCATION', 'read');

      const totalCameras = await prisma.device.count({
        where: {
          deviceType: 'CAMERA',
          zone: {
            location: {
              teamId: teamMember.teamId,
            },
          },
        },
      });

      const onlineCameras = await prisma.device.count({
        where: {
          deviceType: 'CAMERA',
          status: 'ONLINE',
          zone: {
            location: {
              teamId: teamMember.teamId,
            },
          },
        },
      });

      // Count all zones for this team
      const zoneCount = await prisma.zone.count({
        where: {
          location: {
            teamId: teamMember.teamId,
          },
        },
      });

      res.status(200).json({
        cameras: {
          total: totalCameras,
          online: onlineCameras,
          offline: totalCameras - onlineCameras,
        },
        zones: zoneCount,
      });
    } catch (error) {
      console.error('Error fetching device status summary:', error);
      res.status(500).json({ error: 'Failed to fetch status summary' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
