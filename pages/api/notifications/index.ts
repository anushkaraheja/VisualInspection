import { NextApiRequest, NextApiResponse } from 'next';
import { getTeamNotificationsBySlug } from '@/components/notifications/db';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { teamSlug } = req.query;

    if (!teamSlug || typeof teamSlug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    try {
      const notifications = await getTeamNotificationsBySlug(teamSlug);
      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
