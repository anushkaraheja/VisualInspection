import { DeviceStatus, DeviceType, PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define TypeScript interfaces matching schema models
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

interface ZoneData {
  name: string;
  locationIndex: number;
}

interface CameraModel {
  manufacturer: string;
  models: string[];
}

// ======= SEED DATA =======

// Location data - using the requested ERF/EFW facilities
const locations: LocationData[] = [
  {
    name: 'Ardley ERF',
    addressL1: '123 Ardley Road',
    addressL2: null,
    city: 'Ardley',
    state: 'Oxfordshire',
    zip: 'OX27 7PH',
    email: 'ardley@viridor.com',
    phone: '01865-123456',
  },
  {
    name: 'Avonmouth ERF',
    addressL1: '456 Avonmouth Way',
    addressL2: null,
    city: 'Bristol',
    state: 'Avon',
    zip: 'BS11 9FE',
    email: 'avonmouth@viridor.com',
    phone: '01179-234567',
  },
  {
    name: 'Beddington ERF',
    addressL1: '789 Beddington Lane',
    addressL2: null,
    city: 'Croydon',
    state: 'London',
    zip: 'CR0 4TD',
    email: 'beddington@viridor.com',
    phone: '02086-345678',
  },
  {
    name: 'Cardiff ERF',
    addressL1: '101 Cardiff Bay',
    addressL2: null,
    city: 'Cardiff',
    state: 'Wales',
    zip: 'CF10 4GA',
    email: 'cardiff@viridor.com',
    phone: '02920-456789',
  },
  {
    name: 'Dunbar ERF',
    addressL1: '202 Dunbar Coast',
    addressL2: null,
    city: 'Dunbar',
    state: 'East Lothian',
    zip: 'EH42 1QT',
    email: 'dunbar@viridor.com',
    phone: '01368-567890',
  },
  {
    name: 'Exeter EFW',
    addressL1: '303 Exeter Road',
    addressL2: null,
    city: 'Exeter',
    state: 'Devon',
    zip: 'EX2 8YZ',
    email: 'exeter@viridor.com',
    phone: '01392-678901',
  },
  {
    name: 'Glasgow RREC',
    addressL1: '404 Glasgow Street',
    addressL2: null,
    city: 'Glasgow',
    state: 'Scotland',
    zip: 'G51 4TQ',
    email: 'glasgow@viridor.com',
    phone: '0141-789012',
  },
  {
    name: 'Lakeside ERF',
    addressL1: '505 Lakeside Drive',
    addressL2: null,
    city: 'Slough',
    state: 'Berkshire',
    zip: 'SL3 7FG',
    email: 'lakeside@viridor.com',
    phone: '01753-890123',
  },
  {
    name: 'Peterborough ERF',
    addressL1: '606 Fengate',
    addressL2: null,
    city: 'Peterborough',
    state: 'Cambridgeshire',
    zip: 'PE1 5XG',
    email: 'peterborough@viridor.com',
    phone: '01733-901234',
  },
  {
    name: 'Runcorn ERF',
    addressL1: '707 Picow Farm Road',
    addressL2: null,
    city: 'Runcorn',
    state: 'Cheshire',
    zip: 'WA7 4UU',
    email: 'runcorn@viridor.com',
    phone: '01928-012345',
  },
  {
    name: 'Thameside ERF',
    addressL1: '808 Thames Road',
    addressL2: null,
    city: 'Thurrock',
    state: 'Essex',
    zip: 'RM18 7DH',
    email: 'thameside@viridor.com',
    phone: '01375-123456',
  },
  {
    name: 'Westfield ERF',
    addressL1: '909 Westfield Lane',
    addressL2: null,
    city: 'Westfield',
    state: 'Fife',
    zip: 'KY8 3PQ',
    email: 'westfield@viridor.com',
    phone: '01592-234567',
  },
];

// Create zones for each location - North, South, East, West for each
const zones: ZoneData[] = [];

// Generate cardinal zones for each location
for (let i = 0; i < locations.length; i++) {
  zones.push({ name: 'North Zone', locationIndex: i });
  zones.push({ name: 'South Zone', locationIndex: i });
  zones.push({ name: 'East Zone', locationIndex: i });
  zones.push({ name: 'West Zone', locationIndex: i });
}

// Camera model data
const cameraModels: CameraModel[] = [
  {
    manufacturer: 'Hikvision',
    models: ['DS-2CD2345-I', 'DS-2CD2T87G2-L', 'DS-2DE4425IW-DE'],
  },
  { manufacturer: 'Axis', models: ['P3225-LV', 'P3248-LVE', 'Q6215-LE'] },
  {
    manufacturer: 'Bosch',
    models: ['DINION IP 5000', 'FLEXIDOME IP 8000i', 'AUTODOME IP 5000i'],
  },
  {
    manufacturer: 'Dahua',
    models: ['IPC-HDBW5831E-Z5E', 'IPC-HDW5231R-Z', 'DH-SD59230U-HNI'],
  },
];

// ======= HELPER FUNCTIONS =======

/**
 * Generate camera configuration based on manufacturer
 */
function generateCameraConfig(manufacturer: string): Record<string, any> {
  switch (manufacturer.toLowerCase()) {
    case 'hikvision':
      return {
        connectionType: 'rtsp',
        rtspUrl:
          'rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101',
        fps: 25,
        resolution: '1920x1080',
        authenticated: true,
        username: 'admin',
        password: 'password123',
      };
    case 'axis':
      return {
        connectionType: 'rtsp',
        rtspUrl: 'rtsp://root:root@192.168.1.101:554/axis-media/media.amp',
        fps: 30,
        resolution: '2560x1440',
        authenticated: true,
        username: 'root',
        password: 'root',
      };
    // ...other cases...
    default:
      return {
        connectionType: 'rtsp',
        rtspUrl: 'rtsp://admin:admin@192.168.1.100:554/stream',
        fps: 20,
        resolution: '1920x1080',
        authenticated: true,
        username: 'admin',
        password: 'admin',
      };
  }
}

/**
 * Generate a random MAC address
 */
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

// ======= SEEDING FUNCTIONS =======

/**
 * Create location if it doesn't exist
 */
async function seedLocation(locationData: LocationData, teamId: string) {
  try {
    // Check if location exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: locationData.name,
        teamId,
      },
    });

    if (existingLocation) {
      console.log(`Location "${locationData.name}" already exists.`);
      return existingLocation;
    }

    // Create location with correct schema fields
    const location = await prisma.location.create({
      data: {
        name: locationData.name,
        addressL1: locationData.addressL1,
        addressL2: locationData.addressL2 || '',
        city: locationData.city,
        state: locationData.state,
        zip: locationData.zip,
        email: locationData.email || '',
        phone: locationData.phone,
        teamId,
      },
    });

    console.log(`Created location: ${locationData.name}`);
    return location;
  } catch (error) {
    console.error(`Error creating location ${locationData.name}:`, error);
    throw error;
  }
}

