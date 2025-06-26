import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import {
  addUserLocation,
  getUsersByLocation,
  updateUserLocation,
} from 'models/locations';

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
      case 'PUT':
        await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST, PUT');
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

// Get locationUsers
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'TEAM_MEMBER', 'read');

  const locationUsers = await getUsersByLocation(req.query.id as string);

  res.status(200).json({ data: locationUsers });
};

// Create UserLocations
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'TEAM_MEMBER', 'create');

  const { userId, locationId } = req.body;

  const userLocation = await addUserLocation(locationId, userId);

  res.status(200).json({ data: userLocation });
};

const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'TEAM_MEMBER', 'update');

  const { userId, locationId, isChecked } = req.body;

  const userLocation = await updateUserLocation(locationId, userId, isChecked);

  res.status(200).json({ data: userLocation });
};
