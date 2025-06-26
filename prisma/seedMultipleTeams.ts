import {
  PrismaClient,
  Role,
  Resource,
  DeviceType,
  DeviceStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Define PPE items to seed
const PPE_ITEMS = [
  { name: 'Hard Hat', description: 'Protective helmet for construction sites' },
  { name: 'Safety Vest', description: 'High-visibility vest' },
  { name: 'Safety Glasses', description: 'Eye protection' },
  { name: 'Safety Gloves', description: 'Hand protection' },
  { name: 'Safety Boots', description: 'Foot protection' },
  { name: 'Face Shield', description: 'Full face protection' },
  { name: 'Ear Protection', description: 'Hearing protection' },
];

async function main() {
  // Find existing tenant types instead of creating new ones
  const ppeTenantType = await prisma.tenantType.findFirst({
    where: {
      name: 'PPE',
    },
  });

  const farmTenantType = await prisma.tenantType.findFirst({
    where: {
      name: 'Farm',
    },
  });

  if (!ppeTenantType || !farmTenantType) {
    throw new Error(
      'Required tenant types not found. Please ensure "PPE" and "Farm" tenant types exist.'
    );
  }

  // Create PPE items if they don't exist
  console.log('Creating PPE items...');
  const ppeItemsMap = new Map();

  for (const item of PPE_ITEMS) {
    const existingItem = await prisma.pPEItem.findUnique({
      where: { name: item.name },
    });

    if (existingItem) {
      ppeItemsMap.set(item.name, existingItem);
      console.log(`PPE item ${item.name} already exists.`);
    } else {
      const newItem = await prisma.pPEItem.create({
        data: {
          name: item.name,
          description: item.description,
        },
      });
      ppeItemsMap.set(item.name, newItem);
      console.log(`Created PPE item: ${newItem.name}`);
    }
  }

  // Create users with hashed passwords
  const hashedPassword = await hash('1234567890', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'Biffa Admin',
      email: 'admin@biffa.com',
      firstName: 'Biffa',
      lastName: 'Admin',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Cattle USA Admin',
      email: 'admin@cattleusa.com',
      firstName: 'Cattle',
      lastName: 'Admin',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Kilcoy Admin',
      email: 'admin@kilcoy.com',
      firstName: 'Kilcoy',
      lastName: 'Admin',
      password: hashedPassword,
    },
  });

  // Create teams with their themes
  const team1 = await prisma.team.create({
    data: {
      name: 'biffa',
      slug: 'biffa',
      tenantTypeId: ppeTenantType.id,
      theme: {
        create: {
          primaryColor: '#16355D',
          secondaryColor: '#BA2025',
          logo: 'https://example.com/biffa-logo.png',
        },
      },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'cattle usa',
      slug: 'cattle-usa',
      tenantTypeId: farmTenantType.id,
      theme: {
        create: {
          primaryColor: '#3D7A42',
          secondaryColor: '#F5C64F',
          logo: 'https://example.com/cattleusa-logo.png',
        },
      },
    },
  });

  const team3 = await prisma.team.create({
    data: {
      name: 'kilcoy',
      slug: 'kilcoy',
      tenantTypeId: farmTenantType.id,
      theme: {
        create: {
          primaryColor: '#5F4339',
          secondaryColor: '#D8A863',
          logo: 'https://example.com/kilcoy-logo.png',
        },
      },
    },
  });

  // Create team roles for admin
  const team1AdminRole = await prisma.teamRole.create({
    data: {
      name: 'Admin',
      teamId: team1.id,
      permissions: {
        create: [
          {
            resource: Resource.ALL,
            action: 15, // Full permissions (CREATE|READ|UPDATE|DELETE)
          },
        ],
      },
    },
  });

  const team2AdminRole = await prisma.teamRole.create({
    data: {
      name: 'Admin',
      teamId: team2.id,
      permissions: {
        create: [
          {
            resource: Resource.ALL,
            action: 15,
          },
        ],
      },
    },
  });

  const team3AdminRole = await prisma.teamRole.create({
    data: {
      name: 'Admin',
      teamId: team3.id,
      permissions: {
        create: [
          {
            resource: Resource.ALL,
            action: 15,
          },
        ],
      },
    },
  });

  // Assign users as team admins
  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: user1.id,
      role: Role.ADMIN,
      teamRoleId: team1AdminRole.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team2.id,
      userId: user2.id,
      role: Role.ADMIN,
      teamRoleId: team2AdminRole.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team3.id,
      userId: user3.id,
      role: Role.ADMIN,
      teamRoleId: team3AdminRole.id,
    },
  });

  // Associate PPE items with teams (especially Biffa which is PPE tenant)
  console.log('Associating PPE items with teams...');
  for (const [itemName, itemData] of ppeItemsMap.entries()) {
    // For Biffa team (PPE tenant), add all PPE items
    await prisma.teamPPEItem.create({
      data: {
        teamId: team1.id,
        ppeItemId: itemData.id,
        active: true,
      },
    });
    console.log(`Associated ${itemName} with team Biffa`);

    // For other teams, only add some basic PPE items
    if (['Hard Hat', 'Safety Vest', 'Safety Gloves'].includes(itemName)) {
      await prisma.teamPPEItem.create({
        data: {
          teamId: team2.id,
          ppeItemId: itemData.id,
          active: true,
        },
      });
      console.log(`Associated ${itemName} with team Cattle USA`);

      await prisma.teamPPEItem.create({
        data: {
          teamId: team3.id,
          ppeItemId: itemData.id,
          active: true,
        },
      });
      console.log(`Associated ${itemName} with team Kilcoy`);
    }
  }

  // Create locations, zones, and devices for each team
  const teams = [
    { team: team1, namePrefix: 'Biffa' },
    { team: team2, namePrefix: 'Cattle USA' },
    { team: team3, namePrefix: 'Kilcoy' },
  ];

  for (const { team, namePrefix } of teams) {
    for (let i = 1; i <= 10; i++) {
      const location = await prisma.location.create({
        data: {
          name: `${namePrefix} Location ${i}`,
          teamId: team.id,
          addressL1: `${i} Main Street`,
          city: `City ${i}`,
          state: `State ${i}`,
          zip: `${10000 + i}`,
          phone: `555-000-${1000 + i}`,
        },
      });

      // Create 2 zones per location
      for (let j = 1; j <= 2; j++) {
        const zone = await prisma.zone.create({
          data: {
            name: `Zone ${j}`,
            description: `${namePrefix} Location ${i} Zone ${j}`,
            locationId: location.id,
          },
        });

        // Create 2 devices per zone (which makes 4 devices per location)
        for (let k = 1; k <= 2; k++) {
          const deviceType = DeviceType.CAMERA;

          const device = await prisma.device.create({
            data: {
              name: `Device ${k}`,
              deviceType,
              serialNumber: `SN-${namePrefix}-${i}-${j}-${k}`,
              model: `Model-${deviceType}`,
              manufacturer: `Manufacturer ${k}`,
              status: DeviceStatus.OFFLINE,
              zoneId: zone.id,
            },
          });

          // Only for PPE team, associate devices with PPE items through TeamPPEItem
          if (team.id === team1.id) {
            // Get team PPE items
            const teamPPEItems = await prisma.teamPPEItem.findMany({
              where: { teamId: team1.id },
              take: 3, // Use first 3 items
            });

            // Associate device with team PPE items
            for (const teamPPEItem of teamPPEItems) {
              await prisma.devicePPE.create({
                data: {
                  deviceId: device.id,
                  teamPPEItemId: teamPPEItem.id,
                },
              });
            }
          }
        }
      }
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
