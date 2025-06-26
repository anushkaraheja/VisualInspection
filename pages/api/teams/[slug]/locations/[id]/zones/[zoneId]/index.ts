import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getZoneById,
  updateZone,
  deleteZone,
  checkZoneExists,
  checkZoneNameExists,
} from 'models/locations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug, id: locationId, zoneId } = req.query;

  try {
    // Verify that zone exists and belongs to the location
    const zoneExists = await checkZoneExists(
      zoneId as string,
      locationId as string,
      slug as string
    );

    if (!zoneExists) {
      return res.status(404).json({ error: { message: 'Zone not found' } });
    }

    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
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

// Get a specific zone
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'read');

  const zone = await getZoneById(req.query.zoneId as string);
  res.status(200).json({ data: zone });
};

// Update a zone
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'update');

  const { name, description } = req.body;
  const locationId = req.query.id as string;
  const zoneId = req.query.zoneId as string;

  if (!name) {
    return res
      .status(400)
      .json({ error: { message: 'Zone name is required' } });
  }

  try {
    // Check if another zone with the same name exists
    const nameExists = await checkZoneNameExists(locationId, name, zoneId);

    if (nameExists) {
      return res.status(400).json({
        error: {
          message:
            'Another zone with this name already exists in this location',
        },
      });
    }

    const updatedZone = await updateZone(zoneId, { name, description });
    res.status(200).json({ data: updatedZone });
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ error: { message: 'Failed to update zone' } });
  }
};

// Delete a zone
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LOCATION', 'update');

  try {
    await deleteZone(req.query.zoneId as string);
    res.status(200).json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ error: { message: 'Failed to delete zone' } });
  }
};
