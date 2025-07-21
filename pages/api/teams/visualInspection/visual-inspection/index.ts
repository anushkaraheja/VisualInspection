import type { NextApiRequest, NextApiResponse } from 'next';
import { InspectionStatus, Prisma, PrismaClient } from '@prisma/client';
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
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT']);
                return res.status(405).json({
                    success: false,
                    error: {message: `Method ${method} Not Allowed`},
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

// GET /api/visualInspection-items/visual-inspection
// get all inspections or get one inspection by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;

    if (typeof id === 'string') {
        const inspection = await prisma.visualInspection.findUnique({
            where: { id },
            include: { batch: true, productionLine: true, defectLog: true},
        });

        if (!inspection) {
            return res.status(404).json({
                success: false,
                error: { message: 'Visual Inspection record not found' },
            }); 
        }

        return res.status(200).json({ success: true, data: inspection }); 
    }

    const inspections = await prisma.visualInspection.findMany({
        orderBy: { createdAt: 'desc'},
        include: { batch: true, productionLine: true, defectLog: true },
    });

    return res.status(200).json({ success: true, data: inspections }); 
}

// POST /api/visualInspection-items/visual-inspection
// create new inspection using batchId and lineId
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
    const {batchId, lineId} = req.body;

    if(!batchId || !lineId || typeof batchId !== 'string' || typeof lineId!== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'batchId and lineId are required' },
        });
    }
    const inspection = await prisma.visualInspection.create({
        data: {
            batchId, 
            lineId, 
            teamId: req.body.teamId, 
            status: 'SCHEDULED',
            defectCount: 0,
        },
    });
    
    return res.status(201).json({ success: true, data: inspection });
}

// PUT /api/visualInspection-items/visual-inspection
// edit inspection status
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
    const {id, status} = req.body;

    if (!id || typeof id !== 'string' || !status || !Object.values(InspectionStatus).includes(status)) {
        return res.status(400).json({
            success: false,
            error: { message: 'Valid ID and status are required' },
        });
    }
    const updated = await prisma.visualInspection.update({
        where: { id },
        data: { status },
    });

    return res.status(200).json({ success: true, data: updated });
}