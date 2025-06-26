import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    // Validate and authorize access
    const teamMember = await throwIfNoTeamAccess(req, res);
    const slug = req.query.slug as string;
    
    // Process date parameter
    const dateParam = req.query.date as string;
    let filterDate: Date | undefined;
    
    if (dateParam) {
      filterDate = new Date(dateParam);
      
      // Check if date is valid
      if (isNaN(filterDate.getTime())) {
        return res.status(400).json({ error: { message: 'Invalid date format' } });
      }
    }

    // Get team info
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Prepare date filter for compliance records
    const dateFilter = filterDate 
      ? {
          timestamp: {
            gte: new Date(filterDate.setHours(0, 0, 0, 0)),
            lt: new Date(filterDate.setHours(23, 59, 59, 999)),
          }
        } 
      : {};

    // Count all compliance records for this team following the relationship:
    // team -> location -> zone -> device -> filterDevice -> PPECompliance
    const complianceCount = await prisma.pPECompliance.count({
      where: {
        ...dateFilter,
        filterDevice: {
          device: {
            zone: {
              location: {
                teamId: team.id,
              },
            },
          },
        },
      },
    });

    // Return the compliance count
    return res.status(200).json({ count: complianceCount || 0 });
  } catch (error) {
    console.error('Error fetching compliance count:', error);
    return res
      .status(500)
      .json({ error: { message: 'Internal server error' } });
  } finally {
    await prisma.$disconnect();
  }
}
