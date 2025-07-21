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

// GET /api/visualInspection-items/products?id=xyz
// get all products or get one product by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;

    if (typeof id === 'string') {
        const product = await prisma.product.findUnique({
            where: { id },
        });
  
        if (!product) {
            return res.status(404).json({
                success: false,
                error: { message: 'Product not found' },
            });
        }
  
        return res.status(200).json({ success: true, data: product });
    }

    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: products });
};

// POST /api/visualInspection-items/products
// create new product
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
    const { name, productTypeId } = req.body;

    if (!name || !productTypeId || typeof name !== 'string' || typeof productTypeId !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Name and productTypeId are required' },
        });
    }

    const product = await prisma.product.create({
        data: { name, productTypeId },
    });

    return res.status(201).json({ success: true, data: product });
};

// PUT /api/visualInspection-items/products
// edit product details
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id, name } = req.body;

    if (!id || !name || typeof id !== 'string' || typeof name !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'ID and name are required' },
        });
    }

    const updated = await prisma.product.update({
        where: { id },
        data: { name },
    });

    return res.status(200).json({ success: true, data: updated });
};

// DELETE /api/visualInspection-items/products
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.body;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'ID is required' },
        });
    }

    const deleted = await prisma.product.delete({
        where: { id },
    });

    return res.status(200).json({ success: true, data: deleted });
};