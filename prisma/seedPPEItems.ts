import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PPE seed data
const ppeItems = [
  {
    name: 'Hard Hat',
    description: 'Standard construction hard hat for head protection',
  },
  {
    name: 'Safety Glasses',
    description: 'Eye protection from debris and harmful materials',
  },
  {
    name: 'Vest',
    description: 'High visibility vest for hazardous environments',
  },
  {
    name: 'Steel-toe Boots',
    description: 'Foot protection against falling or rolling objects',
  },
  {
    name: 'Ear Protection',
    description: 'Reduces harmful impact of loud noise on hearing',
  },
  {
    name: 'Gloves',
    description: 'Hand protection for various industrial applications',
  },
  {
    name: 'Respiratory Mask',
    description: 'Protection from airborne particulates and chemicals',
  },
];

// Function to seed PPE items
export async function seedPPEItems() {
  console.log('Seeding PPE items...');

  // Create all PPE items
  for (const item of ppeItems) {
    await prisma.pPEItem.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        description: item.description,
      },
    });
  }

  console.log('PPE items seeded successfully');
}

// Function to associate PPE items with a team
export async function associatePPEWithTeam(teamId: string) {
  console.log(`Associating PPE items with team: ${teamId}`);

  // Get all PPE items
  const existingPPEItems = await prisma.pPEItem.findMany();

  // Associate all items with the team (default to active)
  for (const item of existingPPEItems) {
    await prisma.teamPPEItem.upsert({
      where: {
        teamId_ppeItemId: {
          teamId: teamId,
          ppeItemId: item.id,
        },
      },
      update: {},
      create: {
        teamId: teamId,
        ppeItemId: item.id,
        active: true,
      },
    });
  }

  console.log('PPE items associated with team successfully');
}

// Main seed function
async function main() {
  try {
    await seedPPEItems();

    // You would call associatePPEWithTeam with specific team IDs here
    // For example: await associatePPEWithTeam("team-id-1");

    console.log('Seeding completed successfully');
  } catch (e) {
    console.error('Error seeding database:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  main();
}

export default main;
