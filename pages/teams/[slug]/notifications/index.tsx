import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/components/notifications';
import { NotificationType } from '@/components/notifications/types';
import useTeam from 'hooks/useTeam';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBell,
  FaSync,
} from 'react-icons/fa';
import { Loading } from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Notification type filter component
const NotificationTypeFilter: React.FC<{
  selectedTypes: NotificationType[];
  onChange: (types: NotificationType[]) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}> = ({ selectedTypes, onChange, onRefresh, isRefreshing }) => {
  const types: NotificationType[] = ['info', 'success', 'warning', 'error'];

  const toggleType = (type: NotificationType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2 self-center">
          Filter by type:
        </span>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
              selectedTypes.includes(type)
                ? type === 'info'
                  ? 'bg-blue-500 text-white'
                  : type === 'success'
                    ? 'bg-green-500 text-white'
                    : type === 'warning'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center p-2 text-gray-500 dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Refresh notifications"
        title="Refresh notifications"
      >
        <FaSync
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`}
        />
        <span className="sr-only">
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </span>
      </button>
    </div>
  );
};

// EmptyState component for when there are no notifications
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-4xl mb-4 text-gray-400">
      <FaBell size={48} />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      No notifications
    </h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
      When you receive notifications, they will appear here. Stay tuned for
      updates!
    </p>
  </div>
);

// Debug component for testing notifications
const DebugNotifications: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const [showDebug, setShowDebug] = useState(false);
  const { addNotification } = useNotification();

  const createNotification = (
    type: NotificationType,
    persistent: boolean = false
  ) => {
    const notification = {
      type,
      title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a test ${persistent ? 'persistent' : 'temporary'} ${type} notification created at ${new Date().toLocaleTimeString()}`,
      duration: persistent ? 0 : 5000, // 5 seconds for temporary notifications
    };

    if (persistent) {
      addNotification({
        ...notification,
        teamSlug,
      });
    } else {
      addNotification(notification);
    }
  };

  return (
    <div className="mt-10 bg-gray-50 dark:bg-surfaceColor rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Debug Tools
        </h2>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {showDebug && (
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">
              Temporary Notifications (5s)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => createNotification('success')}
                className="px-3 py-1 bg-green-500 text-white rounded-md text-sm"
              >
                Success
              </button>
              <button
                onClick={() => createNotification('info')}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
              >
                Info
              </button>
              <button
                onClick={() => createNotification('warning')}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm"
              >
                Warning
              </button>
              <button
                onClick={() => createNotification('error')}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
              >
                Error
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">
              Persistent Team Notifications
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => createNotification('success', true)}
                className="px-3 py-1 border border-green-500 text-green-500 dark:text-green-400 dark:border-green-400 rounded-md text-sm"
              >
                Success
              </button>
              <button
                onClick={() => createNotification('info', true)}
                className="px-3 py-1 border border-blue-500 text-blue-500 dark:text-blue-400 dark:border-blue-400 rounded-md text-sm"
              >
                Info
              </button>
              <button
                onClick={() => createNotification('warning', true)}
                className="px-3 py-1 border border-yellow-500 text-yellow-500 dark:text-yellow-400 dark:border-yellow-400 rounded-md text-sm"
              >
                Warning
              </button>
              <button
                onClick={() => createNotification('error', true)}
                className="px-3 py-1 border border-red-500 text-red-500 dark:text-red-400 dark:border-red-400 rounded-md text-sm"
              >
                Error
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">
              Custom Notifications
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  addNotification({
                    type: 'info',
                    title: 'Custom Action Notification',
                    message: 'This notification has a custom action button.',
                    duration: 10000,
                    position: 'bottom-right',
                    action: {
                      label: 'Click me',
                      onClick: () => alert('Action clicked!'),
                    },
                  })
                }
                className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm"
              >
                With Action
              </button>

              <button
                onClick={() =>
                  addNotification({
                    type: 'success',
                    message: 'No title notification.',
                    duration: 3000,
                    position: 'top-center',
                  })
                }
                className="px-3 py-1 bg-teal-500 text-white rounded-md text-sm"
              >
                No Title
              </button>

              <button
                onClick={() =>
                  addNotification({
                    type: 'warning',
                    title: 'Long Duration',
                    message: 'This notification stays for 15 seconds.',
                    duration: 15000,
                  })
                }
                className="px-3 py-1 bg-amber-500 text-white rounded-md text-sm"
              >
                Long Duration (15s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main NotificationsPage component
const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { team, isLoading: isTeamLoading } = useTeam(slug as string);
  const { data: session } = useSession();
  const { state, fetchTeamNotifications, markAllAsRead, markAsRead } =
    useNotification();

  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications when slug is available from the router
  useEffect(() => {
    if (slug) {
      fetchTeamNotifications(slug as string);
    }
  }, [slug]);

  // Get current user ID
  const getCurrentUserId = () => {
    return (
      session?.user?.id || localStorage.getItem('userId') || 'default-user-id'
    );
  };

  // Handle marking all as read
  const handleMarkAllAsRead = () => {
    const userId = getCurrentUserId();
    if (slug) {
      markAllAsRead(slug as string, userId);
    }
  };

  // Handle manual refresh of notifications
  const handleRefresh = async () => {
    if (slug && !isRefreshing) {
      setIsRefreshing(true);
      await fetchTeamNotifications(slug as string);
      setIsRefreshing(false);
    }
  };

  // Handle marking a single notification as read
  const handleMarkAsRead = (notificationId: string) => {
    const userId = getCurrentUserId();
    markAsRead(notificationId, userId);
  };

  // Filter notifications based on selected types and read/unread status
  const filteredNotifications = state.dbNotifications.filter((notification) => {
    const typeMatch =
      selectedTypes.length === 0 ||
      selectedTypes.includes(notification.type as NotificationType);
    const readStatusMatch = !showUnreadOnly || !notification.isRead;
    return typeMatch && readStatusMatch;
  });

  // Show loading state while team data is being fetched
  if (isTeamLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          {team?.name ? `${team.name} Notifications` : 'Notifications'}
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              checked={showUnreadOnly}
              onChange={() => setShowUnreadOnly(!showUnreadOnly)}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              Show unread only
            </span>
          </label>

          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters with refresh button */}
      <NotificationTypeFilter
        selectedTypes={selectedTypes}
        onChange={setSelectedTypes}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Notifications list */}
      <div className="bg-white dark:bg-surfaceColor shadow rounded-lg overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  notification.isRead
                    ? 'opacity-70'
                    : 'border-l-4 ' +
                      (notification.type === 'success'
                        ? 'border-green-500 dark:border-green-400'
                        : notification.type === 'error'
                          ? 'border-red-500 dark:border-red-400'
                          : notification.type === 'warning'
                            ? 'border-yellow-500 dark:border-yellow-400'
                            : 'border-blue-500 dark:border-blue-400')
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {notification.type === 'success' && (
                      <span className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <FaCheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                      </span>
                    )}
                    {notification.type === 'error' && (
                      <span className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <FaExclamationCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                      </span>
                    )}
                    {notification.type === 'warning' && (
                      <span className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <FaExclamationTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                      </span>
                    )}
                    {notification.type === 'info' && (
                      <span className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FaInfoCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 cursor-pointer">
                    {notification.title && (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Notification Testing Section */}
      {slug && <DebugNotifications teamSlug={slug as string} />}
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NotificationsPage;
