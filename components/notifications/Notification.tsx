import React, { useEffect } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';
import { NotificationPosition, NotificationProps } from './types';
import { useNotification } from './NotificationContext';

// Get tailwind class based on notification type
const getNotificationTypeClasses = (
  type: NotificationProps['type'],
  isRead: boolean = false
) => {
  if (isRead) {
    return 'border border-gray-200 dark:border-gray-700';
  }

  switch (type) {
    case 'success':
      return 'border border-green-500 dark:border-green-400';
    case 'error':
      return 'border border-red-500 dark:border-red-400';
    case 'warning':
      return 'border border-yellow-500 dark:border-yellow-400';
    case 'info':
      return 'border border-blue-500 dark:border-blue-400';
    default:
      return 'border border-gray-200 dark:border-gray-700';
  }
};

// Notification Component
export const Notification: React.FC<
  NotificationProps & { onRemove: () => void }
> = ({
  id,
  type,
  message,
  title,
  duration = 5000,
  action,
  onRemove,
  isRead,
}) => {
  useEffect(() => {
    if (duration !== 0) {
      const timer = setTimeout(() => {
        onRemove();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [duration, onRemove]);

  // Icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <FaCheckCircle
            className="text-green-500 dark:text-green-400"
            size={18}
          />
        );
      case 'error':
        return (
          <FaExclamationCircle
            className="text-red-500 dark:text-red-400"
            size={18}
          />
        );
      case 'warning':
        return (
          <FaExclamationTriangle
            className="text-yellow-500 dark:text-yellow-400"
            size={18}
          />
        );
      case 'info':
        return (
          <FaInfoCircle
            className="text-blue-500 dark:text-blue-400"
            size={18}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        flex items-start p-3 mb-2.5 rounded shadow-md
        bg-white dark:bg-surfaceColor
        ${getNotificationTypeClasses(type, isRead)}
        w-full max-w-sm
        transition-all duration-300
        animate-fadeIn
        ${isRead ? 'opacity-70' : 'opacity-100'}
        dark:shadow-gray-900/30
      `}
    >
      <div className="mr-3">{getIcon()}</div>
      <div className="flex-1">
        {title && (
          <div className="font-bold mb-1 text-gray-800 dark:text-textColor">
            {title}
          </div>
        )}
        <div className="text-sm text-gray-700 dark:text-textColor">
          {message}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 py-1 px-2 bg-transparent border-none cursor-pointer text-blue-600 dark:text-blue-400 text-sm font-bold"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={onRemove}
        className="bg-transparent border-none cursor-pointer text-base opacity-60 p-1 text-gray-600 dark:text-gray-400 hover:opacity-100"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

// Container for notifications
export const NotificationContainer: React.FC = () => {
  const { state, removeNotification, markAsRead } = useNotification();
  const { notifications, dbNotifications } = state;

  // Get current user (in a real app, you would get this from your auth context)
  const getCurrentUserId = () => {
    // Placeholder, replace with actual user ID retrieval
    return localStorage.getItem('userId') || 'default-user-id';
  };

  // Convert DB notifications to props format
  const dbNotificationsProps: NotificationProps[] = dbNotifications.map(
    (notification) => ({
      id: notification.id,
      type: notification.type as NotificationProps['type'],
      message: notification.message,
      title: notification.title || undefined,
      teamId: notification.teamId,
      isGlobal: notification.isGlobal,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      duration: 0, // Persistent notifications don't auto-dismiss
    })
  );

  // Combine ephemeral and DB notifications
  const allNotifications = [...notifications, ...dbNotificationsProps];

  // Group notifications by position
  const groupedNotifications: Record<
    NotificationPosition,
    NotificationProps[]
  > = {
    'top-right': [],
    'top-left': [],
    'bottom-right': [],
    'bottom-left': [],
    'top-center': [],
    'bottom-center': [],
  };

  allNotifications.forEach((notification) => {
    const position = notification.position || 'top-right';
    groupedNotifications[position].push(notification);
  });

  // Position classes for different positions
  const getPositionClasses = (position: NotificationPosition): string => {
    switch (position) {
      case 'top-right':
        return 'top-5 right-5';
      case 'top-left':
        return 'top-5 left-5';
      case 'bottom-right':
        return 'bottom-5 right-5';
      case 'bottom-left':
        return 'bottom-5 left-5';
      case 'top-center':
        return 'top-5 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-5 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <>
      {Object.entries(groupedNotifications).map(
        ([position, notifications]) =>
          notifications.length > 0 && (
            <div
              key={position}
              className={`fixed flex flex-col z-50 ${getPositionClasses(position as NotificationPosition)}`}
            >
              {notifications.map((notification) => (
                <Notification
                  key={notification.id}
                  {...notification}
                  onRemove={() => {
                    // For DB notifications, mark as read; for ephemeral, just remove
                    if (notification.teamSlug) {
                      markAsRead(notification.id, getCurrentUserId());
                    } else {
                      removeNotification(notification.id);
                    }
                  }}
                />
              ))}
            </div>
          )
      )}
    </>
  );
};

// DB Notification List Component
export const NotificationList: React.FC<{
  teamId: string;
  onMarkAllRead: () => void;
}> = ({ teamId, onMarkAllRead }) => {
  const { state, markAsRead } = useNotification();
  const { dbNotifications } = state;

  const getCurrentUserId = () => {
    // Placeholder, replace with actual user ID retrieval
    return localStorage.getItem('userId') || 'default-user-id';
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId, getCurrentUserId());
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-surfaceColor rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-borderColor">
        <h2 className="text-lg font-semibold m-0 text-gray-800 dark:text-textColor">
          Notifications
        </h2>
        <button
          onClick={onMarkAllRead}
          className="bg-transparent border-none text-blue-600 dark:text-blue-400 cursor-pointer text-sm"
        >
          Mark all as read
        </button>
      </div>

      {dbNotifications.length === 0 ? (
        <div className="p-5 text-center text-gray-500 dark:text-gray-400">
          No notifications
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {dbNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                flex p-3 border-b border-gray-200 dark:border-borderColor cursor-pointer relative 
                transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
                ${notification.isRead ? 'opacity-70' : ''}
                ${
                  !notification.isRead
                    ? `bg-white dark:bg-surfaceColor ${getNotificationTypeClasses(notification.type as NotificationProps['type'], false)}`
                    : 'bg-white dark:bg-surfaceColor'
                }
              `}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="mr-3 flex items-center">
                {notification.type === 'success' && (
                  <FaCheckCircle
                    className="text-green-500 dark:text-green-400"
                    size={18}
                  />
                )}
                {notification.type === 'error' && (
                  <FaExclamationCircle
                    className="text-red-500 dark:text-red-400"
                    size={18}
                  />
                )}
                {notification.type === 'warning' && (
                  <FaExclamationTriangle
                    className="text-yellow-500 dark:text-yellow-400"
                    size={18}
                  />
                )}
                {notification.type === 'info' && (
                  <FaInfoCircle
                    className="text-blue-500 dark:text-blue-400"
                    size={18}
                  />
                )}
              </div>
              <div className="flex-1">
                {notification.title && (
                  <div className="font-bold mb-1 text-gray-800 dark:text-textColor">
                    {notification.title}
                  </div>
                )}
                <div className="text-sm text-gray-700 dark:text-textColor mb-1">
                  {notification.message}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              {!notification.isRead && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
