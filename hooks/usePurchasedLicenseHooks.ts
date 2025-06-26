import { License, PrismaClient, PurchasedLicense } from '@prisma/client';
import useSWR, { mutate } from 'swr';
import { ApiResponse } from 'types';
import fetcher from '@/lib/fetcher';

const prisma = new PrismaClient();

type Response = ApiResponse<PurchasedLicense & { License: License }[]>;

export const usePurchasedLicense = (teamSlug: string) => {
  const url = `/api/teams/${teamSlug}/purchasedLicenses`;

  const { data, error, isLoading } = useSWR<Response>(url, fetcher);

  const mutateLicense = async () => {
    mutate(url);
  };
  return {
    purchasedLicenses: data?.data,
    isPurchasedLicenseLoading: isLoading,
    isPurchasedLicenseError: error,
    mutateLicense,
  };
};

export const assignPurchasedLicense = async (
  userId: string,
  purchasedLicenseId: string,
  expiresAt: Date
) => {
  try {
    const newLicense = await prisma.userLicense.create({
      data: {
        userId,
        purchasedLicenseId,
        expiresAt,
      },
    });
    return newLicense;
  } catch (err) {
    throw new Error(`Failed to assign license: ${(err as Error).message}`);
  }
};
