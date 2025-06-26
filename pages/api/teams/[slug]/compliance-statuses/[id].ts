import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug, id } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Team slug is required' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Status ID is required' });
  }

  const session = await throwIfNoTeamAccess(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get team
  const team = await prisma.team.findUnique({
    where: { slug },
  });

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  // GET request - get a specific status
  if (req.method === 'GET') {
    const status = await prisma.teamComplianceStatus.findFirst({
      where: {
        id,
        teamId: team.id,
      },
    });

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    return res.status(200).json(status);
  }

  // PUT request - update a status
  if (req.method === 'PUT') {
    try {
      const { name, description, color, icon, order, isDefault } = req.body;

      // Find the status to ensure it belongs to this team
      const existingStatus = await prisma.teamComplianceStatus.findFirst({
        where: {
          id,
          teamId: team.id,
        },
      });

      if (!existingStatus) {
        return res.status(404).json({ message: 'Status not found' });
      }

      // If this is set as the default, unset any existing defaults
      if (isDefault) {
        await prisma.teamComplianceStatus.updateMany({
          where: {
            teamId: team.id,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update the status
      const updatedStatus = await prisma.teamComplianceStatus.update({
        where: { id },
        data: {
          name,
          description,
          color,
          icon,
          order,
          isDefault: isDefault || false,
        },
      });

      return res.status(200).json(updatedStatus);
    } catch (error) {
      console.error('Error updating compliance status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE request - delete a status
  if (req.method === 'DELETE') {
    try {
      // Find the status to ensure it belongs to this team
      const existingStatus = await prisma.teamComplianceStatus.findFirst({
        where: {
          id,
          teamId: team.id,
        },
      });

      if (!existingStatus) {
        return res.status(404).json({ message: 'Status not found' });
      }

      // Check if this is the default status
      if (existingStatus.isDefault) {
        return res.status(400).json({ message: 'Cannot delete the default status' });
      }

      // Check if this status is being used
      const usageCount = await prisma.pPECompliance.count({
        where: {
          statusId: id,
        },
      });

      if (usageCount > 0) {
        return res.status(400).json({ 
          message: 'Status is in use and cannot be deleted',
          usageCount 
        });
      }

      // Delete the status
      await prisma.teamComplianceStatus.delete({
        where: { id },
      });

      return res.status(204).send(null);
    } catch (error) {
      console.error('Error deleting compliance status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
