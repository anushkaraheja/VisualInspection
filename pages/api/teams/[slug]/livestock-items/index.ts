import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { getSession } from '@/lib/session';

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

// Get team livestock items
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;
  
  try {
    await getSession(req, res);
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res
        .status(400)
        .json({ error: { message: 'Team slug is required' } });
    }

    // Authenticate and authorize
    try {
      await throwIfNoTeamAccess(req, res);
    } catch (authError: any) {
      return res.status(authError.status || 401).json({
        error: { message: authError.message || 'Authentication failed' },
      });
    }

    // Get team by slug
    const team = await prisma.team.findUnique({
      where: { slug },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Get all livestock with team-specific active status
    const teamLivestockItems = await prisma.livestock.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        teamItems: {
          where: {
            teamId: team.id,
          },
          select: {
            active: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to format expected by UI
    const formattedItems = teamLivestockItems.map(item => ({
      id: item.id,
      name: item.name,
      icon: item.icon || '',
      description: item.description,
      active: item.teamItems.length > 0 ? item.teamItems[0].active : false,
    }));

    return res.status(200).json({
      success: true,
      data: formattedItems,
    });
  } catch (error) {
    console.error('Error fetching team livestock items:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch team livestock items',
      },
    });
  }
};
