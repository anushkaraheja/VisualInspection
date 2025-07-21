/**
 * Product module for Visual Inspection seeding
 */

import { Product } from '@prisma/client'; 
import { DATA_VOLUME } from '../config';
import { prisma } from '../utils/helpers';

/**
 * Create products for a team based on tenant type
 */
export async function createProducts(productTypeId: string) {
    console.log(`Creating ${DATA_VOLUME.products} products for ${productTypeId} tenant...`);
  
    const products = [] as Product[];

    // Create up to the configured number of products
    for (let i = 0; i < DATA_VOLUME.products; i++) {
        const product = await prisma.product.create({
            data: {
                name: `Product ${i + 1}`,
                productTypeId: productTypeId,
                // Add other necessary fields here
            },
        });
        products.push(product);
        console.log(`Created product: ${product.name}`);
    }

    return products;
}