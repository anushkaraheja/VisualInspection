import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, DetectionStatus } from '@prisma/client';
import { getSession } from '@/lib/session';
import { getTeam } from 'models/team';

const prisma = new PrismaClient();

// Store processed requests to prevent duplicates
const processedRequests = new Map<string, { timestamp: number, result: any }>();

// Clean up old requests every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of processedRequests.entries()) {
    if (now - timestamp > 3600000) { // 1 hour
      processedRequests.delete(key);
    }
  }
}, 3600000); // Run cleanup every hour

// Generate a unique cache key for the request
const getRequestCacheKey = (req: NextApiRequest): string => {
  const { method, url, query } = req;
  return `${method}-${url}-${JSON.stringify(query)}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug } = req.query;

  // Check for duplicate requests in short time window
  const cacheKey = getRequestCacheKey(req);
  const cachedResult = processedRequests.get(cacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < 5000) { // 5 second cache

    return res.status(200).json(cachedResult.result);
  }


  try {
    let result;
    switch (method) {
      case 'GET':
        result = await handleGET(req, res, slug as string);
        break;
      case 'POST':
        result = await handlePOST(req, res, slug as string);
        break;
      case 'PUT':
        result = await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
    
    // Cache successful results
    if (method === 'GET' && result) {
      processedRequests.set(cacheKey, {
        timestamp: Date.now(),
        result
      });
    }
    
    return res.status(result.status || 200).json(result.data);
  } catch (error: any) {
    console.error('Error in API handler:', error);
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    return res.status(status).json({
      error: { message },
    });
  }
}

// Get livestock detection data with optional filtering
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
    


    const { 
      status, 
      type, 
      startDate, 
      endDate, 
      locationId, 
      zoneId, 
      deviceId,
      page = '1', 
      limit = '10' 
    } = req.query;

    // Build filters
    const filters: any = {
      teamId: team.id,
    };

    // Add optional filters
    if (status) {
      filters.status = status as DetectionStatus;
    }
    
    if (type) {
      filters.type = type as string;
    }
    
    // Date range filter
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

    // Location filter (requires joining through filter device -> device -> zone -> location)
    if (locationId) {
      filters.filterDevice = {
        device: {
          zone: {
            locationId: locationId as string
          }
        }
      };
    }

    // Zone filter (requires joining through filter device -> device -> zone)
    if (zoneId) {
      filters.filterDevice = {
        ...filters.filterDevice,
        device: {
          ...filters.filterDevice?.device,
          zoneId: zoneId as string
        }
      };
    }

    // Device filter (requires joining through filter device)
    if (deviceId) {
      filters.filterDevice = {
        ...filters.filterDevice,
        deviceId: deviceId as string
      };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    try {
      // Get only active livestock types for this team
      const activeTeamLivestockItems = await prisma.teamLivestockItem.findMany({
        where: {
          teamId: team.id,
          active: true
        },
        include: {
          livestock: true
        }
      });

      // Extract livestock names to filter detections
      const activeTypeNames = activeTeamLivestockItems.map(item => item.livestock.name);
      

      
      // Add active livestock filter to the query
      filters.type = {
        in: activeTypeNames
      };
      
      // Get total count for pagination

      const totalCount = await prisma.livestockDetection.count({
        where: filters,
      });


      // Get paginated data with relations

      const livestockDetections = await prisma.livestockDetection.findMany({
        where: filters,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },
          filterDevice: {
            select: {
              filterId: true,
              device: {
                select: {
                  id: true,
                  name: true,
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
              },
            },
          },
        },
      });
      


      // Format data for client consumption
      const formattedData = livestockDetections.map(detection => {
        try {
          // Ensure we have required data at each level
          if (!detection) {
            console.warn('Null detection found');
            return null;
          }
          
          const vendorName = detection.vendor?.companyName || 'Unknown';
          const deviceData = detection.filterDevice?.device;
          const zoneData = deviceData?.zone;
          const locationData = zoneData?.location;

          
          return {
            id: detection.id,
            timestamp: detection.timestamp,
            type: detection.type,
            count: detection.count,
            manualCount: detection.manualCount,
            averageConfidence: detection.averageConfidence,
            status: detection.status,
            filterRunTimeMs: detection.filterRunTimeMs,
            createdAt: detection.createdAt,
            updatedAt: detection.updatedAt,
            vendor: vendorName,
            vendorId: detection.vendor?.id || '',
            deviceName: deviceData?.name || 'Unknown Device',
            deviceId: deviceData?.id || '',
            zoneName: zoneData?.name || 'Unknown Zone',
            zoneId: zoneData?.id || '',
            locationName: locationData?.name || 'Unknown Location',
            locationId: locationData?.id || '',
            filterId: detection.filterDevice?.filterId || '',
          };
        } catch (err) {
          console.error('Error processing detection:', err);
          return null;
        }
      }).filter(item => item !== null) as any[];
      

      return {
        status: 200,
        data: {
          success: true,
          data: formattedData,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalCount / limitNum),
          },
        }
      };
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'Unknown error fetching livestock detection data';
      
      console.error('Error fetching livestock detection data:', errorMessage);
      console.error(fetchError);
      throw new Error('Failed to fetch livestock detection data from the database');
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error fetching livestock detection data';
    console.error('Error handling livestock detection request:', errorMessage);
    console.error(error);
    
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

// Create a new livestock detection record
const handlePOST = async (req: NextApiRequest, res: NextApiResponse, slug: string) => {
  try {
    // For external API calls, we'll verify by API key instead of session
    // This endpoint might be called by vendor systems

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

    const { 
      vendorId,
      timestamp,
      filterRunTimeMs,
      filterId,
      type,
      count,
      averageConfidence 
    } = req.body;

    // Validate required fields
    if (!vendorId || !timestamp || !type || !count || !filterId) {
      return {
        status: 400,
        data: {
          success: false,
          error: { message: 'Missing required fields' }
        }
      };
    }

    // Check if vendor exists and is associated with the team
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        locations: {
          some: {
            location: {
              teamId: team.id,
            },
          },
        },
      },
    });

    if (!vendor) {
      return {
        status: 404,
        data: {
          success: false,
          error: { message: 'Vendor not found or not associated with this team' }
        }
      };
    }

    // Check if filter device exists
    const filterDevice = await prisma.filterDevice.findUnique({
      where: {
        filterId: filterId,
      },
      include: {
        device: {
          include: {
            zone: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    if (!filterDevice) {
      return {
        status: 404,
        data: {
          success: false,
          error: { message: 'Filter device not found' }
        }
      };
    }

    // Verify the filter belongs to this team
    if (filterDevice.device.zone.location.teamId !== team.id) {
      return {
        status: 403,
        data: {
          success: false,
          error: { message: 'Filter device does not belong to this team' }
        }
      };
    }

    // Create new livestock detection record
    const newDetection = await prisma.livestockDetection.create({
      data: {
        vendorId,
        teamId: team.id,
        filterId,
        timestamp: new Date(timestamp),
        filterRunTimeMs: filterRunTimeMs || 0,
        type,
        count,
        averageConfidence: averageConfidence || 0,
        status: DetectionStatus.PENDING,
      },
    });


    return {
      status: 201,
      data: {
        success: true,
        data: newDetection
      }
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error creating livestock detection';
    console.error('Error handling livestock detection creation:', errorMessage);
    
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

// Update livestock detection record (approve, reject, modify)
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
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

    const { id, status, manualCount } = req.body;

    if (!id || !status) {
      return {
        status: 400,
        data: {
          success: false,
          error: { message: 'Missing required fields (id, status)' }
        }
      };
    }

    // Validate status
    if (!Object.values(DetectionStatus).includes(status as DetectionStatus)) {
      return {
        status: 400,
        data: {
          success: false,
          error: { message: 'Invalid status value' }
        }
      };
    }

    // If status is MODIFIED, manualCount is required
    if (status === DetectionStatus.MODIFIED && manualCount === undefined) {
      return {
        status: 400,
        data: {
          success: false,
          error: { message: 'Manual count is required when status is MODIFIED' }
        }
      };
    }

    // Get the existing detection record
    const existingDetection = await prisma.livestockDetection.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!existingDetection) {
      return {
        status: 404,
        data: {
          success: false,
          error: { message: 'Livestock detection record not found' }
        }
      };
    }

    // Update the detection record
    const updateData: any = {
      status: status as DetectionStatus,
      updatedAt: new Date(),
    };

    // Add manualCount if provided
    if (manualCount !== undefined) {
      updateData.manualCount = manualCount;
    }

    const updatedDetection = await prisma.livestockDetection.update({
      where: { id },
      data: updateData,
    });


    return {
      status: 200,
      data: {
        success: true,
        data: updatedDetection
      }
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Error updating livestock detection';
    console.error('Error handling livestock detection update:', errorMessage);
    
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
