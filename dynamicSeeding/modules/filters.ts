/**
 * Filter devices module for dynamic seeding
 */
import { FilterDevice } from '@prisma/client';
import { prisma, generateFilterId } from '../utils/helpers';

/**
 * Create filter devices for all cameras
 */
export async function createFilterDevices(teamId: string) {
  console.log(`Creating filter devices for team ${teamId}...`);
  
  // Get all devices for this team
  const devices = await prisma.device.findMany({
    where: {
      deviceType: 'CAMERA',
      zone: {
        location: {
          teamId,
        },
      },
    },
  });
  
  console.log(`Found ${devices.length} cameras to create filter devices for`);
  
  const filterDevices = [] as FilterDevice[];
  
  // Create filter device for each camera
  for (const device of devices) {
    const filterId = generateFilterId();
    
    const filterDevice = await prisma.filterDevice.create({
      data: {
        filterId,
        deviceId: device.id,
      },
    });
    
    filterDevices.push(filterDevice);
    console.log(`Created filter device: ${filterDevice.filterId} for device ${device.name}`);
  }
  
  return filterDevices;
}
