import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, DetectionStatus } from '@prisma/client';
import { getSession } from '@/lib/session';
import { getTeam } from 'models/team';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug } = req.query;


  try {
    switch (method) {
      case 'GET':
        const result = await handleGET(req, res, slug as string);
        return res.status(result.status || 200).json(result.data);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    console.error('Error in Livestock Summary API handler:', error);
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    return res.status(status).json({
      error: { message },
    });
  }
}

// Get summary statistics
const handleGET = async (req: NextApiRequest, res: NextApiResponse, slug: string) => {
  try {
    // Check if user is authenticated
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return {
        status: 401,
        data: {
          success: false,
          error: { message: 'Authentication required' }
        }
      };
    }

    // Get the team from slug
    const team = await getTeam({slug});
    if (!team) {
      return {
        status: 404,
        data: {
          success: false,
          error: { message: 'Team not found' }
        }
      };
    }
    

    // Extract optional filters
    const { 
      startDate, 
      endDate, 
      locationId, 
      zoneId, 
      deviceId
    } = req.query;

    // Build base filters
    const filters: any = {
      teamId: team.id,
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      filters.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (startDate) {
      filters.timestamp = {
        gte: new Date(startDate as string),
      };
    } else if (endDate) {
      filters.timestamp = {
        lte: new Date(endDate as string),
      };
    }

    // Add location/zone/device filters if provided
    if (locationId || zoneId || deviceId) {
      filters.filterDevice = {};
      
      if (deviceId) {
        filters.filterDevice.deviceId = deviceId as string;
      } else if (zoneId) {
        filters.filterDevice.device = {
          zoneId: zoneId as string
        };
      } else if (locationId) {
        filters.filterDevice.device = {
          zone: {
            locationId: locationId as string
          }
        };
      }
    }

    try {
      // Fetch active livestock types for this team
      const activeTeamLivestockItems = await prisma.teamLivestockItem.findMany({
        where: {
          teamId: team.id,
          active: true
        },
        include: {
          livestock: true
        }
      });

      // Extract livestock names
      const activeTypeNames = activeTeamLivestockItems.map(item => item.livestock.name);
      
      // Add livestock filter
      filters.type = {
        in: activeTypeNames
      };
      
      // Calculate summary metrics
      const [
        totalCount,
        pendingCount,
        rejectedCount, 
        approvedCount,
        modifiedCount,
        detectionsByType,
        avgConfidence
      ] = await Promise.all([
        // Total count
        prisma.livestockDetection.count({
          where: filters
        }),
        
        // Count by status - Pending
        prisma.livestockDetection.count({
          where: {
            ...filters,
            status: DetectionStatus.PENDING
          }
        }),
        
        // Count by status - Rejected
        prisma.livestockDetection.count({
          where: {
            ...filters,
            status: DetectionStatus.REJECTED
          }
        }),
        
        // Count by status - Approved
        prisma.livestockDetection.count({
          where: {
            ...filters,
            status: DetectionStatus.APPROVED
          }
        }),
        
        // Count by status - Modified
        prisma.livestockDetection.count({
          where: {
            ...filters,
            status: DetectionStatus.MODIFIED
          }
        }),
        
        // Count by livestock type
        prisma.livestockDetection.groupBy({
          by: ['type'],
          where: filters,
          _sum: {
            count: true
          }
        }),
        
        // Average confidence
        prisma.livestockDetection.aggregate({
          where: filters,
          _avg: {
            averageConfidence: true
          }
        })
      ]);
      
      // Calculate the total animal count (sum of counts field)
      const totalAnimalCount = await prisma.livestockDetection.aggregate({
        where: filters,
        _sum: {
          count: true
        }
      });
      
      // Format the types data
      const typeDistribution = detectionsByType.map(item => ({
        type: item.type,
        count: item._sum.count || 0
      }));
      
      // Prepare summary data
      const summaryData = {
        totalRecords: totalCount,
        totalAnimals: totalAnimalCount._sum.count || 0,
        avgConfidence: avgConfidence._avg.averageConfidence || 0,
        statusCounts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          modified: modifiedCount
        },
        typeDistribution,
        typeCount: typeDistribution.length
      };
      

      return {
        status: 200,
        data: {
          success: true,
          data: summaryData
        }
      };
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'Unknown error fetching livestock summary';
      
      console.error('Error fetching livestock summary:', errorMessage);
      throw new Error('Failed to fetch livestock summary from the database');
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error fetching livestock summary';
    console.error('Error handling livestock summary request:', errorMessage);
    
    return {
      status: 500,
      data: {
        success: false,
        error: {
          message: errorMessage,
          details: process.env.NODE_ENV !== 'production' ? error.toString() : undefined,
        },
      }
    };
  }
};
