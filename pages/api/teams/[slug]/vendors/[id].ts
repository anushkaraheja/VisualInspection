import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
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

// Get a specific vendor
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);

  const { id } = req.query;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: id as string },
      include: {
        livestockItems: {
          include: {
            livestock: true
          }
        },
        locations: {
          include: {
            location: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }

    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: { message: 'Failed to fetch vendor' } });
  }
};

// Update a vendor
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);

  const { id } = req.query;
  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    address,
    active,
    notes,
    livestockItems = [],
    locationIds = [],
  } = req.body;

  try {
    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: id as string },
      include: {
        livestockItems: true,
        locations: true
      }
    });

    if (!existingVendor) {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }

    // Update vendor
    await prisma.$transaction(async (prisma) => {
      // Update main vendor details
      const updatedVendor = await prisma.vendor.update({
        where: { id: id as string },
        data: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          address,
          active,
          notes,
        },
      });

      // Handle livestock items - remove existing and add new ones
      await prisma.vendorLivestock.deleteMany({
        where: { vendorId: id as string }
      });

      if (livestockItems.length > 0) {
        await prisma.vendorLivestock.createMany({
          data: livestockItems.map(itemId => ({
            vendorId: id as string,
            livestockId: itemId,
            active: true
          }))
        });
      }

      // Handle location connections - remove existing and add new ones
      await prisma.locationVendor.deleteMany({
        where: { vendorId: id as string }
      });

      if (locationIds.length > 0) {
        await prisma.locationVendor.createMany({
          data: locationIds.map(locId => ({
            vendorId: id as string,
            locationId: locId,
            active: true
          }))
        });
      }

      return updatedVendor;
    });

    // Get updated vendor with relationships
    const updatedVendorWithRelations = await prisma.vendor.findUnique({
      where: { id: id as string },
      include: {
        livestockItems: {
          include: {
            livestock: true
          }
        },
        locations: {
          include: {
            location: true
          }
        }
      }
    });

    res.status(200).json(updatedVendorWithRelations);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: { message: 'Failed to update vendor' } });
  }
};

// Delete a vendor
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);

  const { id } = req.query;

  try {
    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: id as string }
    });

    if (!vendor) {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }

    // Delete vendor (Prisma will cascade delete related records based on schema)
    await prisma.vendor.delete({
      where: { id: id as string }
    });

    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: { message: 'Failed to delete vendor' } });
  }
};
