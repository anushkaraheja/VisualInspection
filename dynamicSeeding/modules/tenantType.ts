/**
 * Tenant Type module for dynamic seeding
 */
import { prisma } from '../utils/helpers';

/**
 * Ensure that the required tenant types exist in the database
 */
export async function ensureTenantTypes() {
  console.log('Ensuring tenant types exist...');

  // Try to find PPE tenant type
  let ppeTenantType = await prisma.tenantType.findFirst({
    where: {
      name: 'PPE',
    },
  });

  // Create PPE tenant type if it doesn't exist
  if (!ppeTenantType) {
    ppeTenantType = await prisma.tenantType.create({
      data: {
        id: 'ppe-tenant',
        name: 'PPE',
        description: 'Personal Protective Equipment monitoring tenant',
        updatedAt: new Date(),
      },
    });
    console.log('Created PPE tenant type');
  } else {
    console.log('Found existing PPE tenant type');
  }

  // Try to find Farm tenant type
  let farmTenantType = await prisma.tenantType.findFirst({
    where: {
      name: 'Farm',
    },
  });

  // Create Farm tenant type if it doesn't exist
  if (!farmTenantType) {
    farmTenantType = await prisma.tenantType.create({
      data: {
        id: 'farm-tenant',
        name: 'Farm',
        description: 'Farm and agricultural monitoring tenant',
        updatedAt: new Date(),
      },
    });
    console.log('Created Farm tenant type');
  } else {
    console.log('Found existing Farm tenant type');
  }

  return { ppeTenantType, farmTenantType };
}

/**
 * Get tenant type by name
 */
export async function getTenantType(type: 'PPE' | 'Farm') {
  const tenantType = await prisma.tenantType.findFirst({
    where: {
      name: type,
    },
  });

  if (!tenantType) {
    throw new Error(`Tenant type ${type} not found. Please ensure tenant types are created.`);
  }

  return tenantType;
}
