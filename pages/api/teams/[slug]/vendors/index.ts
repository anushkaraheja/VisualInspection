import { getTeams } from 'models/team';
import { throwIfNoTeamAccess } from 'models/team';
import { getCurrentUser } from 'models/user';
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

// Get vendors
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);

  try {

    // Get vendors for the team's locations
    const vendors = await prisma.vendor.findMany({
      where: {
        active: true,
        locations: {
          some: {
            location: {
              teamId: teamMember.teamId
            }
          }
        }
      },
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
      },
      orderBy: {
        companyName: 'asc',
      },
    });

    // Format response
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      companyName: vendor.companyName,
      contactName: vendor.contactName,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      address: vendor.address,
      active: vendor.active,
      notes: vendor.notes,
      livestockItems: vendor.livestockItems.map(item => ({
        livestockId: item.livestockId,
        name: item.livestock.name,
        icon: item.livestock.icon
      })),
      locations: vendor.locations.map(loc => ({
        locationId: loc.locationId,
        name: loc.location.name
      }))
    }));

    res.status(200).json({ data: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: { message: 'Failed to fetch vendors' } });
  }
};

// Create a vendor
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);

  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    address,
    active = true,
    notes,
    livestockItems = [],
    locationIds = [],
  } = req.body;

  try {
    // Validate required fields
    if (!companyName || !contactName || !contactEmail || !contactPhone || !address) {
      return res.status(400).json({
        error: { message: 'Required fields are missing' },
      });
    }

    // Create vendor
    const newVendor = await prisma.vendor.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        address,
        active,
        notes,
        livestockItems: {
          create: livestockItems.map(itemId => ({
            livestockId: itemId,
            active: true
          }))
        },
        locations: {
          create: locationIds.map(locId => ({
            locationId: locId,
            active: true
          }))
        }
      },
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

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: { message: 'Failed to create vendor' } });
  }
};
