import { getTeams } from 'models/team';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed, getCurrentUser } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  addUserLocation,
  createLocation,
  getAllLocations,
} from 'models/locations';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get locations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'read');

  const locations = await getAllLocations(req.query.slug as string);

  res.status(200).json({ data: locations });
};

// Create a location
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'create');

  const {
    locationName,
    address1,
    address2,
    zip,
    state,
    city,
    phoneNumber,
    email,
    bullsActive,
    bullsInactive,
    cowsActive,
    cowsInactive,
    calvesActive,
    calvesInactive,
    zones,
  } = req.body;

  const user = await getCurrentUser(req, res);
  const teams = await getTeams(user.id);
  const teamId = teams[0].id;

  // Get tenant type
  const teamWithTenant = await prisma.team.findUnique({
    where: { id: teamId },
    include: { TenantType: true },
  });

  const tenantType = teamWithTenant?.TenantType?.name || 'DEFAULT';
  const isFarmTenant = tenantType === 'Farm';
  const isPPETenant = tenantType === 'PPE';

  try {
    // Prepare animal data if it's a FARM tenant
    const animals = isFarmTenant
      ? [
          {
            name: 'Bulls',
            activeAnimal: bullsActive || 0,
            inactiveAnimal: bullsInactive || 0,
            icon: 'bulls.svg',
          },
          {
            name: 'Cows',
            activeAnimal: cowsActive || 0,
            inactiveAnimal: cowsInactive || 0,
            icon: 'cows.svg',
          },
          {
            name: 'Calves',
            activeAnimal: calvesActive || 0,
            inactiveAnimal: calvesInactive || 0,
            icon: 'calves.svg',
          },
        ]
      : [];

    // Create location with tenant-specific data
    const newLocation = await createLocation({
      name: locationName,
      addressL1: address1,
      addressL2: address2 || '',
      city,
      state,
      zip,
      phone: phoneNumber,
      email: email || '',
      teamId,
      tenantType,
      animals,
      zones: isPPETenant && zones ? zones : [],
    });

    // Get the location with its relationships
    const locationWithRelations = await prisma.location.findUnique({
      where: { id: newLocation.id },
      include: {
        Animal: true,
        Zone: true,
      },
    });

    // Associate the current user with the location
    await addUserLocation(newLocation.id, user.id);

    res.status(201).json(locationWithRelations);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
};
