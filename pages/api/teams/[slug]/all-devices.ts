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
      default:
        res.setHeader('Allow', ['GET']);
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

// Get all team devices with pagination and filtering by location and zone names
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;

  // Parse query parameters
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 8;
  const location = req.query.location as string;
  const zone = req.query.zone as string;


  try {
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res
        .status(400)
        .json({ error: { message: 'Team slug is required' } });
    }

    // Authentication and authorization check
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

    // Start with the base query - always filter by CAMERA device type and team slug
    // Fix the casing issue - Use lowercase "team" to match the Prisma schema
    let whereClause: any = {
      deviceType: DeviceType.CAMERA,
      zone: {
        location: {
          Team: { slug },
        },
      },
    };

    // Apply location filter if specified and not 'All'
    if (location && location !== 'All') {
      whereClause.zone.location.name = location;
    }

    // Apply zone filter if specified and not 'All'
    if (zone && zone !== 'All') {
      whereClause.zone.name = zone;
    }

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