/**
 * Create zone if it doesn't exist
 */
async function seedZone(zoneData: ZoneData, locationId: string) {
  try {
    // Check if zone exists
    const existingZone = await prisma.zone.findFirst({
      where: {
        name: zoneData.name,
        locationId,
      },
    });

    if (existingZone) {
      console.log(`Zone "${zoneData.name}" already exists.`);
      return existingZone;
    }

    // Create zone with correct schema fields
    const zone = await prisma.zone.create({
      data: {
        name: zoneData.name,
        locationId,
      },
    });

    console.log(`Created zone: ${zoneData.name}`);
    return zone;
  } catch (error) {
    console.error(`Error creating zone ${zoneData.name}:`, error);
    throw error;
  }
}

/**
 * Create a camera device
 */
async function seedCamera(zoneName: string, index: number, zoneId: string) {
  try {
    const cameraName = `Camera ${zoneName}-${index + 1}`;

    // Check if camera exists
    const existingCamera = await prisma.device.findFirst({
      where: {
        name: cameraName,
        zoneId,
      },
    });

    if (existingCamera) {
      console.log(`Camera "${cameraName}" already exists.`);
      return existingCamera;
    }

    // Select random camera model
    const manufacturerIdx = Math.floor(Math.random() * cameraModels.length);
    const manufacturer = cameraModels[manufacturerIdx].manufacturer;
    const modelIdx = Math.floor(
      Math.random() * cameraModels[manufacturerIdx].models.length
    );
    const model = cameraModels[manufacturerIdx].models[modelIdx];

    // Generate IP and MAC address
    const ipAddressBase = '192.168.1.';
    const ipAddressSuffix = Math.floor(Math.random() * 253) + 1;
    const ipAddress = ipAddressBase + ipAddressSuffix;
    const macAddress = generateMacAddress();

    // 80% online, 20% offline
    const status =
      Math.random() > 0.2 ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    const config = generateCameraConfig(manufacturer);

    // Create camera with Prisma's standard create method using proper enum values
    const camera = await prisma.device.create({
      data: {
        name: cameraName,
        deviceType: DeviceType.CAMERA, // Using the enum value directly
        status: status, // Using the enum value for status
        ipAddress,
        macAddress,
        manufacturer,
        model,
        serialNumber: `SN${Math.floor(Math.random() * 10000)}`,
        config,
        zoneId,
        lastPing:
          status === DeviceStatus.ONLINE
            ? new Date()
            : new Date(Date.now() - 86400000),
      },
    });

    console.log(`Created camera: ${cameraName}`);
    return camera;
  } catch (error) {
    console.error(`Error creating camera:`, error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Find the first team in the database
    const team = await prisma.team.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!team) {
      console.error(
        '❌ No team found in database. Please create a team first.'
      );
      return;
    }

    console.log(`✅ Using existing team: ${team.name} (${team.slug})`);

    // Seed locations
    console.log('Creating locations...');
    const createdLocations: any[] = [];
    for (const locationData of locations) {
      try {
        const location = await seedLocation(locationData, team.id);
        if (location) {
          createdLocations.push(location);
        }
      } catch (error) {
        console.error(`Failed to create location ${locationData.name}:`, error);
      }
    }
    console.log(`✅ Created ${createdLocations.length} locations`);

    // Seed zones
    console.log('Creating zones...');
    const createdZones: any[] = [];
    for (const zoneData of zones) {
      try {
        if (zoneData.locationIndex >= createdLocations.length) {
          console.error(
            `Location index ${zoneData.locationIndex} out of bounds. Skipping zone ${zoneData.name}.`
          );
          continue;
        }

        const zone = await seedZone(
          zoneData,
          createdLocations[zoneData.locationIndex].id
        );
        if (zone) {
          createdZones.push(zone);
        }
      } catch (error) {
        console.error(`Failed to create zone ${zoneData.name}:`, error);
      }
    }
    console.log(`✅ Created ${createdZones.length} zones`);

    // Seed cameras
    console.log('Creating cameras...');
    let cameraCount = 0;
    for (const zone of createdZones) {
      // Create 2-3 cameras per zone
      const camerasPerZone = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < camerasPerZone; i++) {
        try {
          const camera = await seedCamera(zone.name, i, zone.id);
          if (camera) {
            cameraCount++;
          }
        } catch (error) {
          console.error(
            `Failed to create camera for zone ${zone.name}:`,
            error
          );
        }
      }
    }
    console.log(`✅ Created ${cameraCount} cameras`);

    console.log('🌱 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
