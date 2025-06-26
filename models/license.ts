import { useState, useEffect } from 'react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const useLicenses = (userId: string) => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const userLicenses = await prisma.userLicense.findMany({
          where: { userId },
          include: { license: true },
        });
        setLicenses(userLicenses);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, [userId]);

  return { licenses, loading, error };
};

export const getAllLicenses = async (teamSlug: string) => {
  return await prisma.license.findMany({
    where: {
      team: {
        slug: teamSlug,
      },
    },
  });
};

export const getLicensesByTeamId = async (teamId: string) => {
  return await prisma.license.findMany({
    where: {
      teamId,
    },
  });
};

export const assignLicense = async (
  userId: string,
  purchasedLicenseId: string
) => {
  try {
    const newLicense = await prisma.userLicense.create({
      data: {
        userId,
        purchasedLicenseId,
      },
    });
    return newLicense;
  } catch (err) {
    throw new Error(`Failed to assign license: ${(err as Error).message}`);
  }
};

export const removeLicense = async (
  userId: string,
  purchasedLicenseId: string
) => {
  try {
    await prisma.userLicense.deleteMany({
      where: {
        userId,
        purchasedLicenseId,
      },
    });
  } catch (err) {
    throw new Error(`Failed to remove license: ${(err as Error).message}`);
  }
};

export const createPurchasedLicense = async (
  teamSlug: string,
  licenses: any[]
) => {
  try {
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const purchasedLicenses = await Promise.all(
      licenses.map(async (license) => {
        return await prisma.purchasedLicense.create({
          data: {
            teamId: team.id,
            licenseId: license.id,
          },
        });
      })
    );

    return purchasedLicenses;
  } catch (err) {
    throw new Error(
      `Failed to create purchased licenses: ${(err as Error).message}`
    );
  }
};
