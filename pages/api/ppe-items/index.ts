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
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}

// Get all PPE items
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Check if user is authenticated
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    try {
      const ppeItems = await prisma.pPEItem.findMany({
        orderBy: { name: 'asc' },
      });



      return res.status(200).json({
        success: true,
        data: ppeItems,
      });
    } catch (modelError) {
      console.error(
        'Error with PPEItem model, trying alternative case:',
        modelError
      );

      // Try alternative casing
      try {
        const ppeItems = await prisma.pPEItem.findMany({
          orderBy: { name: 'asc' },
        });


        return res.status(200).json({
          success: true,
          data: ppeItems,
        });
      } catch (altError) {
        console.error(
          'Error with alternate model case, trying pPEItem:',
          altError
        );

        // Try one more case variation
        try {
          const ppeItems = await prisma.pPEItem.findMany({
            orderBy: { name: 'asc' },
          });

          return res.status(200).json({
            success: true,
            data: ppeItems,
          });
        } catch (finalError) {
          console.error('Failed with all model case variations:', finalError);
          throw new Error(
            'Failed to fetch PPE items: Unable to find the correct model name'
          );
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching PPE items:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Error fetching PPE items',
        details:
          process.env.NODE_ENV !== 'production' ? error.toString() : undefined,
      },
    });
  }
};
