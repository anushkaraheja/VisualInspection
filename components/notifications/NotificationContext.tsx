import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import {
  NotificationProps,
  NotificationState,
  NotificationAction,
} from './types';
import { NotificationContainer } from './Notification';

// Initial state
const initialState: NotificationState = {
  notifications: [],
  dbNotifications: [],
};

// Context
const NotificationContext = createContext<
  | {
      state: NotificationState;
      addNotification: (notification: Omit<NotificationProps, 'id'>) => void;
      removeNotification: (id: string) => void;
      fetchTeamNotifications: (teamSlug: string) => Promise<void>;
      markAsRead: (notificationId: string, userId: string) => Promise<void>;
      markAllAsRead: (teamSlug: string, userId: string) => Promise<void>;
    }
  | undefined
>(undefined);

// Reducer
const notificationReducer = (
  state: NotificationState,
  action: NotificationAction
): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    case 'SET_DB_NOTIFICATIONS':
      return {
        ...state,
        dbNotifications: action.payload,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        dbNotifications: state.dbNotifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        dbNotifications: state.dbNotifications.map((notification) =>
          notification.teamId === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
      };
    default:
      return state;
  }
};

// Provider
export const NotificationProvider: React.FC<{
  children: ReactNode;
  teamSlug?: string;
}> = ({ children, teamSlug }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Fetch team notifications on mount if teamSlug is provided
  useEffect(() => {
    if (teamSlug) {
      fetchTeamNotifications(teamSlug);
    }
  }, [teamSlug]);

  // Add a temporary notification (ephemeral, not stored in DB)
  const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id, ...notification },
    });

    // If notification should be persistent and has teamSlug, save to DB via API
    if (notification.teamSlug && !notification.duration) {
      // Save notification using API endpoint instead of direct DB access
      fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })
        .then(() => {
          if (notification.teamSlug) {
            fetchTeamNotifications(notification.teamSlug);
          }
        })
        .catch((error) => {
          console.error('Failed to save notification:', error);
        });
    }
  };

  const removeNotification = (id: string) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: id,
    });
  };

  const fetchTeamNotifications = async (teamSlug: string) => {
    try {
      // Use API endpoint instead of direct DB access
      const response = await fetch(`/api/notifications?teamSlug=${teamSlug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const notifications = await response.json();
      dispatch({
        type: 'SET_DB_NOTIFICATIONS',
        payload: notifications,
      });
    } catch (error) {
      console.error('Failed to fetch team notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string, userId: string) => {
    try {
      // Use API endpoint instead of direct DB access
      const response = await fetch('/api/notifications/markAsRead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      dispatch({
        type: 'MARK_AS_READ',
        payload: notificationId,
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async (teamSlug: string, userId: string) => {
    try {
      // Use API endpoint instead of direct DB access
      const response = await fetch('/api/notifications/markAllAsRead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamSlug }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      dispatch({
        type: 'MARK_ALL_AS_READ',
        payload: teamSlug,
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        removeNotification,
        fetchTeamNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Hook for consuming the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
