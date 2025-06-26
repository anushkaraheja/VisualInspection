import { prisma } from '@/lib/prisma';

// Add this new function to get team tenant type
export const getTeamTenantType = async (teamId: string): Promise<string> => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { TenantType: true },
  });

  return team?.TenantType?.name || 'DEFAULT';
};

export const createLocation = async (param: {
  name: string;
  addressL1: string;
  addressL2?: string;
  zip: string;
  state: string;
  city: string;
  phone: string;
  email?: string;
  teamId: string;
  tenantType?: string;
  animals?: {
    name: string;
    activeAnimal: number;
    inactiveAnimal: number;
    icon: string;
  }[];
  zones?: {
    name: string;
    description?: string;
  }[];
}) => {
  const {
    name,
    addressL1,
    addressL2,
    zip,
    state,
    city,
    phone,
    email,
    teamId,
    tenantType = 'DEFAULT',
    animals = [],
    zones = [],
  } = param;

  const location = await prisma.location.create({
    data: {
      name,
      addressL1,
      addressL2,
      zip,
      state,
      city,
      phone,
      email,
      teamId,
    },
  });

  // Handle tenant-specific data
  if (tenantType === 'Farm' && animals.length > 0) {
    await createAnimals(location.id, animals);
  }

  // Create zones if PPE tenant
  if (tenantType === 'PPE' && zones.length > 0) {
    for (const zone of zones) {
      await createZone(location.id, zone.name, zone.description);
    }
  }

  return location;
};

export const getAllLocations = async (teamSlug: string) => {
  return await prisma.location.findMany({
    where: {
      Team: {
        slug: teamSlug,
      },
    },
    include: {
      locationVendors: true,
      UserLocation: true,
      Animal: true,
      Zone: {
        include: {
          devices: true,
        },
      },
      
    },
  });
};

export const getLocationDetails = async (
  locationId: string,
  tenantType?: string
) => {
  const isFarmTenant = tenantType === 'Farm';
  const isPPETenant = tenantType === 'PPE';

  return await prisma.location.findUnique({
    where: {
      id: locationId,
    },
    include: {
      Animal: isFarmTenant || tenantType === undefined, // Include animals for Farm tenant or if no tenant type is specified
      locationVendors:
        !isFarmTenant
          ? {}
          : {
              include: {
                vendor: true,
              },
              where: {
                vendor: {
                  active: true,
                },
              },
            }, // Include vendors for Farm tenant or if no tenant type is specified
      UserLocation: true, // Always include UserLocation
      Zone: {
        include: {
          devices: true
        },
      },
    },
  });
};

export const updateUserLocation = async (
  locationId: string,
  userId: string,
  isChecked: Boolean
) => {
  return await prisma.userLocation.update({
    data: {
      isActive: isChecked.valueOf(),
    },
    where: {
      userId_locationId: {
        userId,
        locationId,
      },
    },
  });
};

export const addUserLocation = async (locationId: string, userId: string) => {
  return await prisma.userLocation.upsert({
    create: {
      locationId,
      userId,
    },
    update: {
      locationId,
      userId,
    },
    where: {
      userId_locationId: {
        userId,
        locationId,
      },
    },
  });
};

export const getUsersByLocation = async (locationId: string) => {
  return await prisma.user.findMany({
    where: {
      UserLocation: {
        some: {
          locationId: locationId,
        },
      },
    },
    include: {
      UserLocation: true,
      TeamMember: {
        select: {
          teamRole: true,
        },
      },
    },
  });
};

export const createAnimals = async (
  locationId: string,
  animals: {
    name: string;
    activeAnimal: number;
    inactiveAnimal: number;
    icon: string;
  }[]
) => {
  const createdAnimals = await prisma.animal.createMany({
    data: animals.map((animal) => ({
      name: animal.name,
      icon: animal.icon || '',
      activeAnimal: animal.activeAnimal || 0,
      inactiveAnimal: animal.inactiveAnimal || 0,
      locationId,
    })),
  });

  return createdAnimals;
};

