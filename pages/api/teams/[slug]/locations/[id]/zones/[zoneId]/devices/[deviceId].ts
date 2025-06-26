import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

// Create a single PrismaClient instance
const prisma = new PrismaClient();

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
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    console.error('Error in API handler:', error);
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({
      error: { message },
    });
  }
}

// Get a specific device by ID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id: locationId, zoneId, deviceId } = req.query;

  try {
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: { message: 'Team slug is required' } });
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: { message: 'Device ID is required' } });
    }

    // Check authentication and authorization
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, 'LOCATION', 'read');
    } catch (authError: any) {
      return res.status(401).json({
        error: { message: authError?.message || 'Authentication failed' },
      });
    }

    // Get device with validation that it belongs to the correct zone, location, and team
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        zone: {
          id: zoneId as string,
          location: {
            id: locationId as string,
            Team: { slug: slug as string },
          },
        },
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ 
        error: { message: 'Device not found or access denied' } 
      });
    }

    return res.status(200).json({ data: device });
  } catch (error: any) {
    console.error('Error in handleGET:', error);
    return res.status(500).json({
      error: {
        message: 'Server error handling the request',
        details: error?.message || 'Unknown error',
      },
    });
  }
};

// Update a device
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id: locationId, zoneId, deviceId } = req.query;
  const { 
    name, 
    deviceType, 
    ipAddress, 
    macAddress, 
    serialNumber, 
    model, 
    manufacturer, 
    firmwareVersion, 
    status, 
    config 
  } = req.body;

  try {
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: { message: 'Team slug is required' } });
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: { message: 'Device ID is required' } });
    }

    // Check authentication and authorization
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, 'LOCATION', 'update');
    } catch (authError: any) {
      return res.status(401).json({
        error: { message: authError?.message || 'Authentication failed' },
      });
    }

    // Verify the device exists and belongs to the correct team
    const existingDevice = await prisma.device.findFirst({
      where: {
        id: deviceId,
        zone: {
          id: zoneId as string,
          location: {
            id: locationId as string,
            Team: { slug: slug as string },
          },
        },
      },
    });

    if (!existingDevice) {
      return res.status(404).json({ 
        error: { message: 'Device not found or access denied' } 
      });
    }

    // Update the device
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        name,
        deviceType,
        ipAddress,
        macAddress,
        serialNumber,
        model,
        manufacturer,
        firmwareVersion,
        status,
        config,
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ data: updatedDevice });
  } catch (error: any) {
    console.error('Error in handlePUT:', error);
    return res.status(500).json({
      error: {
        message: 'Server error updating device',
        details: error?.message || 'Unknown error',
      },
    });
  }
};

// Delete a device
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id: locationId, zoneId, deviceId } = req.query;

  try {
    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: { message: 'Team slug is required' } });
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: { message: 'Device ID is required' } });
    }

    // Check authentication and authorization
    try {
      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, 'LOCATION', 'delete');
    } catch (authError: any) {
      return res.status(401).json({
        error: { message: authError?.message || 'Authentication failed' },
      });
    }

    // Verify the device exists and belongs to the correct team
    const existingDevice = await prisma.device.findFirst({
      where: {
        id: deviceId,
        zone: {
          id: zoneId as string,
          location: {
            id: locationId as string,
            Team: { slug: slug as string },
          },
        },
      },
    });

    if (!existingDevice) {
      return res.status(404).json({ 
        error: { message: 'Device not found or access denied' } 
      });
    }

    // Delete the device
    await prisma.device.delete({
      where: { id: deviceId },
    });

    return res.status(200).json({ 
      data: { message: 'Device deleted successfully' } 
    });
  } catch (error: any) {
    console.error('Error in handleDELETE:', error);
    return res.status(500).json({
      error: {
        message: 'Server error deleting device',
        details: error?.message || 'Unknown error',
      },
    });
  }
};
