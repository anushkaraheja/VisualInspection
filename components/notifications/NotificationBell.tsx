import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBell, FaRegBell } from 'react-icons/fa';
import { useNotification } from './NotificationContext';

interface NotificationBellProps {
  teamSlug?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  teamSlug: propTeamSlug,
}) => {
  const { state, fetchTeamNotifications, markAsRead } = useNotification();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get team slug from router query
  const routerSlug = router.query.slug as string;

  // Use team slug from router or props
  const teamSlug = routerSlug || propTeamSlug;

  // Determine notification page URL based on the team slug
  const notificationUrl = teamSlug
    ? `/teams/${teamSlug}/notifications`
    : '/notifications';

  // Check if the user is currently on the notifications page
  const isOnNotificationsPage = router.pathname.includes('/notifications');

  // Fetch notifications when component mounts using the slug
  useEffect(() => {
    if (teamSlug) {
      fetchTeamNotifications(teamSlug);
    }
  }, [teamSlug]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Count unread notifications
  const unreadCount = state.dbNotifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Get current user ID (placeholder - replace with your actual implementation)
  const getCurrentUserId = () => {
    return localStorage.getItem('userId') || 'default-user-id';
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id, getCurrentUserId());
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        className="p-1 relative focus:outline-none"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">View notifications</span>

        {isOnNotificationsPage ? (
          // Filled bell with background when on notifications page
          <div className={`rounded-full p-1 bg-gray-100 dark:bg-surfaceColor`}>
            <FaBell
              className={`h-5 w-5 ${unreadCount > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : 'No unread notifications'
              }
            />
          </div>
        ) : (
          // Outline bell when not on notifications page
          <FaRegBell
            className={`h-5 w-5 ${unreadCount > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : 'No unread notifications'
            }
          />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-xs font-semibold text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown/Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] overflow-auto bg-white dark:bg-surfaceColor rounded-md shadow-xl z-50 border border-gray-200 dark:border-borderColor animate-fadeIn">
          {unreadCount > 0 && (
            <div className="px-5 py-4 border-b border-gray-200 dark:border-borderColor flex justify-end items-center">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100">
                {unreadCount} unread
              </span>
            </div>
          )}

          <div className="divide-y divide-gray-200 dark:divide-borderColor max-h-[40vh] overflow-y-auto">
            {state.dbNotifications.length === 0 ? (
              <div className="py-6 px-5 text-sm text-gray-500 dark:text-gray-400 text-center">
                No notifications
              </div>
            ) : (
              state.dbNotifications.slice(0, 8).map((notification) => (
                <div
                  key={notification.id}
                  className={`px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${notification.isRead ? 'opacity-70' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      {notification.type === 'success' && (
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      )}
                      {notification.type === 'error' && (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      )}
                      {notification.type === 'warning' && (
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      )}
                      {notification.type === 'info' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      {notification.title && (
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-2 flex-shrink-0">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-200 dark:border-borderColor text-right">
            <Link
              href={notificationUrl}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>View all notifications</span>
              <svg
                className="ml-1.5 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
