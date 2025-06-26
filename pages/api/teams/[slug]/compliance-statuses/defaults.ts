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

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get team
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
        complianceStatuses: true,
      },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const { statuses } = req.body;

    if (!Array.isArray(statuses) || statuses.length === 0) {
      return res.status(400).json({ message: 'Valid statuses array is required' });
    }

    // Check if any statuses already exist
    if (team.complianceStatuses.length > 0) {
      return res.status(409).json({ 
        message: 'Team already has statuses defined' 
      });
    }

    // Find which status should be the default (only one can be default)
    const defaultStatusIndex = statuses.findIndex(status => status.isDefault);
    
    // Process statuses for creation
    const statusesForCreation = statuses.map((status, index) => ({
      name: status.name,
      code: status.code.toUpperCase().replace(/\s+/g, '_'),
      description: status.description || null,
      color: status.color || null,
      icon: status.icon || null,
      order: status.order !== undefined ? status.order : index,
      isDefault: index === defaultStatusIndex, // Only one can be default
      teamId: team.id,
    }));

    // Create all statuses in a transaction
    const createdStatuses = await prisma.$transaction(
      statusesForCreation.map(status => 
        prisma.teamComplianceStatus.create({
          data: status
        })
      )
    );

    return res.status(201).json({
      message: 'Default statuses created successfully',
      statuses: createdStatuses
    });
  } catch (error) {
    console.error('Error creating default statuses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
