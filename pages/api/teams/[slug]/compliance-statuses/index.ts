import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Team slug is required' });
  }

  const session = await throwIfNoTeamAccess(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get team
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      complianceStatuses: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  // GET request - list all statuses for the team
  if (req.method === 'GET') {
    return res.status(200).json({
      statuses: team.complianceStatuses,
    });
  }

  // POST request - create a new status
  if (req.method === 'POST') {
    try {
      const { name, code, description, color, icon, order, isDefault } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: 'Name and code are required' });
      }

      // Format the code to be uppercase with no spaces
      const formattedCode = code.toUpperCase().replace(/\s+/g, '_');

      // Check if a status with this code already exists for this team
      const existingStatus = await prisma.teamComplianceStatus.findFirst({
        where: {
          teamId: team.id,
          code: formattedCode,
        },
      });

      if (existingStatus) {
        return res.status(400).json({ message: 'A status with this code already exists' });
      }

      // If this is set as the default, unset any existing defaults
      if (isDefault) {
        await prisma.teamComplianceStatus.updateMany({
          where: {
            teamId: team.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create the new status
      const newStatus = await prisma.teamComplianceStatus.create({
        data: {
          name,
          code: formattedCode,
          description,
          color,
          icon,
          order: order || 0,
          isDefault: isDefault || false,
          teamId: team.id,
        },
      });

      return res.status(201).json(newStatus);
    } catch (error) {
      console.error('Error creating compliance status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
