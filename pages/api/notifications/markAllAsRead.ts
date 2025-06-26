import { NextApiRequest, NextApiResponse } from 'next';
import { markAllNotificationsAsReadBySlug } from '@/components/notifications/db';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { teamSlug } = req.body;
    const userId = session.user.id;

    if (!teamSlug) {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    try {
      await markAllNotificationsAsReadBySlug(teamSlug, userId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res
        .status(500)
        .json({ message: 'Failed to mark all notifications as read' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
