import {
  PrismaClient,
  DeviceType,
  DeviceStatus,
  Role,
  Resource,
  Location,
  Device,
  Zone,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { seedPPEItems } from './seedPPEItems';

const prisma = new PrismaClient();

// Define interfaces for locations data
interface LocationData {
  name: string;
  addressL1: string;
  addressL2: string | null;
  city: string;
  state: string;
  zip: string;
  email: string | null;
  phone: string;
}

// Helper function to generate a random date within the last month
const randomDateLastMonth = (): Date => {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * 30));
  return pastDate;
};

// Helper function to generate a random MAC address
function generateMacAddress(): string {
  const macSegments: string[] = [];
  for (let j = 0; j < 6; j++) {
    const segment = Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0');
    macSegments.push(segment);
  }
  return macSegments.join(':').toUpperCase();
}

// Helper function to generate a random filter ID
function generateFilterId(): string {
  return `filter-${Math.random().toString(36).substring(2, 10)}`;
}

// Helper function to generate worker IDs based on team
function generateWorkerIds(team: string, count: number): string[] {
  const workerIds: string[] = [];

  if (team === 'iAPC') {
    // iAPC format: VIR-W-XXXX
    for (let i = 1; i <= count; i++) {
      workerIds.push(`VIR-W-${String(i).padStart(4, '0')}`);
    }
  } else {
    // CattleUSA format: FARM-WORKER-XX
    for (let i = 1; i <= count; i++) {
      workerIds.push(`FARM-WORKER-${String(i).padStart(2, '0')}`);
    }
  }

  return workerIds;
}

// iAPC locations data from seedLocations.ts
const iAPCLocations: LocationData[] = [
  {
    name: 'Ardley ERF',
    addressL1: '123 Ardley Road',
    addressL2: null,
    city: 'Ardley',
    state: 'Oxfordshire',
    zip: 'OX27 7PH',
    email: 'ardley@iAPC.com',
    phone: '01865-123456',
  },
  {
    name: 'Avonmouth ERF',
    addressL1: '456 Avonmouth Way',
    addressL2: null,
    city: 'Bristol',
    state: 'Avon',
    zip: 'BS11 9FE',
    email: 'avonmouth@iAPC.com',
    phone: '01179-234567',
  },
  {
    name: 'Beddington ERF',
    addressL1: '789 Beddington Lane',
    addressL2: null,
    city: 'Croydon',
    state: 'London',
    zip: 'CR0 4TD',
    email: 'beddington@iAPC.com',
    phone: '02086-345678',
  },
  {
    name: 'Cardiff ERF',
    addressL1: '101 Cardiff Bay',
    addressL2: null,
    city: 'Cardiff',
    state: 'Wales',
    zip: 'CF10 4GA',
    email: 'cardiff@iAPC.com',
    phone: '02920-456789',
  },
];

// CattleUSA locations data
const cattleUSALocations: LocationData[] = [
  {
    name: 'Big Sky Ranch',
    addressL1: '123 Ranch Road',
    addressL2: null,
    city: 'Billings',
    state: 'Montana',
    zip: '59101',
    email: 'bigsky@cattleusa.com',
    phone: '406-555-1234',
  },
  {
    name: 'Texas Longhorn Farm',
    addressL1: '456 Cattle Drive',
    addressL2: null,
    city: 'Austin',
    state: 'Texas',
    zip: '73301',
    email: 'texas@cattleusa.com',
    phone: '512-555-6789',
  },
  {
    name: 'Iowa Plains Dairy',
    addressL1: '789 Milk Way',
    addressL2: null,
    city: 'Des Moines',
    state: 'Iowa',
    zip: '50309',
    email: 'iowa@cattleusa.com',
    phone: '515-555-4321',
  },
];

// Farm zone types
const farmZones = [
  'Grazing Area',
  'Feed Lot',
  'Milking Station',
  'Barn',
  'Cattle Pen',
];

