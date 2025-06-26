import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getZonesByLocation,
  createZone,
  checkZoneNameExists,
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

// Get all zones for a location
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'read');

  const zones = await getZonesByLocation(req.query.id as string);
  res.status(200).json({ data: zones });
};

// Create a new zone
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'update');

  const { name, description } = req.body;
  const locationId = req.query.id as string;

  if (!name) {
    return res
      .status(400)
      .json({ error: { message: 'Zone name is required' } });
  }

  try {
    // Check if a zone with this name already exists
    const nameExists = await checkZoneNameExists(locationId, name);
    if (nameExists) {
      return res.status(400).json({
        error: {
          message: 'A zone with this name already exists for this location',
        },
      });
    }

    const newZone = await createZone(locationId, name, description);
    res.status(201).json({ data: newZone });
  } catch (error: any) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: { message: 'Failed to create zone' } });
  }
};
