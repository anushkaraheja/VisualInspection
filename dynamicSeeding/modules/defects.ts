/**
 * Defect module for Visual Inspection seeding
 */
import { DefectSeverity, Defect } from '@prisma/client'; 
import { prisma } from '../utils/helpers';
import { faker } from '@faker-js/faker';

export async function createDefects(visualInspectionId: string) {
    const count = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
    const defects: Defect[] = [];
    const locations = [
        'upper-left edge',
        'upper-right corner',
        'center',
        'bottom-left corner',
        'bottom-right corner',
        'top-center',
        'bottom-center',
        'left-center',
        'right-center'
    ];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    for (let i = 0; i < count; i++) {
      const defect = await prisma.defect.create({
        data: {
          visualInspectionId,
          type: faker.commerce.productAdjective(),
          severity: ['NOT_SET', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 5)] as DefectSeverity,
          location: randomLocation,
          imageUrl: faker.image.url(),
        },
      });
  
      defects.push(defect);
    }
  
    return defects;
}