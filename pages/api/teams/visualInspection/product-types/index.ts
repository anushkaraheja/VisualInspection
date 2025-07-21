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
                return await handleGET(res);
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

// GET /api/visualInspection-items/product-types
// read all product types
const handleGET = async (res: NextApiResponse) => {
    const productTypes = await prisma.productType.findMany({
        orderBy: { name: 'asc' },
    });
    
    return res.status(200).json({ success: true, data: productTypes });
}

// POST /api/visualInspection-items/product-types
// create new product type
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
    const { name } = req.body;
  
    if (!name || typeof name !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Name is required' },
        });
    }
  
    const productType = await prisma.productType.create({
        data: { name },
    });
  
    return res.status(201).json({ success: true, data: productType });
};

// PUT /api/visualInspection-items/product-types
// update a product type 
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id, name } = req.body;
  
    if (!id || !name || typeof id !== 'string' || typeof name !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Both ID and name are required' },
        });
    }
  
    const updated = await prisma.productType.update({
        where: { id },
        data: { name },
    });
  
    return res.status(200).json({ success: true, data: updated });
};

// DELETE /api/visualInspection-items/product-types
// delete a product type
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.body;
  
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'ID is required' },
      });
    }
  
    const deleted = await prisma.productType.delete({
      where: { id },
    });
  
    return res.status(200).json({ success: true, data: deleted });
  };