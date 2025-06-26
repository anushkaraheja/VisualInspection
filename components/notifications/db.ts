import { PrismaClient } from '@prisma/client';
import { DBNotification, NotificationProps } from './types';

const prisma = new PrismaClient();

// Updated to use teamSlug instead of teamId
export const saveNotificationToDB = async (
  notification: Omit<NotificationProps, 'id'> & { teamSlug: string }
) => {
  try {
    const {
      type,
      message,
      title,
      teamSlug,
      isGlobal = false,
      expiresAt,
      metadata,
    } = notification;

    // Find the team by slug
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    });

    if (!team) {
      throw new Error(`Team with slug "${teamSlug}" not found`);
    }

    const savedNotification = await prisma.notification.create({
      data: {
        type,
        message,
        title,
        teamId: team.id,
        isGlobal,
        expiresAt,
        metadata: metadata || {},
      },
    });

    return savedNotification;
  } catch (error) {
    console.error('Failed to save notification to database:', error);
    throw error;
  }
};

// Get team notifications by slug instead of ID
export const getTeamNotificationsBySlug = async (
  teamSlug: string
): Promise<DBNotification[]> => {
  try {
    // Find team by slug
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    });

    if (!team) {
      console.error(`Team with slug "${teamSlug}" not found`);
      return [];
    }

    const teamId = team.id;

    // First, get the notifications without filtering by read status
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ teamId }, { isGlobal: true }],
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all notification reads for this team's notifications by the current user
    const notificationReads = await prisma.notificationRead.findMany({
      where: {
        notification: {
          OR: [{ teamId }, { isGlobal: true }],
        },
        user: {
          TeamMember: {
            some: {
              teamId,
            },
          },
        },
      },
      select: {
        notificationId: true,
      },
    });

    // Create a set of read notification IDs for faster lookup
    const readNotificationIds = new Set(
      notificationReads.map((nr) => nr.notificationId)
    );

    // Transform the notifications to include isRead property and explicit type casting for status
    return notifications.map((notification) => ({
      ...notification,
      isRead: readNotificationIds.has(notification.id),
      metadata: notification.metadata as Record<string, any>,
      status: notification.status,
    }));
  } catch (error) {
    console.error('Failed to fetch team notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  try {
    // Check if already read
    const existing = await prisma.notificationRead.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });

    if (!existing) {
      await prisma.notificationRead.create({
        data: {
          notificationId,
          userId,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (
  teamId: string,
  userId: string
) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    // Create read entries for all notifications
    await Promise.all(
      notifications.map((notification) =>
        prisma.notificationRead.upsert({
          where: {
            notificationId_userId: {
              notificationId: notification.id,
              userId,
            },
          },
          update: {},
          create: {
            notificationId: notification.id,
            userId,
          },
        })
      )
    );

    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
};

// Mark all notifications as read by team slug
export const markAllNotificationsAsReadBySlug = async (
  teamSlug: string,
  userId: string
) => {
  try {
    // Find team by slug
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    });

    if (!team) {
      throw new Error(`Team with slug "${teamSlug}" not found`);
    }

    const teamId = team.id;

    const notifications = await prisma.notification.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    // Create read entries for all notifications
    await Promise.all(
      notifications.map((notification) =>
        prisma.notificationRead.upsert({
          where: {
            notificationId_userId: {
              notificationId: notification.id,
              userId,
            },
          },
          update: {},
          create: {
            notificationId: notification.id,
            userId,
          },
        })
      )
    );

    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
};

export const archiveNotification = async (notificationId: string) => {
  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to archive notification:', error);
    return false;
  }
};
