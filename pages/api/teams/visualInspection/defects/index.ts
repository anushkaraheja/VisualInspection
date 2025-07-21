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

        if (method === 'GET') {
            // Extract id from req.query 
            const { id } = req.query;

            if (typeof id === 'string') {
                const defect = await prisma.defect.findUnique({
                    where: { id },
                    include: {
                        comments: true, // Include related comments
                    },
                });

                if (!defect) {
                    return res.status(404).json({
                        success: false,
                        error: { message: 'Defect not found' },
                    });
                }

                return res.status(200).json({ success: true, data: defect });
            }

            // GET all defects if no id is provided
            const defects = await prisma.defect.findMany({
                orderBy: { timestamp: 'desc' },
                include: {
                    comments: true,
                },
            });

            return res.status(200).json({ success: true, data: defects });

        } else {
            res.setHeader('Allow', ['GET']);
            return res.status(405).json({
                success: false,
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