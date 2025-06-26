import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Generate a random filter ID in the format "FILT-XXXX-XXXX-XXXX"
function generateRandomFilterId(): string {
  // Generate 3 sets of 4 random hexadecimal characters
  const part1 = randomBytes(2).toString('hex').toUpperCase();
  const part2 = randomBytes(2).toString('hex').toUpperCase();
  const part3 = randomBytes(2).toString('hex').toUpperCase();

  return `FILT-${part1}-${part2}-${part3}`;
}

async function main() {
  try {
    // Get all devices
    const devices = await prisma.device.findMany({
      include: {
        zone: true,
      },
    });

    console.log(`Found ${devices.length} devices to create filter IDs for.`);

    // Keep track of generated filter IDs to avoid duplicates
    const generatedIds = new Set<string>();

    // Create filter ID for each device
    for (const device of devices) {
      // Generate a random, unique filter ID
      let filterId: string;
      do {
        filterId = generateRandomFilterId();
      } while (generatedIds.has(filterId));

      // Add to tracking set
      generatedIds.add(filterId);

      // Create FilterDevice record that maps the device to its random filter ID
      await prisma.filterDevice.create({
        data: {
          filterId,
          deviceId: device.id,
        },
      });

      console.log(
        `Created filter ID mapping: Device ${device.name} (${device.id}) -> ${filterId}`
      );
    }

    console.log(
      'Successfully created random filter ID mappings for all devices.'
    );
  } catch (error) {
    console.error('Error creating filter ID mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
