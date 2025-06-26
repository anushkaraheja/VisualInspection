import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: { message: 'Invalid team slug' } });
  }

  try {
    // Find the team
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true, useVendors: true }
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Handle GET request - return current settings
    if (req.method === 'GET') {
      return res.status(200).json({ useVendors: team.useVendors });
    }

    // Handle PUT request - update settings
    if (req.method === 'PUT') {
      const { useVendors } = req.body;
      
      if (typeof useVendors !== 'boolean') {
        return res.status(400).json({ error: { message: 'Invalid useVendors value' } });
      }

      const updatedTeam = await prisma.team.update({
        where: { slug },
        data: { useVendors },
        select: { useVendors: true }
      });

      return res.status(200).json(updatedTeam);
    }

    // Method not allowed
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('Error handling vendor settings:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
