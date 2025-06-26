/**
 * Main entry point for dynamic seeding
 */
import { TENANT_TYPE, DATABASE_OPTIONS } from './config';
import { ensureTenantTypes } from './modules/tenantType';
import { seedPPETenant } from './modules/ppeTenantSeeder';
import { seedFarmTenant } from './modules/farmTenantSeeder';
import { prisma } from './utils/helpers';

/**
 * Main function to run the dynamic seeder
 */
async function main() {
  try {
    console.log('Starting dynamic seeding process...');
    console.log(`Tenant type: ${TENANT_TYPE}`);
    console.log(`Clean database before seeding: ${DATABASE_OPTIONS.cleanBeforeSeeding}`);
    
    // Ensure tenant types exist
    await ensureTenantTypes();
    
    // Seed based on tenant type
    if (TENANT_TYPE === 'PPE') {
      await seedPPETenant();
    } else if (TENANT_TYPE === 'Farm') {
      await seedFarmTenant();
    } else {
      throw new Error(`Invalid tenant type: ${TENANT_TYPE}. Must be 'PPE' or 'Farm'.`);
    }
    
    console.log('Dynamic seeding completed successfully!');
  } catch (error) {
    console.error('Error during dynamic seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

export default main;
