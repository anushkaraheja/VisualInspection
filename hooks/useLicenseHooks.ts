import { useState, useEffect } from 'react';
import { License, PrismaClient } from '@prisma/client';
import useSWR, { mutate } from 'swr';
import { ApiResponse } from 'types';
import fetcher from '@/lib/fetcher';

const prisma = new PrismaClient();

export const useLicense = (teamSlug: string) => {
  const url = `/api/teams/${teamSlug}/licenses`;

  const { data, error } = useSWR<ApiResponse<License[]>>(url, fetcher);

  const mutateLicense = async () => {
    mutate(url);
  };
  return {
    licenses: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateLicense,
  };
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
