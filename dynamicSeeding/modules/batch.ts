/**
 * Batch creation module for Visual Inspection seeding
 */

import { prisma } from '../utils/helpers';
import { BatchStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { DATA_VOLUME } from '../config';



// Get a random status from the enum
function getRandomBatchStatus(): BatchStatus {
  const statuses: BatchStatus[] = ['SCHEDULED', 'IN_PRODUCTION', 'COMPLETED'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Create batches for a given list of products of the same type
 * @param products - The ID of the product to associate the batch with
 * @param productCount - How many products are in a batch 
 */
export async function createBatch(products: { id: string; productTypeId: string }[]) {
  if (products.length === 0) return null;

  const randomStatus = getRandomBatchStatus();

  const batch = await prisma.batch.create({
    data: {
      productCount: products.length,
      status: randomStatus,
      products: {
        connect: products.map(p => ({ id: p.id })),
      },
      BatchProductType: {
        create: {
          productType: {
            connect: { id: products[0].productTypeId },
          },
        },
      },
    },
  });

  console.log(`✅ Created batch with ${products.length} products (type: ${products[0].productTypeId})`);
  return batch;
}