/**
 * Compliance data module for PPE tenant
 */
import { PPECompliance } from '@prisma/client';
import { DATA_VOLUME, TIME_RANGE } from '../config';
import { prisma, getDateDaysAgo, distributeTimestampsThroughoutDay } from '../utils/helpers';
import { generateWorkerIds, generateRandomCompliances, getRandomEntriesPerDay } from '../utils/randomData';

/**
 * Generate compliance data for a PPE team
 */
export async function generateComplianceData(teamId: string) {
  console.log(`Generating compliance data for team ${teamId}...`);
  
  // Get filter devices for this team
  const filterDevices = await prisma.filterDevice.findMany({
    where: {
      device: {
        zone: {
          location: {
            teamId,
          },
        },
      },
    },
  });
  
  console.log(`Found ${filterDevices.length} filter devices for compliance data`);
  
  if (filterDevices.length === 0) {
    console.log('No filter devices found, skipping compliance data generation');
    return [];
  }
  
  // Get team PPE items
  const teamPPEItems = await prisma.teamPPEItem.findMany({
    where: {
      teamId,
      active: true,
    },
    include: {
      ppeItem: true,
    },
  });
  
  console.log(`Found ${teamPPEItems.length} active PPE items for team`);
  
  if (teamPPEItems.length === 0) {
    console.log('No active PPE items found, skipping compliance data generation');
    return [];
  }
  
  // Extract PPE item names
  const ppeItemNames = teamPPEItems.map(item => item.ppeItem.name);
  
  // Generate worker IDs
  const workerIds = generateWorkerIds('PPE', DATA_VOLUME.workersCount);
  
  // Generate compliance data for each day
  const complianceRecords = [] as PPECompliance[];
  
  for (let day = 0; day < TIME_RANGE.daysOfData; day++) {
    const date = getDateDaysAgo(TIME_RANGE.daysOfData - 1 - day);
    
    // Random number of entries for this day
    const entriesForDay = getRandomEntriesPerDay(
      TIME_RANGE.entriesPerDay.min,
      TIME_RANGE.entriesPerDay.max
    );
    
    // Distribute timestamps throughout the day
    const timestamps = distributeTimestampsThroughoutDay(date, entriesForDay);
    
    for (let i = 0; i < entriesForDay; i++) {
      // Random filter device and worker
      const filterDevice = filterDevices[Math.floor(Math.random() * filterDevices.length)];
      const workerId = workerIds[Math.floor(Math.random() * workerIds.length)];
      
      // Generate random compliance data
      const compliances = generateRandomCompliances(ppeItemNames);
      
      // Create compliance record
      const record = await prisma.pPECompliance.create({
        data: {
          workerId,
          filterId: filterDevice.filterId,
          timestamp: timestamps[i],
          compliances,
        },
      });
      
      complianceRecords.push(record);
    }
    
    console.log(`Created ${entriesForDay} compliance records for ${date.toDateString()}`);
  }
  
  console.log(`Generated ${complianceRecords.length} total compliance records`);
  return complianceRecords;
}