// Animal types for CattleUSA farm locations
const farmAnimals = [
  { name: 'Cow' },
  { name: 'Bull' },
  { name: 'Calf' },
  { name: 'Chicken' },
  { name: 'Sheep' },
  { name: 'Goat' },
  { name: 'Horse' },
];

// Main seed function
async function main() {
  try {
    console.log('Starting database seed...');

    // Clean existing data
    console.log('Cleaning existing data...');
    await cleanDatabase();

    // Create tenant types
    console.log('Creating tenant types...');
    const ppeTenantType = await prisma.tenantType.create({
      data: {
        id: 'ppe-tenant',
        name: 'PPE',
        description: 'Personal Protective Equipment monitoring tenant',
        updatedAt: new Date(),
      },
    });

    const farmTenantType = await prisma.tenantType.create({
      data: {
        id: 'farm-tenant',
        name: 'Farm',
        description: 'Farm and agricultural monitoring tenant',
        updatedAt: new Date(),
      },
    });

    // Create teams with their themes
    console.log('Creating teams with themes...');

    // Create i-APC Consulting team (PPE tenant)
    const iAPCTeam = await prisma.team.create({
      data: {
        name: 'i-APC Consulting',
        slug: 'i-apc-consulting',
        domain: 'i-apc-consulting.com',
        defaultRole: Role.MEMBER,
        tenantTypeId: ppeTenantType.id,
        theme: {
          create: {
            primaryColor: '#006E51', // iAPC green
            secondaryColor: '#5E6A71',
          },
        },
      },
    });

    // Create CattleUSA team (Farm tenant)
    const cattleUSATeam = await prisma.team.create({
      data: {
        name: 'CattleUSA',
        slug: 'cattleusa',
        domain: 'cattleusa.com',
        defaultRole: Role.MEMBER,
        tenantTypeId: farmTenantType.id,
        theme: {
          create: {
            primaryColor: '#8B4513', // Saddle brown
            secondaryColor: '#006400', // Dark green
          },
        },
      },
    });

    console.log('Teams created successfully!');

    // Create admin users for each team
    console.log('Creating admin users...');

    // Create a TeamRole for ADMIN permissions
    const iAPCAdminRole = await createAdminRole(iAPCTeam.id);
    const cattleUSAAdminRole = await createAdminRole(cattleUSATeam.id);

    // Create iAPC admin user
    const iAPCAdmin = await prisma.user.create({
      data: {
        name: 'iApc Admin',
        firstName: 'iAPC',
        lastName: 'Admin',
        email: 'admin@iAPC.com',
        password: await hash('1234567890', 10),
        TeamMember: {
          create: {
            teamId: iAPCTeam.id,
            role: Role.ADMIN,
            teamRoleId: iAPCAdminRole.id,
          },
        },
      },
    });

    // Create CattleUSA admin user
    const cattleUSAAdmin = await prisma.user.create({
      data: {
        name: 'CattleUSA Admin',
        firstName: 'CattleUSA',
        lastName: 'Admin',
        email: 'admin@cattleusa.com',
        password: await hash('1234567890', 10),
        TeamMember: {
          create: {
            teamId: cattleUSATeam.id,
            role: Role.ADMIN,
            teamRoleId: cattleUSAAdminRole.id,
          },
        },
      },
    });

    console.log('Admin users created successfully!');

    // Create PPE items
    console.log('Seeding PPE items...');
    await seedPPEItems();

    // Create locations, zones, devices for iAPC
    console.log('Creating iAPC locations and infrastructure...');
    const iAPCLocationEntities = await createLocations(
      iAPCLocations,
      iAPCTeam.id
    );
    await createZonesAndDevices(iAPCLocationEntities, iAPCTeam.id, [
      'North Zone',
      'South Zone',
      'East Zone',
      'West Zone',
    ]);

    // Create locations, zones, devices for CattleUSA
    console.log('Creating CattleUSA locations and infrastructure...');
    const cattleUSALocationEntities = await createLocations(
      cattleUSALocations,
      cattleUSATeam.id
    );
    await createZonesAndDevices(
      cattleUSALocationEntities,
      cattleUSATeam.id,
      farmZones
    );

    // Add animal data for CattleUSA
    console.log('Adding animal data for CattleUSA farms...');
    await createAnimalData(cattleUSALocationEntities);

    // Associate PPE items with teams
    console.log('Associating PPE items with teams...');
    await associatePPEItemsWithTeams(iAPCTeam.id, cattleUSATeam.id);

    // Create filter devices
    console.log('Creating filter devices...');
    await createFilterDevices(iAPCTeam.id);
    await createFilterDevices(cattleUSATeam.id);

    // Create system notifications
    console.log('Creating system notifications...');
    await createSystemNotifications(
      iAPCTeam.id,
      cattleUSATeam.id,
      iAPCAdmin.id,
      cattleUSAAdmin.id
    );

    // Generate compliance data
    console.log('Generating compliance data...');
    await generateComplianceData(iAPCTeam.id, 'iAPC');
    await generateComplianceData(cattleUSATeam.id, 'CattleUSA');

    console.log('Seed completed successfully!');
  } 
  catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to clean the database
async function cleanDatabase() {
  // Delete all data in reverse order of foreign key dependencies
  await prisma.pPECompliance.deleteMany();
  await prisma.filterDevice.deleteMany();
  await prisma.devicePPE.deleteMany();
  await prisma.teamPPEItem.deleteMany();
  await prisma.device.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.location.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.teamRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tenantType.deleteMany();
  console.log('Database cleaned successfully!');
}

// Helper function to create admin role with all permissions
async function createAdminRole(teamId: string) {
  return prisma.teamRole.create({
    data: {
      name: 'Administrator',
      teamId,
      permissions: {
        create: Object.values(Resource).map((resource) => ({
          resource: resource,
          action: 15, // All permissions: CREATE | READ | UPDATE | DELETE
        })),
      },
    },
  });
}

// Helper function to create locations
async function createLocations(
  locationData: LocationData[],
  teamId: string
): Promise<Location[]> {
  const createdLocations: Location[] = [];

  for (const location of locationData) {
    const createdLocation = await prisma.location.create({
      data: {
        name: location.name,
        addressL1: location.addressL1,
        addressL2: location.addressL2 || '',
        city: location.city,
        state: location.state,
        zip: location.zip,
        email: location.email || '',
        phone: location.phone,
        teamId,
      },
    });

    createdLocations.push(createdLocation);
  }

  return createdLocations;
}

// Helper function to create zones and devices
async function createZonesAndDevices(
  locations: Location[],
  teamId: string,
  zoneTypes: string[]
): Promise<void> {
  // For each location, create the specified zone types
  for (const location of locations) {
    // Create zones for this location
    for (const zoneName of zoneTypes) {
      const zone = await prisma.zone.create({
        data: {
          name: zoneName,
          description: `${zoneName} at ${location.name}`,
          locationId: location.id,
        },
      });

      // Create 2-3 cameras per zone
      const camerasCount = Math.floor(Math.random() * 2) + 2; // 2-3 cameras

      for (let i = 0; i < camerasCount; i++) {
        await prisma.device.create({
          data: {
            name: `${location.name} ${zoneName} Camera ${i + 1}`,
            deviceType: DeviceType.CAMERA,
            status:
              Math.random() > 0.2 ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE,
            serialNumber: `SN${Math.floor(Math.random() * 100000)}`,
            model: `Model-${Math.floor(Math.random() * 100)}`,
            manufacturer: ['Hikvision', 'Axis', 'Bosch', 'Dahua'][
              Math.floor(Math.random() * 4)
            ],
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            macAddress: generateMacAddress(),
            zoneId: zone.id,
            lastPing: new Date(),
            config: {
              rtspUrl: `rtsp://admin:password@192.168.1.${Math.floor(Math.random() * 255)}:554/Streaming/Channels/101`,
              fps: 25,
              resolution: '1920x1080',
            },
          },
        });
      }
    }
  }
}

// Helper function to create animal data for farms
async function createAnimalData(locations: Location[]): Promise<void> {
  for (const location of locations) {
    // Each location gets 3-5 animal types
    const animalTypes = [...farmAnimals];
    // Shuffle and take random number of animals
    for (let i = animalTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [animalTypes[i], animalTypes[j]] = [animalTypes[j], animalTypes[i]];
    }

    const selectedAnimals = animalTypes.slice(
      0,
      Math.floor(Math.random() * 3) + 3
    ); // 3-5 types

    for (const animal of selectedAnimals) {
      // Generate random counts for active and inactive animals
      const activeCount = Math.floor(Math.random() * 150) + 50; // 50-200 active
      const inactiveCount = Math.floor(Math.random() * 20) + 1; // 1-20 inactive

      await prisma.animal.create({
        data: {
          name: animal.name,
          icon: '', // Remove emoji icons
          locationId: location.id,
          activeAnimal: activeCount,
          inactiveAnimal: inactiveCount,
        },
      });

      console.log(`Created ${animal.name} data for ${location.name}`);
    }
  }
}

// Helper function to associate PPE items with teams
async function associatePPEItemsWithTeams(
  iAPCTeamId: string,
  cattleUSATeamId: string
): Promise<void> {
  // Get all PPE items
  const ppeItems = await prisma.pPEItem.findMany();

  // Define the specific PPE items for iAPC
  const iAPCActiveItems = ['Hard Hat', 'Gloves', 'Vest'];

  // Associate items with iAPC team - only the specified 3 items as active
  for (const item of ppeItems) {
    await prisma.teamPPEItem.create({
      data: {
        teamId: iAPCTeamId,
        ppeItemId: item.id,
        active: iAPCActiveItems.includes(item.name), // Only activate specific items
      },
    });
  }

  // Associate items with CattleUSA team
  for (const item of ppeItems) {
    await prisma.teamPPEItem.create({
      data: {
        teamId: cattleUSATeamId,
        ppeItemId: item.id,
        active: Math.random() > 0.5, // Randomly active
      },
    });
  }

  console.log(
    `Set PPE items for iAPC team: ${iAPCActiveItems.join(', ')}`
  );
}

// Helper function to create filter devices for all cameras
async function createFilterDevices(teamId: string): Promise<void> {
  // Get zones for this team
  const zones = await prisma.zone.findMany({
    where: {
      location: {
        teamId,
      },
    },
    include: {
      devices: true,
    },
  });

  // Create filter device for each camera
  for (const zone of zones) {
    for (const device of zone.devices) {
      if (device.deviceType === DeviceType.CAMERA) {
        await prisma.filterDevice.create({
          data: {
            filterId: generateFilterId(),
            deviceId: device.id,
          },
        });
      }
    }
  }
}

// Helper function to create system notifications
async function createSystemNotifications(
  iAPCTeamId: string,
  cattleUSATeamId: string,
  iAPCAdminId: string,
  cattleUSAAdminId: string
): Promise<void> {
  // Common notifications for both teams
  const commonNotifications = [
    {
      title: 'Welcome to the Platform',
      message:
        'Thank you for joining our platform. Get started by exploring the dashboard.',
      type: 'INFO',
      isGlobal: true,
      status: 'ACTIVE',
    },
    {
      title: 'System Maintenance',
      message:
        'Scheduled maintenance will occur this weekend. Expect brief service disruptions.',
      type: 'WARNING',
      isGlobal: true,
      status: 'ACTIVE',
    },
  ];

  // iAPC-specific notifications (PPE related)
  const iAPCNotifications = [
    {
      title: 'New PPE Compliance Reports Available',
      message:
        'Monthly compliance reports for all locations are now available for download.',
      type: 'INFO',
      isGlobal: false,
      status: 'ACTIVE',
    },
    {
      title: 'Safety Alert: Compliance Below Threshold',
      message:
        'Compliance rates at Ardley ERF have fallen below the acceptable threshold. Please review.',
      type: 'WARNING',
      isGlobal: false,
      status: 'ACTIVE',
    },
    {
      title: 'New Safety Regulations',
      message:
        'Updated safety regulations require additional PPE in certain zones. Please review documentation.',
      type: 'WARNING',
      isGlobal: false,
      status: 'ACTIVE',
    },
  ];

  // CattleUSA-specific notifications (Farm related)
  const cattleUSANotifications = [
    {
      title: 'Animal Health Check Reminder',
      message:
        'Monthly health checks for all livestock are due by the end of the week.',
      type: 'INFO',
      isGlobal: false,
      status: 'ACTIVE',
    },
    {
      title: 'Feed Stock Alert',
      message:
        'Feed inventory at Texas Longhorn Farm is running low. Please reorder supplies.',
      type: 'WARNING',
      isGlobal: false,
      status: 'ACTIVE',
    },
    {
      title: 'Weather Alert',
      message:
        'Severe weather warning for Montana region. Please secure all outdoor equipment and livestock.',
      type: 'WARNING',
      isGlobal: false,
      status: 'ACTIVE',
    },
  ];

  // Create common notifications for both teams
  for (const notification of commonNotifications) {
    // For iAPC
    await prisma.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isGlobal: notification.isGlobal,
        status: notification.status,
        teamId: iAPCTeamId,
        User: {
          connect: { id: iAPCAdminId },
        },
        // Mark as read for some notifications
        readBy:
          notification.type === 'INFO'
            ? {
                create: {
                  userId: iAPCAdminId,
                },
              }
            : undefined,
      },
    });

    // For CattleUSA
    await prisma.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isGlobal: notification.isGlobal,
        status: notification.status,
        teamId: cattleUSATeamId,
        User: {
          connect: { id: cattleUSAAdminId },
        },
        // Mark as read for some notifications
        readBy:
          notification.type === 'INFO'
            ? {
                create: {
                  userId: cattleUSAAdminId,
                },
              }
            : undefined,
      },
    });
  }

  // Create iAPC-specific notifications
  for (const notification of iAPCNotifications) {
    await prisma.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isGlobal: notification.isGlobal,
        status: notification.status,
        teamId: iAPCTeamId,
        User: {
          connect: { id: iAPCAdminId },
        },
        metadata: {
          category: 'safety',
          priority: notification.type === 'WARNING' ? 'high' : 'medium',
        },
      },
    });
  }

  // Create CattleUSA-specific notifications
  for (const notification of cattleUSANotifications) {
    await prisma.notification.create({
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isGlobal: notification.isGlobal,
        status: notification.status,
        teamId: cattleUSATeamId,
        User: {
          connect: { id: cattleUSAAdminId },
        },
        metadata: {
          category: 'farm-operations',
          priority: notification.type === 'WARNING' ? 'high' : 'medium',
        },
      },
    });
  }

  console.log('System notifications created successfully!');
}

