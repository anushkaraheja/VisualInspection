import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPurchasedLicenses = async (teamSlug: string) => {
  return await prisma.purchasedLicense.findMany({
    where: {
      Team: {
        slug: teamSlug,
      },
    },
    include: {
      License: true,
    },
  });
};
