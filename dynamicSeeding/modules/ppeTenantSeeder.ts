/**
 * PPE Tenant seeding module
 */
import { TENANT_TYPE, DATABASE_OPTIONS } from '../config';
import { cleanDatabase } from '../utils/helpers';
import { createTeam, createAdminRole } from './team';
import { createAdminUser } from './users';
import { createLocations } from './locations';
import { createZonesAndDevices } from './devices';
import { createPPEItems, associatePPEItemsWithTeam } from './ppeItems';
import { createFilterDevices } from './filters';
import { generateComplianceData } from './complianceData';

/**
 * Seed a PPE tenant with all related data
 */
export async function seedPPETenant() {
  console.log('Starting PPE tenant seeding...');
  
  try {
    // Step 1: Clean database if configured to do so
    if (DATABASE_OPTIONS.cleanBeforeSeeding) {
      console.log('Cleaning database before seeding (can be disabled in config)...');
      await cleanDatabase();
    } else {
      console.log('Skipping database cleaning (based on configuration)...');
    }
    
    // Step 2: Create team with PPE tenant type
    const team = await createTeam('PPE');
    
    // Step 3: Create admin role and user
    const adminRole = await createAdminRole(team.id);
    const adminUser = await createAdminUser(team.id, team.domain || 'example.com', adminRole.id);
    
    // Step 4: Create PPE items and associate with team
    await createPPEItems();
    const activeItems = await associatePPEItemsWithTeam(team.id);
    
    // Step 5: Create locations
    const locations = await createLocations(team.id, 'PPE');
    
    // Step 6: Create zones and devices
    const { zones, devices } = await createZonesAndDevices(locations, 'PPE');
    
    // Step 7: Create filter devices
    const filterDevices = await createFilterDevices(team.id);
    
    // Step 8: Generate compliance data
    await generateComplianceData(team.id);
    
    console.log('PPE tenant seeded successfully!');
    return {
      team,
      adminUser,
      locations,
      zones,
      devices,
      filterDevices,
      activeItems,
    };
  } catch (error) {
    console.error('Error seeding PPE tenant:', error);
    throw error;
  }
}
