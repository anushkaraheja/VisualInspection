import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';

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
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}

// Get team PPE items
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;

  try {
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

    // Get all PPE items for the team
    const teamPPEItems = await prisma.teamPPEItem.findMany({
      where: { teamId: team.id },
      include: { ppeItem: true },
    });

    return res.status(200).json({
      success: true,
      data: teamPPEItems,
    });
  } catch (error: any) {
    console.error('Error fetching team PPE items:', error);
    throw error;
  }
};
