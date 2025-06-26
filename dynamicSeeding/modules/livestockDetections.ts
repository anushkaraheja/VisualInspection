/**
 * Livestock detection module for Farm tenant
 */
import { DetectionStatus, LivestockDetection } from '@prisma/client';
import { DATA_VOLUME, TIME_RANGE } from '../config';
import { prisma, getDateDaysAgo, distributeTimestampsThroughoutDay } from '../utils/helpers';
import { getRandomEntriesPerDay, getRandomConfidence } from '../utils/randomData';

/**
 * Generate livestock detection data for a Farm team
 */
export async function generateLivestockDetectionData(teamId: string) {
  console.log(`Generating livestock detection data for team ${teamId}...`);
  
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
  
  console.log(`Found ${filterDevices.length} filter devices for livestock detection`);
  
  if (filterDevices.length === 0) {
    console.log('No filter devices found, skipping livestock detection data generation');
    return [];
  }
  
  // Get team livestock items
  const teamLivestockItems = await prisma.teamLivestockItem.findMany({
    where: {
      teamId,
      active: true,
    },
    include: {
      livestock: true,
    },
  });
  
  console.log(`Found ${teamLivestockItems.length} active livestock items for team`);
  
  if (teamLivestockItems.length === 0) {
    console.log('No active livestock items found, skipping livestock detection data generation');
    return [];
  }
  
  // Get or create a vendor for livestock
  let vendor = await prisma.vendor.findFirst();
  
  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        companyName: 'Livestock Analytics Inc.',
        contactName: 'John Shepherd',
        contactEmail: 'john@livestockanalytics.com',
        contactPhone: '+1-555-123-4567',
        address: {
          street: '123 Farm Road',
          city: 'Ranchville',
          state: 'TX',
          zip: '78701',
          country: 'USA',
        },
        active: true,
        notes: 'Default vendor for livestock detection',
      },
    });
    console.log('Created default vendor for livestock detection');
  }
  
  // Generate detection data for each day
  const detectionRecords = [] as LivestockDetection[];
  const statusOptions = Object.values(DetectionStatus);
  
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
      // Random filter device and livestock
      const filterDevice = filterDevices[Math.floor(Math.random() * filterDevices.length)];
      const livestock = teamLivestockItems[Math.floor(Math.random() * teamLivestockItems.length)].livestock;
      
      // Random count and confidence
      const count = Math.floor(Math.random() * 50) + 1;
      const averageConfidence = getRandomConfidence();
      
      // Random status
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      // Create detection record
      const data: any = {
        vendorId: vendor.id,
        teamId,
        filterId: filterDevice.filterId,
        timestamp: timestamps[i],
        filterRunTimeMs: Math.floor(Math.random() * 5000) + 500,
        type: livestock.name,
        count,
        averageConfidence,
        status,
      };
      
      // Add manual count for MODIFIED status
      if (status === DetectionStatus.MODIFIED) {
        data.manualCount = Math.floor(count * (0.8 + Math.random() * 0.4));
      }
      
      const record = await prisma.livestockDetection.create({ data });
      detectionRecords.push(record);
    }
    
    console.log(`Created ${entriesForDay} livestock detection records for ${date.toDateString()}`);
  }
  
  console.log(`Generated ${detectionRecords.length} total livestock detection records`);
  return detectionRecords;
}
