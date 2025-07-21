/**
 * Downtime module for Visual Inspection seeding
*/
import { DATA_VOLUME } from '../config';
import { Downtime } from '@prisma/client'; 
import { prisma } from '../utils/helpers';

export async function createDowntime(lineId: string) {
    console.log(`Creating downtime for production line: {lineId}`);
    
    const downtime = await prisma.downtime.create({
        data: {
            duration: Math.floor(Math.random() * 60) + 10, // Random duration between 10–70 mins
            description: 'Unexpected halt due to maintenance',
            productionLine: {
                connect: { id: lineId }
            }
        }
    });
    console.log(`Downtime created for line ${lineId}`);
    return downtime;
}
