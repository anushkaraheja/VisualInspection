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
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    console.error('Error in API handler:', error);
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({
      error: {
        message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      },
    });
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}

// Update team livestock items
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res
      .status(400)
      .json({ error: { message: 'Items array is required' } });
  }

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

    // Process each item in the array
    for (const item of items) {
      const { livestockId, active } = item;

      if (active) {
        // Create or update the team livestock item
        await prisma.teamLivestockItem.upsert({
          where: {
            teamId_livestockId: {
              teamId: team.id,
              livestockId: livestockId,
            },
          },
          update: {
            active: true,
          },
          create: {
            teamId: team.id,
            livestockId: livestockId,
            active: true,
          },
        });
      } else {
        // Check if the record exists and update it to inactive
        const existingRecord = await prisma.teamLivestockItem.findUnique({
          where: {
            teamId_livestockId: {
              teamId: team.id,
              livestockId: livestockId,
            },
          },
        });

        if (existingRecord) {
          await prisma.teamLivestockItem.update({
            where: {
              teamId_livestockId: {
                teamId: team.id,
                livestockId: livestockId,
              },
            },
            data: {
              active: false,
            },
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Team livestock items updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating team livestock items:', error);
    throw error;
  }
};
