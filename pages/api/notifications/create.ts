import { NextApiRequest, NextApiResponse } from 'next';
import { saveNotificationToDB } from '@/components/notifications/db';
import { NotificationProps } from '@/components/notifications/types';
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
    try {
      const notification = req.body as Omit<NotificationProps, 'id'> & {
        teamSlug: string;
      };
      const result = await saveNotificationToDB(notification);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Failed to create notification' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
