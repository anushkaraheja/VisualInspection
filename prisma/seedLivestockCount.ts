import { PrismaClient, DetectionStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting LivestockDetection seed script...');

  try {
    // Get existing teams, vendors, and filter devices
    const teams = await prisma.team.findMany({
      select: { id: true },
    });

    if (teams.length === 0) {
      console.error('No teams found. Please create teams first.');
      return;
    }

    const vendors = await prisma.vendor.findMany({
      select: { id: true },
    });

    if (vendors.length === 0) {
      console.error('No vendors found. Please create vendors first.');
      return;
    }

    const filterDevices = await prisma.filterDevice.findMany({
      select: { filterId: true, device: { select: { zone: { select: { location: { select: { teamId: true } } } } } } },
    });

    if (filterDevices.length === 0) {
      console.error('No filter devices found. Please create filter devices first.');
      return;
    }

    // Seed livestock types if they don't exist
    const livestockTypes = [
      'Cow', 'Sheep', 'Goat', 'Pig', 'Chicken', 'Horse', 'Duck', 'Turkey'
    ];

    // Create livestock items if they don't exist
    for (const type of livestockTypes) {
      const existingLivestock = await prisma.livestock.findUnique({
        where: { name: type },
      });

      if (!existingLivestock) {
        await prisma.livestock.create({
          data: {
            name: type,
            icon: `/icons/livestock/${type.toLowerCase()}.svg`,
            description: `${type} livestock animal`,
          },
        });
        console.log(`Created livestock type: ${type}`);
      }
    }

    // Get the created livestock items
    const livestockItems = await prisma.livestock.findMany();

    // Associate livestock with teams
    for (const team of teams) {
      for (const livestock of livestockItems) {
        const existingTeamLivestock = await prisma.teamLivestockItem.findFirst({
          where: {
            teamId: team.id,
            livestockId: livestock.id,
          },
        });

        if (!existingTeamLivestock) {
          await prisma.teamLivestockItem.create({
            data: {
              teamId: team.id,
              livestockId: livestock.id,
              active: true,
            },
          });
          console.log(`Associated livestock ${livestock.name} with team ${team.id}`);
        }
      }
    }

    // Associate livestock with vendors
    for (const vendor of vendors) {
      // Randomly select some livestock types for this vendor
      const vendorLivestockTypes = faker.helpers.arrayElements(
        livestockItems,
        faker.number.int({ min: 1, max: livestockItems.length })
      );

      for (const livestock of vendorLivestockTypes) {
        const existingVendorLivestock = await prisma.vendorLivestock.findFirst({
          where: {
            vendorId: vendor.id,
            livestockId: livestock.id,
          },
        });

        if (!existingVendorLivestock) {
          await prisma.vendorLivestock.create({
            data: {
              vendorId: vendor.id,
              livestockId: livestock.id,
              active: true,
            },
          });
          console.log(`Associated livestock ${livestock.name} with vendor ${vendor.id}`);
        }
      }
    }

    // Create livestock detection records
    //console.log('Creating livestock detection records...');
    const totalRecordsToCreate = 500;
    const batchSize = 50;
    const detectionStatusOptions = Object.values(DetectionStatus);
    
    for (let i = 0; i < totalRecordsToCreate; i += batchSize) {
      const recordsToCreate:any = [];
      
      for (let j = 0; j < batchSize && i + j < totalRecordsToCreate; j++) {
        // Randomly select a filter device
        const filterDevice = faker.helpers.arrayElement(filterDevices);
        // Get the team ID for this filter device
        const teamId = filterDevice.device.zone.location.teamId;
        
        // Randomly select a vendor
        const vendor = faker.helpers.arrayElement(vendors);
        
        // Randomly select a livestock type
        const livestockType = faker.helpers.arrayElement(livestockItems).name;
        
        // Generate random status
        const status = faker.helpers.arrayElement(detectionStatusOptions);
        
        // Generate a detection record
        const record: any = {
          vendorId: vendor.id,
          teamId: teamId,
          filterId: filterDevice.filterId,
          timestamp: faker.date.between({ 
            from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
            to: new Date() 
          }),
          filterRunTimeMs: faker.number.int({ min: 100, max: 5000 }),
          type: livestockType,
          count: faker.number.int({ min: 1, max: 200 }),
          averageConfidence: faker.number.float({ min: 0.6, max: 0.99 }),
          status: status
        };
        
        // Add manual count to MODIFIED status records
        if (status === DetectionStatus.MODIFIED) {
          record.manualCount = faker.number.int({ 
            min: Math.max(1, Math.floor(record.count * 0.8)), 
            max: Math.ceil(record.count * 1.2) 
          });
        }
        
        recordsToCreate.push(record);
      }
      
      try {
        // Use createMany with explicit typing for the records
        await prisma.livestockDetection.createMany({
          data: recordsToCreate,
          skipDuplicates: true,
        });
        
        console.log(`Created records ${i + 1} to ${Math.min(i + batchSize, totalRecordsToCreate)}`);
      } catch (createError) {
        console.error('Error creating batch of records:', createError);
        // Continue with the next batch even if this one fails
      }
    }

    console.log(`Successfully seeded ${totalRecordsToCreate} livestock detection records.`);

  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Seed script completed successfully.'))
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  });
