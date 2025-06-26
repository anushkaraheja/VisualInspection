/**
 * Farm Tenant seeding module
 */
import { TENANT_TYPE, DATABASE_OPTIONS } from '../config';
import { cleanDatabase } from '../utils/helpers';
import { createTeam, createAdminRole } from './team';
import { createAdminUser } from './users';
import { createLocations } from './locations';
import { createZonesAndDevices } from './devices';
import { createLivestockItems, associateLivestockWithTeam, createAnimalCounts } from './livestock';
import { createFilterDevices } from './filters';
import { generateLivestockDetectionData } from './livestockDetections';

/**
 * Seed a Farm tenant with all related data
 */
export async function seedFarmTenant() {
  console.log('Starting Farm tenant seeding...');
  
  try {
    // Step 1: Clean database if configured to do so
    if (DATABASE_OPTIONS.cleanBeforeSeeding) {
      console.log('Cleaning database before seeding (can be disabled in config)...');
      await cleanDatabase();
    } else {
      console.log('Skipping database cleaning (based on configuration)...');
    }
    
    // Step 2: Create team with Farm tenant type
    const team = await createTeam('Farm');
    
    // Step 3: Create admin role and user
    const adminRole = await createAdminRole(team.id);
    const adminUser = await createAdminUser(team.id, team.domain || 'example.com', adminRole.id);
    
    // Step 4: Create livestock items and associate with team
    await createLivestockItems();
    const activeItems = await associateLivestockWithTeam(team.id);
    
    // Step 5: Create locations
    const locations = await createLocations(team.id, 'Farm');
    
    // Step 6: Create zones and devices
    const { zones, devices } = await createZonesAndDevices(locations, 'Farm');
    
    // Step 7: Create filter devices
    const filterDevices = await createFilterDevices(team.id);
    
    // Step 8: Create animal counts for locations
    const animals = await createAnimalCounts(locations, activeItems);
    
    // Step 9: Generate livestock detection data
    await generateLivestockDetectionData(team.id);
    
    console.log('Farm tenant seeded successfully!');
    return {
      team,
      adminUser,
      locations,
      zones,
      devices,
      filterDevices,
      activeItems,
      animals,
    };
  } catch (error) {
    console.error('Error seeding Farm tenant:', error);
    throw error;
  }
}
