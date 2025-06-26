import { getSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// Define explicit types for our results
type LocationLicenseResult = {
  id: string;
  locationId: string;
  purchasedLicenseId: string;
  assignedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Method not allowed' },
    });
  }

  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized' },
      });
    }

    const { slug, id: licenseId } = req.query as { slug: string; id: string };
    const { locationIds, locationsToUnassign } = req.body;

    // Validate locationIds if provided
    if (
      locationIds &&
      (!Array.isArray(locationIds) ||
        locationIds.some((id) => typeof id !== 'string'))
    ) {
      return res.status(400).json({
        error: { message: 'Invalid location IDs format' },
      });
    }

    // Validate locationsToUnassign if provided
    if (
      locationsToUnassign &&
      (!Array.isArray(locationsToUnassign) ||
        locationsToUnassign.some((id) => typeof id !== 'string'))
    ) {
      return res.status(400).json({
        error: { message: 'Invalid locations to unassign format' },
      });
    }

    // Make sure we have at least one operation to perform
    if (
      (!locationIds || locationIds.length === 0) &&
      (!locationsToUnassign || locationsToUnassign.length === 0)
    ) {
      return res.status(400).json({
        error: {
          message: 'No locations provided for assignment or unassignment',
        },
      });
    }

    // Get the team
    const team = await prisma.team.findUnique({
      where: { slug },
    });

    if (!team) {
      return res.status(404).json({
        error: { message: 'Team not found' },
      });
    }

    // Check if the user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: session.user.id,
        },
      },
    });

    if (!teamMember) {
      return res.status(403).json({
        error: { message: 'Forbidden' },
      });
    }

    // Get the purchased license with associated license details
    const purchasedLicense = await prisma.purchasedLicense.findUnique({
      where: { id: licenseId },
      include: {
        locationLicense: true,
        License: true,
      },
    });

    if (!purchasedLicense || purchasedLicense.teamId !== team.id) {
      return res.status(404).json({
        error: { message: 'License not found' },
      });
    }

    // Process unassignments first
    let unassignResults: LocationLicenseResult[] = [];
    if (locationsToUnassign && locationsToUnassign.length > 0) {
      // Find the location licenses to delete
      const locationLicensesToDelete = purchasedLicense.locationLicense.filter(
        (ll) => locationsToUnassign.includes(ll.locationId)
      );

      // Delete each location license
      unassignResults = await Promise.all(
        locationLicensesToDelete.map((ll) =>
          prisma.locationLicense.delete({
            where: { id: ll.id },
          })
        )
      );
    }

    // Then process new assignments
    let assignResults: LocationLicenseResult[] = [];
    if (locationIds && locationIds.length > 0) {
      // Check if this license is already assigned to a location (after unassignments)
      const currentLocationCount =
        purchasedLicense.locationLicense.length - (unassignResults.length || 0);

      // Each purchased license can only be assigned to one location
      if (currentLocationCount > 0) {
        return res.status(400).json({
          error: { message: 'This license is already assigned to a location' },
        });
      }

      // Enforce one location per license
      if (locationIds.length > 1) {
        return res.status(400).json({
          error: {
            message: 'Each license can only be assigned to one location',
          },
        });
      }

      // Create new location license assignment
      assignResults = await Promise.all(
        locationIds.map((locationId) =>
          prisma.locationLicense.create({
            data: {
              locationId,
              purchasedLicenseId: purchasedLicense.id,
              assignedAt: new Date(),
              isActive: true,
              expiresAt: purchasedLicense.expiresAt,
            },
          })
        )
      );
    }

    // Return results of both operations
    return res.status(200).json({
      data: {
        assigned: assignResults || [],
        unassigned: unassignResults || [],
      },
    });
  } catch (error: any) {
    // Create a safe error object with default values if properties are missing
    let errorMessage = 'An error occurred while assigning license to location';
    let statusCode = 500;

    try {
      // Try to safely extract error information
      if (error) {
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
        if (typeof error.status === 'number') {
          statusCode = error.status;
        }
      }

      console.error('Error assigning license to location:', errorMessage);

      // Return a properly structured error response
      return res.status(statusCode).json({
        error: {
          message: errorMessage,
        },
      });
    } catch (secondaryError) {
      // Fallback if error handling itself fails
      console.error('Error in error handler:', secondaryError);
      return res.status(500).json({
        error: {
          message: 'Internal server error',
        },
      });
    }
  }
}
