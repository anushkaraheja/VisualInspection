import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    try {
        const session = await getSession(req, res);
        if (!session?.user?.email) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
        }

        switch (method) {
            case 'GET':
                return await handleGET(req, res);
            case 'POST':
                return await handlePOST(req, res);
            case 'PUT':
                return await handlePUT(req, res);
            case 'DELETE':
                return await handleDELETE(req, res);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({
                    error: { message: `Method ${method} Not Allowed` },
                });
        }
    } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal Server Error' },
        });
    }
}

// GET /api/visualInspection-items/batches?id=xyz
// get all batches or get one batch by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;

    if (typeof id === 'string') {
        const batch = await prisma.batch.findUnique({
            where: { id },
        });
  
        if (!batch) {
            return res.status(404).json({
                success: false,
                error: { message: 'Batch not found' },
            });
        }
  
        return res.status(200).json({ success: true, data: batch });
    }

    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ success: true, data: batches });
};

// POST /api/visualInspection-items/batches
// create new batch
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
    const { productIds, productCount } = req.body;

    if (!productCount || typeof productCount !== 'number' || !productIds || !Array.isArray(productIds)) {
        return res.status(400).json({
            success: false,
            error: { message: 'Product ids (string[]) and product count (number) are required' },
        });
    }

    const product = await prisma.batch.create({
        data: { 
            productCount, 
            status: 'SCHEDULED',
            products: {
                connect: productIds.map(id => ({ id })),
            },
        },
    });

    return res.status(201).json({ success: true, data: product });
};

const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id, productCount, status, productIds } = req.body;
  
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'id (string) is required' },
      });
    }
  
    const updateData: any = {};
    if (typeof productCount === 'number') updateData.productCount = productCount;
    if (typeof status === 'string') updateData.status = status;
  
    try {
        const updated = await prisma.batch.update({
            where: { id },
            data: updateData,
        });
  
        // If productIds are provided, reassign batch
        if (Array.isArray(productIds) && productIds.every(pid => typeof pid === 'string')) {
            // Clear current batch links
            await prisma.product.updateMany({
            where: { batchId: id },
            data: { batchId: null },
            });
    
            // Assign new products
            await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { batchId: id },
            });
        }
  
        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Batch update failed:', error);
        return res.status(500).json({
            success: false,
            error: { message: error.message || 'Batch update failed' },
        });
    }
};

const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.body;
  
    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'id (string) is required' },
        });
    }
  
    // Optional: remove batch assignment from products
    await prisma.product.updateMany({
        where: { batchId: id },
        data: { batchId: null },
    });
  
    // Delete batch
    const deleted = await prisma.batch.delete({
        where: { id },
    });
  
    return res.status(200).json({ success: true, data: deleted });
};