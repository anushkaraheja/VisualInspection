import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script migrates from the old DevicePPE model structure
 * to the new structure that connects devices to TeamPPEItems
 */
async function main() {
  try {
    console.log('Starting DevicePPE migration...');

    // Get all devices with their PPE items and zone information (to get team)
    const devicesWithPPE = await prisma.device.findMany({
      where: {
        ppeItems: {
          some: {},
        },
      },
      include: {
        ppeItems: {
          include: {
            teamPPEItem: true,
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
    });

    console.log(
      `Found ${devicesWithPPE.length} devices with PPE items to migrate`
    );

    let migratedCount = 0;
    let skippedCount = 0;

    // Process each device
    for (const device of devicesWithPPE) {
      const teamId = device.zone?.location?.Team?.id;

      if (!teamId) {
        console.log(`Skipping device ${device.id}: No team found`);
        skippedCount++;
        continue;
      }

      // Get all PPE items for the team
      const teamPPEItems = await prisma.teamPPEItem.findMany({
        where: { teamId },
        include: { ppeItem: true },
      });

      // Map PPE item IDs to their corresponding TeamPPEItem IDs
      const ppeItemToTeamPPEItemMap = new Map(
        teamPPEItems.map((tpi) => [tpi.ppeItemId, tpi.id])
      );

      // Process each PPE item for this device
      for (const oldPPE of device.ppeItems) {
        const ppeItemId = oldPPE.teamPPEItemId;

        // Check if a TeamPPEItem already exists for this PPE item
        let teamPPEItemId = ppeItemToTeamPPEItemMap.get(ppeItemId);

        if (!teamPPEItemId) {
          console.log(
            `Creating TeamPPEItem for team ${teamId} and PPE item ${ppeItemId}`
          );

          // Create TeamPPEItem if it doesn't exist
          const newTeamPPEItem = await prisma.teamPPEItem.create({
            data: {
              teamId,
              ppeItemId,
              active: true,
            },
          });

          teamPPEItemId = newTeamPPEItem.id;
        }

        // Create new DevicePPE entry with teamPPEItemId
        await prisma.devicePPE.create({
          data: {
            deviceId: device.id,
            teamPPEItemId,
          },
        });

        migratedCount++;
      }
    }

    console.log(
      `Migration complete: ${migratedCount} PPE items migrated, ${skippedCount} devices skipped`
    );
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
