/**
 * Product Type module for Visual Inspection seeding
 */

import { ProductType } from '@prisma/client';
import { DATA_VOLUME } from '../config';
import { prisma } from '../utils/helpers';

export async function createProductTypes(tenantType: 'VisualInspection'): Promise<ProductType[]> {
    console.log(`Creating ${DATA_VOLUME.productTypes} product types...`);
    const productTypes: ProductType[] = [];
  
    for (let i = 0; i < DATA_VOLUME.productTypes; i++) {
        const productType = await prisma.productType.create({
            data: {
                name: `ProductType-${i + 1}`,
            },
        });
      productTypes.push(productType);
      console.log(`Created ProductType: ${productType.name}`);
    }
  
    return productTypes;
  }