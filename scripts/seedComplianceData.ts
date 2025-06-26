import { PrismaClient } from '@prisma/client';
import { subDays, addHours, addMinutes, format } from 'date-fns';

const prisma = new PrismaClient();

// Function to generate random compliance data using PPE items from database
async function generateRandomCompliances() {
  // Get existing PPE items from database
  const ppeItems = await prisma.pPEItem.findMany({
    select: { name: true },
  });

  // Create compliances object with random Yes/No values
  const compliances: Record<string, string> = {};

  ppeItems.forEach((item) => {
    // Format the compliance key
    const complianceKey = `${item.name.replace(/\s+/g, '')}Compliance`;
    // 80% chance of compliance, 20% chance of violation
    compliances[complianceKey] = Math.random() > 0.2 ? 'Yes' : 'No';
  });

  return compliances;
}

// Function to generate random number of entries per day
function getRandomEntriesPerDay(minEntries: number, maxEntries: number) {
  return Math.floor(Math.random() * (maxEntries - minEntries + 1)) + minEntries;
}

async function main() {
  try {
    console.log('Starting compliance data seeding...');

    // STEP 1: Delete all existing PPECompliance records
    console.log('Deleting existing compliance records...');
    const deleteResult = await prisma.pPECompliance.deleteMany({});
    console.log(`Deleted ${deleteResult.count} existing compliance records.`);

    // STEP 2: Get all filter devices for PPE tenants
    const filterDevices = await prisma.filterDevice.findMany({
      where: {
        device: {
          zone: {
            location: {
              Team: {
                TenantType: {
                  name: 'PPE',
                },
              },
            },
          },
        },
      },
      include: {
        device: {
          include: {
            ppeItems: {
              include: {
                teamPPEItem: {
                  include: {
                    ppeItem: true,
                  },
                },
              },
            },
            zone: {
              include: {
                location: {
                  include: {
                    Team: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(
      `Found ${filterDevices.length} filter devices for PPE tenants.`
    );

    // List of worker IDs to use
    const workerIds = Array.from({ length: 50 }, (_, i) => `W${10000 + i}`);

    // For each filter device, create compliance data for the past 14 days
    const twoWeeksAgo = subDays(new Date(), 14);
    let totalRecordsCreated = 0;

    // Batch size for insertions to avoid memory issues
    const BATCH_SIZE = 1000;
    let complianceBatch: any[] = [];

    for (const filterDevice of filterDevices) {
      console.log(
        `Creating compliance data for filter device: ${filterDevice.filterId}`
      );

      // For each day in the past 14 days
      for (let day = 0; day < 14; day++) {
        const currentDate = addDays(twoWeeksAgo, day);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');

        // Random number of entries for this device on this day (between 10-50)
        const entriesForDay = getRandomEntriesPerDay(10, 50);

        for (let entry = 0; entry < entriesForDay; entry++) {
          // Distribute entries throughout the day (8AM - 6PM)
          const hour = 8 + Math.floor(Math.random() * 10); // 8AM to 6PM
          const minute = Math.floor(Math.random() * 60);
          const entryTimestamp = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            hour,
            minute
          );

          // Random worker for this entry
          const workerId =
            workerIds[Math.floor(Math.random() * workerIds.length)];

          // Generate random compliance data using database PPE items
          const compliances = await generateRandomCompliances();

          // Create compliance record
          complianceBatch.push({
            workerId,
            filterId: filterDevice.filterId,
            timestamp: entryTimestamp,
            compliances,
          });

          // If batch reaches threshold, insert and reset
          if (complianceBatch.length >= BATCH_SIZE) {
            await prisma.pPECompliance.createMany({
              data: complianceBatch,
              skipDuplicates: true,
            });

            totalRecordsCreated += complianceBatch.length;
            console.log(
              `Inserted batch of ${complianceBatch.length} records. Total so far: ${totalRecordsCreated}`
            );
            complianceBatch = [];
          }
        }
      }
    }

    // Insert any remaining records
    if (complianceBatch.length > 0) {
      await prisma.pPECompliance.createMany({
        data: complianceBatch,
        skipDuplicates: true,
      });
      totalRecordsCreated += complianceBatch.length;
    }

    console.log(
      `Compliance data seeding completed. Total records created: ${totalRecordsCreated}`
    );
  } catch (error) {
    console.error('Error seeding compliance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
