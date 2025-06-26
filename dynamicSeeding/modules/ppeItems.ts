/**
 * PPE Items module for dynamic seeding
 */
import { PPEItem } from '@prisma/client';
import { DATA_VOLUME } from '../config';
import { prisma } from '../utils/helpers';
import { PPE_ITEMS } from '../utils/randomData';

/**
 * Create PPE items if they don't exist
 */
export async function createPPEItems() {
  console.log('Creating PPE items...');
  
  const ppeItems = [] as PPEItem[];
  
  for (const item of PPE_ITEMS) {
    // Check if PPE item exists
    const existingItem = await prisma.pPEItem.findFirst({
      where: {
        name: item.name,
      },
    });
    
    if (existingItem) {
      ppeItems.push(existingItem);
      console.log(`PPE item ${item.name} already exists`);
    } else {
      // Create PPE item
      const newItem = await prisma.pPEItem.create({
        data: {
          name: item.name,
          description: item.description,
        },
      });
      
      ppeItems.push(newItem);
      console.log(`Created PPE item: ${newItem.name}`);
    }
  }
  
  return ppeItems;
}

/**
 * Associate PPE items with a team
 */
export async function associatePPEItemsWithTeam(teamId: string) {
  console.log(`Associating PPE items with team ${teamId}...`);
  
  // Get all PPE items
  const ppeItems = await prisma.pPEItem.findMany();
  
  // Select a subset of items to be active based on configuration
  const itemsToActivate = Math.min(DATA_VOLUME.ppeItemsCount, ppeItems.length);
  const shuffledItems = [...ppeItems].sort(() => Math.random() - 0.5);
  const activeItems = shuffledItems.slice(0, itemsToActivate);
  const activeItemIds = new Set(activeItems.map(item => item.id));
  
  // Associate all items with team, but only activate the selected ones
  for (const item of ppeItems) {
    await prisma.teamPPEItem.create({
      data: {
        teamId,
        ppeItemId: item.id,
        active: activeItemIds.has(item.id), // Only activate selected items
      },
    });
    
    console.log(`Associated PPE item ${item.name} with team (active: ${activeItemIds.has(item.id)})`);
  }
  
  return activeItems;
}
