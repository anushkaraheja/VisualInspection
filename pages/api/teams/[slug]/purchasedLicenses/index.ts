import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { prisma } from '@/lib/prisma';
import { PurchasedLicense } from '@prisma/client';

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

// Get purchased licenses
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'LICENSE', 'read');

  const purchasedLicenses = await prisma.purchasedLicense.findMany({
    where: {
      Team: {
        id: teamMember.teamId as string,
      },
    },
    orderBy: {
      purchasedAt: 'desc',
    },
    include: {
      License: true,
      userLicense: true, // Include user license data
    },
  });

  res.status(200).json({ data: purchasedLicenses });
};

// Purchase a license
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const teamMember = await throwIfNoTeamAccess(req, res);
    throwIfNotAllowed(teamMember, 'LICENSE', 'create');

    // Check if body exists and is valid
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: { message: 'Invalid request body' },
      });
    }

    const { slug } = req.query;
    const { licenseId, quantity = 1 } = req.body;

    // Basic validation
    if (!licenseId) {
      return res.status(400).json({
        error: { message: 'License ID is required' },
      });
    }

    // Check if the license exists
    const license = await prisma.license.findUnique({
      where: {
        id: licenseId,
      },
    });

    if (!license) {
      return res.status(404).json({
        error: { message: 'License not found' },
      });
    }

    const team = await prisma.team.findUnique({
      where: { slug: slug as string },
    });

    if (!team) {
      return res.status(404).json({
        error: { message: 'Team not found' },
      });
    }

    // Calculate expiration date based on renewal period
    const now = new Date();
    let expiresAt = new Date();

    switch (license.renewalPeriod) {
      case 'MONTHLY':
        expiresAt.setMonth(now.getMonth() + 1);
        break;
      case 'QUARTERLY':
        expiresAt.setMonth(now.getMonth() + 3);
        break;
      case 'SEMIANNUALLY':
        expiresAt.setMonth(now.getMonth() + 6);
        break;
      case 'ANNUALLY':
        expiresAt.setFullYear(now.getFullYear() + 1);
        break;
      case 'BIANNUALLY':
        expiresAt.setFullYear(now.getFullYear() + 2);
        break;
      default:
        expiresAt.setFullYear(now.getFullYear() + 1);
    }

    // Find existing purchase to determine our starting point for new purchases
    const existingPurchaseCount = await prisma.purchasedLicense.count({
      where: {
        teamId: team.id,
        licenseId: license.id,
      },
    });

    // Create multiple license purchases based on quantity
    const purchasedLicenses: PurchasedLicense[] = [];

    // Create licenses individually without a transaction for unique metadata
    for (let i = 0; i < quantity; i++) {
      // Create unique identifier for each license
      const instanceId = `${existingPurchaseCount + i + 1}`;

      // Create the purchased license with unique notes field
      try {
        const purchasedLicense = await prisma.purchasedLicense.create({
          data: {
            teamId: team.id,
            licenseId: license.id,
            expiresAt,
            nextRenewalDate: expiresAt,
            isActive: true,
            // Add unique notes to prevent collision with the unique constraint
            notes: `Instance ${instanceId} - ${new Date().toISOString()}`,
          },
          include: {
            License: true,
          },
        });

        purchasedLicenses.push(purchasedLicense);
      } catch (err) {
        // Log error but continue with other licenses
        console.log(`Error creating license instance ${i + 1}:`, err);
      }
    }

    if (purchasedLicenses.length === 0) {
      return res.status(500).json({
        error: { message: 'Failed to purchase any licenses' },
      });
    }

    return res.status(200).json({
      data: purchasedLicenses,
      message: `Successfully purchased ${purchasedLicenses.length} license(s)`,
    });
  } catch (error: any) {
    console.log('Error in purchasedLicenses POST:', error);
    return res.status(error.status || 500).json({
      error: { message: error.message || 'Failed to purchase license' },
    });
  }
};
