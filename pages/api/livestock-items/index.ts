import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

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
      default:
        res.setHeader('Allow', ['GET']);
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

// Get all livestock items
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Check if user is authenticated
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    try {
      const livestockItems = await prisma.livestock.findMany({
        orderBy: { name: 'asc' },
      });


      return res.status(200).json({
        success: true,
        data: livestockItems,
      });
    } catch (fetchError) {
      // Safely handle the error
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'Unknown error fetching livestock items';
      
      console.error('Error fetching livestock items:', errorMessage);
      throw new Error('Failed to fetch livestock items from the database');
    }
  } catch (error: any) {
    // Ensure we have a valid error object before accessing properties
    const errorMessage = error instanceof Error ? error.message : 'Error fetching livestock items';
    const errorDetails = error instanceof Error && error.toString ? error.toString() : undefined;
    
    console.error('Error handling livestock items request:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? errorDetails : undefined,
      },
    });
  }
};
