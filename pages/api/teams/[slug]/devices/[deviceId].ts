import { NextApiRequest, NextApiResponse } from 'next';
import { DeviceType, PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authenticated session
    const session = await getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { slug } = req.query;
    const deviceId = req.query.deviceId as string;

    if (!slug) {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    // Find the team by slug
    const team = await prisma.team.findUnique({
      where: { slug: slug as string },
      include: {
        TenantType: true, // Include tenant type information
      },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get tenant type name
    const tenantTypeName = team.TenantType?.name || null;
    const isPPETenant = tenantTypeName === 'PPE';

    // Check if the user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return res.status(403).json({ message: 'Forbidden: Not a team member' });
    }

    // Build include object based on tenant type
    const includeObj: any = {
      zone: {
        include: {
          location: true,
        },
      },
    };

    // Only include PPE items if the tenant type is PPE
    if (isPPETenant) {
      includeObj.ppeItems = {
        include: {
          teamPPEItem: {
            include: {
              ppeItem: true,
            },
          },
        },
      };
    }

    // Get the device details with conditional includes
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        zone: {
          location: {
            teamId: team.id,
          },
        },
      },
      include: includeObj,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }


    // Format the response to send to the client
    const formattedDevice = {
      ...device,
      // Only include ppeItems if this is a PPE tenant
      ...(isPPETenant ? {} : { ppeItems: undefined }),
    };

    return res.status(200).json({
      success: true,
      device: formattedDevice,
      tenantType: tenantTypeName,
    });
  } catch (error: any) {
    console.error('Error fetching device:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
}
