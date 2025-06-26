/**
 * Random data generators for dynamic seeding
 */

import { DeviceStatus } from '@prisma/client';
import { RANDOMIZATION } from '../config';

// PPE location names for different tenant types
export const PPE_LOCATION_NAMES = [
  'Ardley ERF',
  'Avonmouth ERF',
  'Beddington ERF',
  'Cardiff ERF',
  'Dunbar ERF',
  'Exeter EFW',
  'Glasgow RREC',
  'Lakeside ERF',
  'Peterborough ERF',
  'Runcorn ERF',
  'Thameside ERF',
  'Westfield ERF',
];

export const FARM_LOCATION_NAMES = [
  'Big Sky Ranch',
  'Texas Longhorn Farm',
  'Iowa Plains Dairy',
  'Montana Cattle Co.',
  'Prairie View Farm',
  'Oakwood Pastures',
  'Rocky Mountain Ranch',
  'Golden Valley Farm',
  'Sunset Dairy',
  'Green Acres Ranch',
  'Riverview Livestock',
  'Lone Star Feedlot',
];

// Zone names for different tenant types
export const PPE_ZONE_NAMES = [
  'North Zone',
  'South Zone',
  'East Zone',
  'West Zone',
  'Loading Bay',
  'Processing Area',
  'Storage Zone',
  'Waste Handling Zone',
];

export const FARM_ZONE_NAMES = [
  'Grazing Area',
  'Feed Lot',
  'Milking Station',
  'Barn',
  'Cattle Pen',
  'Poultry House',
  'Sheep Paddock',
  'Holding Pen',
];

// PPE items
export const PPE_ITEMS = [
  { name: 'Hard Hat', description: 'Protective helmet for construction sites' },
  { name: 'Safety Vest', description: 'High-visibility vest' },
  { name: 'Safety Glasses', description: 'Eye protection' },
  { name: 'Safety Gloves', description: 'Hand protection' },
  { name: 'Safety Boots', description: 'Foot protection' },
  { name: 'Face Shield', description: 'Full face protection' },
  { name: 'Ear Protection', description: 'Hearing protection' },
];

// Livestock types
export const LIVESTOCK_TYPES = [
  { name: 'Cow', icon: '/icons/livestock/cow.svg', description: 'Adult female cattle' },
  { name: 'Bull', icon: '/icons/livestock/bull.svg', description: 'Adult male cattle' },
  { name: 'Calf', icon: '/icons/livestock/calf.svg', description: 'Young cattle' },
  { name: 'Sheep', icon: '/icons/livestock/sheep.svg', description: 'Domestic sheep' },
  { name: 'Goat', icon: '/icons/livestock/goat.svg', description: 'Domestic goat' },
  { name: 'Horse', icon: '/icons/livestock/horse.svg', description: 'Equine animal' },
  { name: 'Chicken', icon: '/icons/livestock/chicken.svg', description: 'Domestic fowl' },
  { name: 'Duck', icon: '/icons/livestock/duck.svg', description: 'Waterfowl' },
  { name: 'Turkey', icon: '/icons/livestock/turkey.svg', description: 'Large bird' },
  { name: 'Pig', icon: '/icons/livestock/pig.svg', description: 'Domestic swine' },
];

// Camera models
export const CAMERA_MODELS = [
  { manufacturer: 'Hikvision', models: ['DS-2CD2345-I', 'DS-2CD2T87G2-L', 'DS-2DE4425IW-DE'] },
  { manufacturer: 'Axis', models: ['P3225-LV', 'P3248-LVE', 'Q6215-LE'] },
  { manufacturer: 'Bosch', models: ['DINION IP 5000', 'FLEXIDOME IP 8000i', 'AUTODOME IP 5000i'] },
  { manufacturer: 'Dahua', models: ['IPC-HDBW5831E-Z5E', 'IPC-HDW5231R-Z', 'DH-SD59230U-HNI'] },
];

/**
 * Generate random camera configuration based on manufacturer
 */
export function generateCameraConfig(manufacturer: string): Record<string, any> {
  switch (manufacturer.toLowerCase()) {
    case 'hikvision':
      return {
        connectionType: 'rtsp',
        rtspUrl: `rtsp://admin:password@192.168.1.${Math.floor(Math.random() * 255)}:554/Streaming/Channels/101`,
        fps: 25,
        resolution: '1920x1080',
        authenticated: true,
        username: 'admin',
        password: 'password123',
      };
    case 'axis':
      return {
        connectionType: 'rtsp',
        rtspUrl: `rtsp://root:root@192.168.1.${Math.floor(Math.random() * 255)}:554/axis-media/media.amp`,
        fps: 30,
        resolution: '2560x1440',
        authenticated: true,
        username: 'root',
        password: 'root',
      };
    case 'bosch':
      return {
        connectionType: 'rtsp',
        rtspUrl: `rtsp://service:service@192.168.1.${Math.floor(Math.random() * 255)}:554/rtsp_tunnel`,
        fps: 20,
        resolution: '1920x1080',
        authenticated: true,
        username: 'service',
        password: 'service',
      };
    case 'dahua':
      return {
        connectionType: 'rtsp',
        rtspUrl: `rtsp://admin:admin@192.168.1.${Math.floor(Math.random() * 255)}:554/cam/realmonitor?channel=1&subtype=0`,
        fps: 30,
        resolution: '2688x1520',
        authenticated: true,
        username: 'admin',
        password: 'admin',
      };
    default:
      return {
        connectionType: 'rtsp',
        rtspUrl: `rtsp://admin:admin@192.168.1.${Math.floor(Math.random() * 255)}:554/stream`,
        fps: 20,
        resolution: '1920x1080',
        authenticated: true,
        username: 'admin',
        password: 'admin',
      };
  }
}

/**
 * Generate random device status based on configured probability
 */
export function getRandomDeviceStatus(): DeviceStatus {
  return Math.random() < RANDOMIZATION.deviceOfflineChance 
    ? DeviceStatus.OFFLINE 
    : DeviceStatus.ONLINE;
}

/**
 * Generate random worker IDs for PPE compliance tracking
 */
export function generateWorkerIds(teamName: string, count: number): string[] {
  const workerIds: string[] = [];

  // Different ID patterns based on tenant type
  if (teamName.toUpperCase().includes('PPE')) {
    // PPE format: W-XXXX
    for (let i = 1; i <= count; i++) {
      workerIds.push(`W-${String(i).padStart(4, '0')}`);
    }
  } else {
    // Farm format: FARM-WKR-XX
    for (let i = 1; i <= count; i++) {
      workerIds.push(`FARM-WKR-${String(i).padStart(2, '0')}`);
    }
  }

  return workerIds;
}

/**
 * Generate random compliance data using PPE items
 */
export function generateRandomCompliances(ppeItems: string[]): Record<string, string> {
  const compliances: Record<string, string> = {};

  ppeItems.forEach((itemName) => {
    // Format the compliance key
    const complianceKey = `${itemName.replace(/\s+/g, '')}Compliance`;
    // Use the configured chance of violation
    compliances[complianceKey] = Math.random() > RANDOMIZATION.complianceViolationChance ? 'Yes' : 'No';
  });

  return compliances;
}

/**
 * Generate random livestock detection confidence
 */
export function getRandomConfidence(): number {
  const { min, max } = RANDOMIZATION.livestockConfidenceRange;
  return min + Math.random() * (max - min);
}

/**
 * Get random entries per day based on configured min/max
 */
export function getRandomEntriesPerDay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
