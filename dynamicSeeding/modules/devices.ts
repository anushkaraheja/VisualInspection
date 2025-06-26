/**
 * Device module for dynamic seeding
 */
import { Device, DeviceType, Zone } from '@prisma/client';
import { DATA_VOLUME } from '../config';
import { prisma, generateMacAddress } from '../utils/helpers';
import { 
  PPE_ZONE_NAMES, 
  FARM_ZONE_NAMES, 
  CAMERA_MODELS,
  generateCameraConfig,
  getRandomDeviceStatus 
} from '../utils/randomData';

/**
 * Create zones and devices for locations
 */
export async function createZonesAndDevices(locations: any[], tenantType: 'PPE' | 'Farm') {
  console.log(`Creating zones and devices for ${locations.length} locations...`);
  
  const zoneNames = tenantType === 'PPE' ? PPE_ZONE_NAMES : FARM_ZONE_NAMES;
  const zones = [] as Zone[];
  const devices = [] as Device[];
  
  // For each location
  for (const location of locations) {
    // Create zones up to the configured number
    for (let i = 0; i < Math.min(DATA_VOLUME.zonesPerLocation, zoneNames.length); i++) {
      const zoneName = zoneNames[i];
      
      const zone = await prisma.zone.create({
        data: {
          name: zoneName,
          description: `${zoneName} at ${location.name}`,
          locationId: location.id,
        },
      });
      
      zones.push(zone);
      console.log(`Created zone: ${zone.name} for location ${location.name}`);
      
      // Create devices for each zone
      for (let j = 0; j < DATA_VOLUME.devicesPerZone; j++) {
        // Select random camera model
        const manufacturerIndex = Math.floor(Math.random() * CAMERA_MODELS.length);
        const manufacturer = CAMERA_MODELS[manufacturerIndex].manufacturer;
        const modelIndex = Math.floor(Math.random() * CAMERA_MODELS[manufacturerIndex].models.length);
        const model = CAMERA_MODELS[manufacturerIndex].models[modelIndex];
        
        // Generate camera configuration
        const config = generateCameraConfig(manufacturer);
        
        // Create device
        const device = await prisma.device.create({
          data: {
            name: `${location.name} ${zoneName} Camera ${j + 1}`,
            deviceType: DeviceType.CAMERA,
            status: getRandomDeviceStatus(),
            serialNumber: `SN${Math.floor(Math.random() * 100000)}`,
            model,
            manufacturer,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            macAddress: generateMacAddress(),
            zoneId: zone.id,
            lastPing: new Date(),
            config,
          },
        });
        
        devices.push(device);
        console.log(`Created device: ${device.name}`);
      }
    }
  }
  
  return { zones, devices };
}
