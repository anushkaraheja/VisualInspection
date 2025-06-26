/**
 * User module for dynamic seeding
 */
import { Role } from '@prisma/client';
import { ADMIN_USER } from '../config';
import { prisma, hashPassword, createEmail } from '../utils/helpers';

/**
 * Create an admin user for a team
 */
export async function createAdminUser(teamId: string, teamDomain: string, teamRoleId: string) {
  console.log(`Creating admin user for team ${teamId}...`);

  // Generate email if not provided
  const email = ADMIN_USER.email || createEmail(ADMIN_USER.firstName, teamDomain);
  
  // Hash password
  const password = await hashPassword(ADMIN_USER.password);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      name: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      email,
      password,
      TeamMember: {
        create: {
          teamId,
          role: Role.ADMIN,
          teamRoleId,
        },
      },
    },
  });
  
  console.log(`Created admin user: ${user.name} (${user.email})`);
  return user;
}
