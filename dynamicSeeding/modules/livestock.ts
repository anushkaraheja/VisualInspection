/**
 * Livestock module for dynamic seeding
 */
import { Animal, Livestock } from '@prisma/client';
import { DATA_VOLUME } from '../config';
import { prisma } from '../utils/helpers';
import { LIVESTOCK_TYPES } from '../utils/randomData';

/**
 * Create livestock items if they don't exist
 */
export async function createLivestockItems() {
  console.log('Creating livestock items...');
  
  const livestockItems = [] as Livestock[];
  
  for (const item of LIVESTOCK_TYPES) {
    // Check if livestock item exists
    const existingItem = await prisma.livestock.findFirst({
      where: {
        name: item.name,
      },
    });
    
    if (existingItem) {
      livestockItems.push(existingItem);
      console.log(`Livestock item ${item.name} already exists`);
    } else {
      // Create livestock item
      const newItem = await prisma.livestock.create({
        data: {
          name: item.name,
          icon: item.icon,
          description: item.description,
        },
      });
      
      livestockItems.push(newItem);
      console.log(`Created livestock item: ${newItem.name}`);
    }
  }
  
  return livestockItems;
}

/**
 * Associate livestock items with a team
 */
export async function associateLivestockWithTeam(teamId: string) {
  console.log(`Associating livestock with team ${teamId}...`);
  
  // Get all livestock items
  const livestockItems = await prisma.livestock.findMany();
  
  // Select a subset of items to be active based on configuration
  const itemsToActivate = Math.min(DATA_VOLUME.livestockCount, livestockItems.length);
  const shuffledItems = [...livestockItems].sort(() => Math.random() - 0.5);
  const activeItems = shuffledItems.slice(0, itemsToActivate);
  const activeItemIds = new Set(activeItems.map(item => item.id));
  
  // Associate selected items with team
  for (const item of activeItems) {
    await prisma.teamLivestockItem.create({
      data: {
        teamId,
        livestockId: item.id,
        active: true,
      },
    });
    
    console.log(`Associated livestock ${item.name} with team`);
  }
  
  return activeItems;
}

/**
 * Create animal counts for farm locations
 */
export async function createAnimalCounts(locations: any[], livestockItems: any[]) {
  console.log(`Creating animal counts for ${locations.length} locations...`);
  
  const animals = [] as Animal[];
  
  for (const location of locations) {
    // Each location gets a subset of the livestock types
    const locationAnimalCount = Math.min(Math.floor(Math.random() * 3) + 2, livestockItems.length);
    const shuffledLivestock = [...livestockItems].sort(() => Math.random() - 0.5);
    const locationAnimals = shuffledLivestock.slice(0, locationAnimalCount);
    
    for (const livestock of locationAnimals) {
      // Generate random counts for active and inactive animals
      const activeCount = Math.floor(Math.random() * 150) + 50; // 50-200 active
      const inactiveCount = Math.floor(Math.random() * 20) + 1; // 1-20 inactive
      
      const animal = await prisma.animal.create({
        data: {
          name: livestock.name,
          icon: livestock.icon || '',
          locationId: location.id,
          activeAnimal: activeCount,
          inactiveAnimal: inactiveCount,
        },
      });
      
      animals.push(animal);
      console.log(`Created animal data: ${animal.name} (${activeCount} active) at ${location.name}`);
    }
  }
  
  return animals;
}