// Helper function to generate compliance data
async function generateComplianceData(
  teamId: string,
  teamName: string
): Promise<void> {
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

  // Get ALL PPE items (not just team active ones) to include in compliance
  const allPPEItems = await prisma.pPEItem.findMany();

  // Generate 5 worker IDs for this team
  const workerIds = generateWorkerIds(teamName, 5);

  // First generate 10 entries per day for last month
  const pastDates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    pastDates.push(date);
  }

  // For each date, create 10 compliance records
  for (const date of pastDates) {
    for (let i = 0; i < 10; i++) {
      // Random filter device, worker
      const filterDevice =
        filterDevices[Math.floor(Math.random() * filterDevices.length)];
      const workerId = workerIds[Math.floor(Math.random() * workerIds.length)];

      // Generate random compliance data in the format used by seedComplianceData
      const compliances: Record<string, string> = {};

      // Include all PPE items in compliances with a mix of Yes/No
      for (const ppeItem of allPPEItems) {
        // Format the compliance key using the PPE item name
        const complianceKey = `${ppeItem.name.replace(/\s+/g, '')}Compliance`;

        // Mix of Yes/No with varying probabilities
        // Different PPE items have different compliance probabilities
        let complianceChance: number;

        switch (ppeItem.name) {
          case 'Hard Hat':
            complianceChance = 0.9; // 90% compliance
            break;
          case 'Safety Glasses':
            complianceChance = 0.8; // 80% compliance
            break;
          case 'Vest':
            complianceChance = 0.85; // 85% compliance
            break;
          case 'Steel-toe Boots':
            complianceChance = 0.75; // 75% compliance
            break;
          case 'Ear Protection':
            complianceChance = 0.65; // 65% compliance
            break;
          case 'Gloves':
            complianceChance = 0.7; // 70% compliance
            break;
          case 'Respiratory Mask':
            complianceChance = 0.6; // 60% compliance
            break;
          default:
            complianceChance = 0.75; // Default 75% compliance
        }

        compliances[complianceKey] =
          Math.random() < complianceChance ? 'Yes' : 'No';
      }

      // Time on that day
      const timestamp = new Date(date);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      if (filterDevice) {
        await prisma.pPECompliance.create({
          data: {
            workerId,
            filterId: filterDevice.filterId,
            timestamp,
            compliances,
          },
        });
      }
    }
  }

  // Add 20 compliance records for today
  for (let i = 0; i < 20; i++) {
    // Random filter device, worker
    const filterDevice =
      filterDevices[Math.floor(Math.random() * filterDevices.length)];
    const workerId = workerIds[Math.floor(Math.random() * workerIds.length)];

    // Generate random compliance data in the format used by seedComplianceData
    const compliances: Record<string, string> = {};

    // Include all PPE items in compliances with a mix of Yes/No
    for (const ppeItem of allPPEItems) {
      // Format the compliance key using the PPE item name
      const complianceKey = `${ppeItem.name.replace(/\s+/g, '')}Compliance`;

      // Mix of Yes/No with varying probabilities
      // Different PPE items have different compliance probabilities
      let complianceChance: number;

      switch (ppeItem.name) {
        case 'Hard Hat':
          complianceChance = 0.9; // 90% compliance
          break;
        case 'Safety Glasses':
          complianceChance = 0.8; // 80% compliance
          break;
        case 'Vest':
          complianceChance = 0.85; // 85% compliance
          break;
        case 'Steel-toe Boots':
          complianceChance = 0.75; // 75% compliance
          break;
        case 'Ear Protection':
          complianceChance = 0.65; // 65% compliance
          break;
        case 'Gloves':
          complianceChance = 0.7; // 70% compliance
          break;
        case 'Respiratory Mask':
          complianceChance = 0.6; // 60% compliance
          break;
        default:
          complianceChance = 0.75; // Default 75% compliance
      }

      compliances[complianceKey] =
        Math.random() < complianceChance ? 'Yes' : 'No';
    }

    // Current time minus random minutes
    const timestamp = new Date();
    timestamp.setMinutes(
      timestamp.getMinutes() - Math.floor(Math.random() * 180)
    ); // Within last 3 hours

    if (filterDevice) {
      await prisma.pPECompliance.create({
        data: {
          workerId,
          filterId: filterDevice.filterId,
          timestamp,
          compliances,
        },
      });
    }
  }
}

// Execute main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
