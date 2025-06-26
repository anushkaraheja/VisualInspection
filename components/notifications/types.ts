import React from 'react';

// Types and Interfaces
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';
export type NotificationStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | string;

// Simplified - auto is the only option we'll actually use
export type NotificationTheme = 'auto';

export interface NotificationProps {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  position?: NotificationPosition;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  teamSlug?: string; // Changed from teamId to teamSlug
  isGlobal?: boolean;
  isRead?: boolean;
  createdAt?: Date;
  expiresAt?: Date | null;
  metadata?: Record<string, any>;
  status?: NotificationStatus;
}

export interface DBNotification {
  id: string;
  type: string;
  message: string;
  title?: string | null;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  isGlobal: boolean;
  metadata?: Record<string, any>;
  status: NotificationStatus;
  isRead?: boolean;
}

export interface NotificationState {
  notifications: NotificationProps[];
  dbNotifications: DBNotification[];
}

// Actions
export type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: NotificationProps }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_DB_NOTIFICATIONS'; payload: DBNotification[] }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ'; payload: string }; // teamSlug
