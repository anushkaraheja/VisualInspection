/**
 * Location module for dynamic seeding
 */
import { Location } from '@prisma/client';
import { DATA_VOLUME } from '../config';
import { prisma } from '../utils/helpers';
import { PPE_LOCATION_NAMES, FARM_LOCATION_NAMES } from '../utils/randomData';

/**
 * Create locations for a team based on tenant type
 */
export async function createLocations(teamId: string, tenantType: 'PPE' | 'Farm') {
  console.log(`Creating ${DATA_VOLUME.locations} locations for ${tenantType} tenant...`);
  
  const locations = [] as Location[];
  const locationNames = tenantType === 'PPE' ? PPE_LOCATION_NAMES : FARM_LOCATION_NAMES;
  
  // Create up to the configured number of locations
  for (let i = 0; i < Math.min(DATA_VOLUME.locations, locationNames.length); i++) {
    const locationName = locationNames[i];
    
    const location = await prisma.location.create({
      data: {
        name: locationName,
        teamId,
        addressL1: `${100 + i} Main Street`,
        addressL2: '',
        city: `City ${i + 1}`,
        state: tenantType === 'PPE' ? 'UK' : 'US',
        zip: `${10000 + i * 100}`,
        email: `info@${locationName.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-555-${100 + i}-${1000 + i}`,
      },
    });
    
    locations.push(location);
    console.log(`Created location: ${location.name}`);
  }
  
  return locations;
}
