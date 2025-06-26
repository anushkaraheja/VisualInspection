/**
 * Team module for dynamic seeding
 */
import { Role } from '@prisma/client';
import { COMPANY_NAME, COMPANY_SLUG, COMPANY_DOMAIN, THEME } from '../config';
import { prisma, createSlug, createDomain } from '../utils/helpers';
import { getTenantType } from './tenantType';

/**
 * Create a team with the given tenant type
 */
export async function createTeam(tenantType: 'PPE' | 'Farm') {
  console.log(`Creating ${tenantType} team...`);
  
  // Get tenant type
  const tenantTypeEntity = await getTenantType(tenantType);
  
  // Generate slug and domain if not provided
  const slug = COMPANY_SLUG || createSlug(COMPANY_NAME);
  const domain = COMPANY_DOMAIN || createDomain(slug);
  
  // Create team
  const team = await prisma.team.create({
    data: {
      name: COMPANY_NAME,
      slug,
      domain,
      defaultRole: Role.MEMBER,
      tenantTypeId: tenantTypeEntity.id,
      theme: {
        create: {
          primaryColor: THEME.primaryColor,
          secondaryColor: THEME.secondaryColor,
          logo: THEME.logo || null,
        },
      },
    },
    include: {
      theme: true,
    },
  });
  
  console.log(`Created team: ${team.name} (${team.slug}) with ${tenantType} tenant type`);
  return team;
}

/**
 * Create admin role for a team with full permissions
 */
export async function createAdminRole(teamId: string) {
  return prisma.teamRole.create({
    data: {
      name: 'Administrator',
      teamId,
      permissions: {
        create: Object.values(Resource).map(resource => ({
          resource,
          action: 15, // All permissions: CREATE | READ | UPDATE | DELETE
        })),
      },
    },
  });
}

// Define Resource enum if not imported from @prisma/client
enum Resource {
  TEAM = 'TEAM',
  TEAM_MEMBER = 'TEAM_MEMBER',
  TEAM_INVITATION = 'TEAM_INVITATION',
  TEAM_SSO = 'TEAM_SSO',
  TEAM_DSYNC = 'TEAM_DSYNC',
  TEAM_AUDIT_LOG = 'TEAM_AUDIT_LOG',
  TEAM_WEBHOOK = 'TEAM_WEBHOOK',
  TEAM_PAYMENTS = 'TEAM_PAYMENTS',
  TEAM_LICENSES = 'TEAM_LICENSES',
  TEAM_API_KEY = 'TEAM_API_KEY',
  LOCATION = 'LOCATION',
  LICENSE = 'LICENSE',
  ALL = 'ALL',
}
