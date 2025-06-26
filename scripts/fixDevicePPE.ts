import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting DevicePPE fix...');

    // Step 1: Delete all existing DevicePPE records
    const deleteResult = await prisma.devicePPE.deleteMany({});
    console.log(`Deleted ${deleteResult.count} existing DevicePPE records`);

    // Step 2: Find all devices, group by team
    const devices = await prisma.device.findMany({
      where: {
        deviceType: 'CAMERA',
      },
      include: {
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
    });

    console.log(`Found ${devices.length} devices to process`);

    // Step 3: Get all TeamPPEItems for faster lookup
    const teamPPEItems = await prisma.teamPPEItem.findMany({
      include: {
        ppeItem: true,
      },
    });

    console.log(`Found ${teamPPEItems.length} TeamPPEItems to use`);

    // Group TeamPPEItems by teamId for easier access
    const teamPPEItemsByTeam = teamPPEItems.reduce(
      (acc, item) => {
        if (!acc[item.teamId]) {
          acc[item.teamId] = [];
        }
        acc[item.teamId].push(item);
        return acc;
      },
      {} as Record<string, typeof teamPPEItems>
    );

    // Step 3: Get all important PPE items (query instead of hardcoding)
    const importantPPEItems = await prisma.pPEItem.findMany({
      where: {
        OR: [
          { name: { contains: 'Hat', mode: 'insensitive' } },
          { name: { contains: 'Helmet', mode: 'insensitive' } },
          { name: { contains: 'Vest', mode: 'insensitive' } },
          { name: { contains: 'Glass', mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true },
    });

    const importantPPENames = importantPPEItems.map((item) => item.name);
    console.log(
      `Found ${importantPPEItems.length} important PPE items: ${importantPPENames.join(', ')}`
    );

    // Step 4: Create new DevicePPE records
    let createdCount = 0;
    let skippedCount = 0;

    for (const device of devices) {
      // Extract team from device's relationships
      const teamId = device.zone?.location?.Team?.id;

      if (!teamId) {
        console.log(`Skipping device ${device.id}: No team found`);
        skippedCount++;
        continue;
      }

      // Get TeamPPEItems for this team
      const teamItems = teamPPEItemsByTeam[teamId] || [];

      if (teamItems.length === 0) {
        console.log(
          `Skipping device ${device.id}: No TeamPPEItems found for team ${teamId}`
        );
        skippedCount++;
        continue;
      }

      // Add each TeamPPEItem to the device
      for (const teamPPEItem of teamItems) {
        // Only associate important PPE items from the database
        if (!importantPPENames.includes(teamPPEItem.ppeItem.name)) {
          continue;
        }

        await prisma.devicePPE.create({
          data: {
            deviceId: device.id,
            teamPPEItemId: teamPPEItem.id,
          },
        });

        createdCount++;
      }
    }

    console.log(
      `DevicePPE fix completed: ${createdCount} associations created, ${skippedCount} devices skipped`
    );
  } catch (error) {
    console.error('Error during DevicePPE fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
