import type { NextApiRequest, NextApiResponse } from 'next';
import { DeviceType, PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

// Create a single PrismaClient instance
const prisma = new PrismaClient();

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
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    console.error('Error in API handler:', error);
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({
      error: { message },
    });
  }
}

// Get devices with pagination and filtering
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;

  // Parse query parameters
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 8;
  const locationId = req.query.id as string;
  const zoneId = req.query.zoneId as string;

  try {
    // Check if this is a multi-zone or multi-location request
    // If locationId is 'All' or zoneId is 'All', redirect to all-devices endpoint
    if (locationId === 'All' || zoneId === 'All') {
      return res.status(400).json({
        error: {
          message:
            'For multi-zone or multi-location requests, use the all-devices endpoint',
          redirectTo: `/api/teams/${slug}/all-devices`,
        },
      });
    }

    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res
        .status(400)
        .json({ error: { message: 'Team slug is required' } });
    }

    // Wrap authentication in try/catch to handle potential null payload errors
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      if (teamMember) {
        throwIfNotAllowed(teamMember, 'LOCATION', 'read');
      } else {
        return res
          .status(401)
          .json({ error: { message: 'Authentication failed' } });
      }
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return res.status(401).json({
        error: { message: authError?.message || 'Authentication failed' },
      });
    }

    // Get the team ID from the slug
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Verify that the zone exists and belongs to the specified location
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        locationId: locationId,
        location: {
          Team: { slug },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({
        error: {
          message:
            'Zone not found or does not belong to the specified location',
        },
      });
    }

    // Use a simplified approach for the where clause
    // For specific zone endpoint, we always filter by the specific zone and camera device type
    const whereClause = {
      deviceType: DeviceType.CAMERA,
      zoneId: zoneId,
    };

    try {
      // Get total count for pagination
      const totalCount = await prisma.device.count({
        where: whereClause,
      });

      // Get paginated devices
      const devices = await prisma.device.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          status: true,
          ipAddress: true,
          config: true,
          serialNumber: true,
          model: true,
          manufacturer: true,
          firmwareVersion: true,
          macAddress: true,
          deviceType: true,
          ppeItems: true,
          createdAt: true,
          updatedAt: true,
          zoneId: true,
          zone: {
            select: {
              id: true,
              name: true,
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / pageSize);


      return res.status(200).json({
        data: devices,
        meta: {
          totalCount,
          currentPage: page,
          pageSize,
          totalPages,
        },
      });
    } catch (dbError: any) {
      // Handle null/undefined dbError properly
      console.error(
        'Database query error:',
        dbError ? dbError.message : 'Unknown database error'
      );
      return res.status(500).json({
        error: {
          message: 'Database query failed',
          details:
            dbError && dbError.message
              ? dbError.message
              : 'Unknown database error',
        },
      });
    }
  } catch (error: any) {
    // Better error handling for general errors
    console.error(
      'Unexpected error in handleGET:',
      error ? error.message : 'Unknown error'
    );
    return res.status(500).json({
      error: {
        message: 'Server error handling the request',
        details: error && error.message ? error.message : 'Unknown error',
      },
    });
  }
};

// Handle POST request to create a new device
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;
  const { name, ipAddress, zoneId, config, ppeItems, deviceType, status } =
    req.body;

  try {
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res
        .status(400)
        .json({ error: { message: 'Team slug is required' } });
    }

    // Validate required fields
    if (!name) {
      return res
        .status(400)
        .json({ error: { message: 'Device name is required' } });
    }

    if (!ipAddress) {
      return res
        .status(400)
        .json({ error: { message: 'IP address is required' } });
    }

    if (!zoneId) {
      return res
        .status(400)
        .json({ error: { message: 'Zone ID is required' } });
    }
    if (!ppeItems) {
      return res
        .status(400)
        .json({ error: { message: 'Select atleast one PPE' } });
    }

    // Check authentication and authorization
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, 'LOCATION', 'create');
    } catch (authError: any) {
      console.error('Authentication/authorization error:', authError);
      return res.status(authError.status || 401).json({
        error: { message: authError.message || 'Authentication failed' },
      });
    }

    // Get the team ID from the slug
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Verify that the zone belongs to the team
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        location: {
          select: {
            teamId: true,
          },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: { message: 'Zone not found' } });
    }

    if (zone.location.teamId !== team.id) {
      return res.status(400).json({
        error: { message: 'Zone does not belong to this team' },
      });
    }

    // Create new device
    const newDevice = await prisma.device.create({
      data: {
        name,
        ipAddress,
        deviceType,
        status,
        config: config || {},
        zoneId,
        ppeItems: ppeItems || [],
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ data: newDevice });
  } catch (error: any) {
    // Safely log error without stringifying
    console.error(
      'Error in handlePOST:',
      error ? error.message : 'Unknown error'
    );

    // Prepare a safe error response
    const errorMessage =
      error && error.message ? error.message : 'Unknown server error';

    return res.status(500).json({
      error: {
        message: 'Server error creating device',
        details: errorMessage,
      },
    });
  }
};
