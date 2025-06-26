import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
export type Resource =
  | 'team'
  | 'team_member'
  | 'team_invitation'
  | 'team_sso'
  | 'team_dsync'
  | 'team_audit_log'
  | 'team_webhook'
  | 'team_payments'
  | 'team_licenses'
  | 'team_api_key'
  | 'location'
  | 'license';

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.MEMBER,
    name: 'Member',
  },
  {
    id: Role.ADMIN,
    name: 'Admin',
  },
  {
    id: Role.OWNER,
    name: 'Owner',
  },
];

export enum ActionEnumFlags {
  CREATE = 1, // 2^0
  READ = 2, // 2^1
  UPDATE = 4, // 2^2
  DELETE = 8, // 2^3
  LEAVE = 16, // 2^4
  ALL = CREATE | READ | UPDATE | DELETE | LEAVE, // All of the actions OR'd
}

// Helper Functions
export function addAction(actions: number, action: ActionEnumFlags): number {
  return actions | action; // Add a flag
}

export function removeAction(actions: number, action: ActionEnumFlags): number {
  return actions & ~action; // Remove a flag
}

export function hasAction(actions: number, action: ActionEnumFlags): boolean {
  return (actions & action) !== 0; // Check a flag
}

export const getPermissions = async (teamRoleId) => {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { teamRoleId },
    select: {
      resource: true,
      action: true,
    },
  });

  if (rolePermissions.some((perm) => perm.resource.toLowerCase() === 'all')) {
    return permissions.OWNER;
  }

  return rolePermissions.map((permission) => {
    const actions: Action[] = [];
    if (hasAction(permission.action, ActionEnumFlags.CREATE))
      actions.push('create');
    if (hasAction(permission.action, ActionEnumFlags.READ))
      actions.push('read');
    if (hasAction(permission.action, ActionEnumFlags.UPDATE))
      actions.push('update');
    if (hasAction(permission.action, ActionEnumFlags.DELETE))
      actions.push('delete');
    if (hasAction(permission.action, ActionEnumFlags.LEAVE))
      actions.push('leave');
    return {
      resource: permission.resource.toLowerCase() as Resource,
      actions: actions.length === 5 ? '*' : actions,
    };
  });
};

export const permissions: RolePermissions = {
  OWNER: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_payments',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    {
      resource: 'team_licenses',
      actions: '*',
    },
    {
      resource: 'location',
      actions: '*',
    },
    {
      resource: 'license',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    {
      resource: 'team_licenses',
      actions: '*',
    },
    {
      resource: 'location',
      actions: '*',
    },
    {
      resource: 'license',
      actions: '*',
    },
  ],
  MEMBER: [
    {
      resource: 'team',
      actions: ['read', 'leave'],
    },
    {
      resource: 'location',
      actions: ['read', 'leave'],
    },
  ],
};
