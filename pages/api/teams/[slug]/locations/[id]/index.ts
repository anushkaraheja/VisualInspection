import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getLocationDetails,
  updateLocation,
  getTeamTenantType,
} from 'models/locations';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

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
      case 'PUT':
        await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT');
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

// Get locationDetails
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'read');

  // Get the team's tenant type
  const tenantType = await getTeamTenantType(teamMember.teamId);

  const locations = await getLocationDetails(
    req.query.id as string,
    tenantType
  );

  res.status(200).json({ data: locations });
};

// Update location details
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'update');

  const locationId = req.query.id as string;
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

  // Get the team's tenant type
  const tenantType = await getTeamTenantType(teamMember.teamId);
  const isFarmTenant = tenantType === 'Farm';
  const isPPETenant = tenantType === 'PPE';

  // Update the location
  const updatedLocation = await updateLocation(locationId, {
    name: locationName,
    addressL1: address1,
    addressL2: address2,
    zip,
    state,
    city,
    phone: phoneNumber,
    email,
    tenantType,
    animals: isFarmTenant
      ? [
          {
            name: 'Bulls',
            activeAnimal: bullsActive,
            inactiveAnimal: bullsInactive,
          },
          {
            name: 'Cows',
            activeAnimal: cowsActive,
            inactiveAnimal: cowsInactive,
          },
          {
            name: 'Calves',
            activeAnimal: calvesActive,
            inactiveAnimal: calvesInactive,
          },
        ]
      : [],

    zones: isPPETenant && zones ? zones : [],
  });

  res.status(200).json({ data: updatedLocation });
};
