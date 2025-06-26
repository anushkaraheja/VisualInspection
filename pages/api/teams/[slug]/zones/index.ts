import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
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

// Get all zones across all team locations with their location details
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'read');

  const { slug } = req.query;

  try {
    // Get team ID from slug
    const team = await prisma.team.findFirst({
      where: { slug: slug as string },
      select: { id: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Get all locations for the team
    const locations = await prisma.location.findMany({
      where: { teamId: team.id },
      select: {
        id: true,
        name: true,
        Zone: {
          include: {
            _count: {
              select: {
                devices: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to include location information with each zone
    const allZones = locations.flatMap((location) =>
      location.Zone.map((zone) => ({
        ...zone,
        locationId: location.id,
        locationName: location.name,
        deviceCount: zone._count.devices,
      }))
    );

    res.status(200).json({
      data: allZones,
      meta: {
        totalCount: allZones.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all zones:', error);
    res.status(500).json({ error: { message: 'Failed to fetch zones' } });
  }
};
