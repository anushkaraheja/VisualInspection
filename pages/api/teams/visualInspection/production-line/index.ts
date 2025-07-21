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
            const { id } = req.query;

            if(typeof id === 'string') {
                const line = await prisma.productionLine.findUnique({
                    where: { id },
                });

                if(!line) {
                    return res.status(404).json({
                        success: false, 
                        error: { message: 'Production line not found' },
                    });
                }

                return res.status(200).json({ success: true, data: line });
            }
        }

        const lines = await prisma.productionLine.findMany({
            orderBy: { name: 'desc'},
        })
    } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal Server Error' },
        });
    }
}