export async function updateLocation(
  locationId: string,
  data: {
    name: string;
    addressL1: string;
    addressL2?: string;
    zip: string;
    state: string;
    city: string;
    phone: string;
    email?: string;
    tenantType?: string;
    animals?: {
      name: string;
      activeAnimal: number;
      inactiveAnimal: number;
    }[];
    zones?: any[];
  }
) {
  const {
    name,
    addressL1,
    addressL2,
    zip,
    state,
    city,
    phone,
    email,
    tenantType = 'DEFAULT',
    animals = [],
    zones = [],
  } = data;

  // First update the location details
  const updatedLocation = await prisma.location.update({
    where: { id: locationId },
    data: {
      name,
      addressL1,
      addressL2: addressL2 || '',
      zip,
      state,
      city,
      phone,
      email: email || '',
    },
  });

  // Then update tenant-specific data
  if (tenantType === 'Farm' && animals.length > 0) {
    // Update each animal type
    for (const animal of animals) {
      const existingAnimal = await prisma.animal.findFirst({
        where: {
          locationId,
          name: animal.name,
        },
      });

      if (existingAnimal) {
        await prisma.animal.update({
          where: { id: existingAnimal.id },
          data: {
            activeAnimal: animal.activeAnimal || 0,
            inactiveAnimal: animal.inactiveAnimal || 0,
          },
        });
      } else {
        await prisma.animal.create({
          data: {
            name: animal.name,
            icon: '',
            activeAnimal: animal.activeAnimal || 0,
            inactiveAnimal: animal.inactiveAnimal || 0,
            locationId,
          },
        });
      }
    }
  }

  // Handle zones for PPE tenant
  if (tenantType === 'PPE' && zones.length > 0) {
    for (const zone of zones) {
      if (zone.id && !zone.id.startsWith('temp-')) {
        // Update existing zone
        await prisma.zone.update({
          where: { id: zone.id },
          data: {
            name: zone.name,
            description: zone.description || '',
          },
        });
      } else if (!zone.id || zone.id.startsWith('temp-')) {
        // Check if a zone with this name already exists
        const existingZone = await prisma.zone.findUnique({
          where: {
            locationId_name: {
              locationId,
              name: zone.name,
            },
          },
        });

        if (!existingZone) {
          // Create new zone
          await prisma.zone.create({
            data: {
              name: zone.name,
              description: zone.description || '',
              locationId,
            },
          });
        }
      }
    }
  }

  // Return the updated location with related data
  return await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      Animal: true,
      Zone: true,
    },
  });
}

// Zone management functions
export const createZone = async (
  locationId: string,
  name: string,
  description?: string
) => {
  return await prisma.zone.create({
    data: {
      name,
      description,
      locationId,
    },
  });
};

export const updateZone = async (
  zoneId: string,
  data: {
    name?: string;
    description?: string;
  }
) => {
  return await prisma.zone.update({
    where: { id: zoneId },
    data,
  });
};

export const deleteZone = async (zoneId: string) => {
  return await prisma.zone.delete({
    where: { id: zoneId },
  });
};

export const getZonesByLocation = async (locationId: string) => {
  return await prisma.zone.findMany({
    where: { locationId },
    include: { devices: true },
  });
};

export const getZoneById = async (zoneId: string) => {
  return await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { devices: true },
  });
};

// Add these new functions for zone validation

export const checkZoneExists = async (
  zoneId: string,
  locationId: string,
  teamSlug: string
): Promise<boolean> => {
  const zone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      locationId,
      location: {
        Team: {
          slug: teamSlug,
        },
      },
    },
  });

  return !!zone;
};

export const checkZoneNameExists = async (
  locationId: string,
  name: string,
  excludeZoneId?: string
): Promise<boolean> => {
  const whereClause: any = {
    locationId,
    name,
  };

  if (excludeZoneId) {
    whereClause.id = { not: excludeZoneId };
  }

  const existingZone = await prisma.zone.findFirst({
    where: whereClause,
  });

  return !!existingZone;
};
