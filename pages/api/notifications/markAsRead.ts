import { NextApiRequest, NextApiResponse } from 'next';
import { markNotificationAsRead } from '@/components/notifications/db';
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
    const { notificationId } = req.body;
    const userId = session.user.id;

    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    try {
      await markNotificationAsRead(notificationId, userId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res
        .status(500)
        .json({ message: 'Failed to mark notification as read' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
