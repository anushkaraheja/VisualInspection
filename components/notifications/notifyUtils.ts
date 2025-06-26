import { NotificationProps } from './types';
import { useNotification } from './NotificationContext';

// Helper function to create consistent notification interfaces
const createNotification = (
  type: NotificationProps['type'],
  props: Omit<NotificationProps, 'id' | 'type'>,
  context: ReturnType<typeof useNotification>
) => {
  // If teamSlug is provided and no duration, this is a persistent notification
  const isPersistent = !!props.teamSlug && !props.duration;

  // For persistent notifications, we might want different defaults
  const notification = {
    ...props,
    type,
    // For persistent notifications, default to no auto-dismiss
    duration: isPersistent ? 0 : props.duration || 5000,
  };

  context.addNotification(notification);
};

// Utility functions for easy usage
export const notify = {
  success: (props: Omit<NotificationProps, 'id' | 'type'>) => {
    const context = useNotification();
    createNotification('success', props, context);
  },
  error: (props: Omit<NotificationProps, 'id' | 'type'>) => {
    const context = useNotification();
    createNotification('error', props, context);
  },
  warning: (props: Omit<NotificationProps, 'id' | 'type'>) => {
    const context = useNotification();
    createNotification('warning', props, context);
  },
  info: (props: Omit<NotificationProps, 'id' | 'type'>) => {
    const context = useNotification();
    createNotification('info', props, context);
  },
  custom: (props: Omit<NotificationProps, 'id'>) => {
    const context = useNotification();
    context.addNotification(props);
  },
  // Team-specific persistent notifications
  team: {
    success: (
      props: Omit<NotificationProps, 'id' | 'type'> & { teamSlug: string }
    ) => {
      const context = useNotification();
      createNotification('success', { ...props, duration: 0 }, context);
    },
    error: (
      props: Omit<NotificationProps, 'id' | 'type'> & { teamSlug: string }
    ) => {
      const context = useNotification();
      createNotification('error', { ...props, duration: 0 }, context);
    },
    warning: (
      props: Omit<NotificationProps, 'id' | 'type'> & { teamSlug: string }
    ) => {
      const context = useNotification();
      createNotification('warning', { ...props, duration: 0 }, context);
    },
    info: (
      props: Omit<NotificationProps, 'id' | 'type'> & { teamSlug: string }
    ) => {
      const context = useNotification();
      createNotification('info', { ...props, duration: 0 }, context);
    },
  },
};
