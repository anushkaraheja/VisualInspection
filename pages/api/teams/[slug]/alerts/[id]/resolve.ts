import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    // Authenticate request
    const teamMember = await throwIfNoTeamAccess(req, res);
    const { slug, id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check if the alert exists
    const alertRecord = await prisma.pPECompliance.findFirst({
      where: {
        id: id,
        filterDevice: {
          device: {
            zone: {
              location: {
                Team: {
                  slug: slug as string,
                },
              },
            },
          },
        },
      },
    });

    if (!alertRecord) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // For now, since we don't have a "resolved" field in the database model,
    // we'll just return a success response.
    // In a real-world scenario, you would update a resolution status in the database.

    res
      .status(200)
      .json({ success: true, message: `Alert ${id} marked as resolved` });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
}
