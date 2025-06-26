import { prisma } from '@/lib/prisma';
import { Theme } from '@prisma/client';

export const getOrgTheme = async (teamId: string): Promise<Theme> => {
  const theme = await prisma.theme.findFirstOrThrow({
    where: { teamId },
  });

  return theme;
};

export const updateOrgColors = async (
  teamId: string,
  primaryColor: string,
  secondaryColor: string
): Promise<Theme> => {
  const theme = await prisma.theme.update({
    where: { teamId },
    data: {
      primaryColor,
      secondaryColor,
    },
  });

  return theme;
};

export const updateOrgLogo = async (
  teamId: string,
  logo: string
): Promise<Theme> => {
  const theme = await prisma.theme.update({
    where: { teamId },
    data: {
      logo,
    },
  });

  return theme;
};

export const getOrgLogo = async (teamId: string): Promise<string | null> => {
  const theme = await prisma.theme.findFirstOrThrow({
    where: { teamId },
    select: { logo: true },
  });

  return theme.logo;
};
