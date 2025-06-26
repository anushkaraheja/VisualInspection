import { prisma } from '@/lib/prisma';
import { TeamRole } from '@prisma/client';

export const getRoles = async (teamSlug: string): Promise<TeamRole[]> => {
  const roles = await prisma.teamRole.findMany({
    where: { team: { slug: teamSlug } },
  });

  return roles;
};
