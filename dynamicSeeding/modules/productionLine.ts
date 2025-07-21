/**
 * Production line module for Visual Inspection seeding
 */
import { DATA_VOLUME } from '../config';
import { ProductionLine } from '@prisma/client'; 
import { prisma } from '../utils/helpers';

export async function createProductionLines(tenantType: 'VisualInspection') {
    console.log(`Creating ${DATA_VOLUME.productionLines} production lines...`);
    
    const lines: ProductionLine[] = [];

    // Create up to the configured number of production Lines
    for(let i = 0; i < DATA_VOLUME.productionLines; i++) {
        const line = await prisma.productionLine.create({
            data: {
                name: `Line ${i + 1}`
            }
        });
        lines.push(line);
        console.log(`Created production line: ${line.name}`);
    }
    return lines;
}   