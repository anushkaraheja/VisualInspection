import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Main seeding function that orchestrates the execution of different seed scripts
 */
async function main() {
  console.log('Starting main seeding process...');

  try {
    // Step 1: Add filter IDs to devices
    console.log('\n--- Step 1: Adding filter IDs to devices ---');
    await runScript('../scripts/addFilterIds.ts');

    // Step 2: Fix DevicePPE to properly use teamPPEItems
    console.log('\n--- Step 2: Fixing DevicePPE associations ---');
    await runScript('../scripts/fixDevicePPE.ts');

    // Step 3: Seed compliance data
    console.log('\n--- Step 3: Seeding compliance data ---');
    await runScript('../scripts/seedComplianceData.ts');

    console.log('\n--- All seeding operations completed successfully ---');
  } catch (error: any) {
    console.error('Error during seeding process:', error?.message || error);
    process.exit(1);
  }
}

/**
 * Helper function to run a script using ts-node
 */
async function runScript(scriptPath: string): Promise<void> {
  const fullPath = path.resolve(__dirname, scriptPath);

  try {
    console.log(`Running script: ${scriptPath}`);
    execSync(`npx ts-node ${fullPath}`, { stdio: 'inherit' });
    console.log(`Successfully executed: ${scriptPath}`);

    return Promise.resolve();
  } catch (error: any) {
    console.error(`Error executing ${scriptPath}:`, error?.message || error);
    return Promise.reject(error);
  }
}

// Execute the main seeding function
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Fatal error during seed execution:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
