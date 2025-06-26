/**
 * Helper functions for dynamic seeding
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

export const prisma = new PrismaClient();

/**
 * Create a slug from a string
 * @param str Input string
 * @returns Slugified string
 */
export function createSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a domain from a slug
 * @param slug Input slug
 * @returns Domain name
 */
export function createDomain(slug: string): string {
  return `${slug}.com`;
}

/**
 * Create an email address from a domain
 * @param name User name or role
 * @param domain Domain name
 * @returns Email address
 */
export function createEmail(name: string, domain: string): string {
  const namePart = name.toLowerCase().replace(/[^\w]/g, '');
  return `${namePart}@${domain}`;
}

/**
 * Hash a password
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

/**
 * Generate a random MAC address
 * @returns MAC address string
 */
export function generateMacAddress(): string {
  const macSegments: string[] = [];
  for (let j = 0; j < 6; j++) {
    const segment = Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, '0');
    macSegments.push(segment);
  }
  return macSegments.join(':').toUpperCase();
}

/**
 * Generate a random filter ID in the format "FILT-XXXX-XXXX-XXXX"
 * @returns Filter ID string
 */
export function generateFilterId(): string {
  const randomHex = (length: number) => {
    let result = '';
    const characters = 'ABCDEF0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  return `FILT-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}`;
}

/**
 * Generate a date from a specified number of days ago
 * @param daysAgo Number of days in the past
 * @returns Date object
 */
export function getDateDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate a random date within a specified range
 * @param startDate Start date
 * @param endDate End date
 * @returns Random date within range
 */
export function getRandomDateInRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Distribute a given number of entries throughout a day
 * @param date Base date
 * @param count Number of entries to create
 * @returns Array of timestamps spread throughout the day
 */
export function distributeTimestampsThroughoutDay(date: Date, count: number): Date[] {
  const timestamps: Date[] = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM
  const workHours = endHour - startHour;
  const minutesPerEntry = (workHours * 60) / count;
  
  for (let i = 0; i < count; i++) {
    const newDate = new Date(date);
    const minutesOffset = Math.floor(i * minutesPerEntry + Math.random() * minutesPerEntry);
    newDate.setHours(startHour + Math.floor(minutesOffset / 60), minutesOffset % 60);
    timestamps.push(newDate);
  }
  
  return timestamps;
}

/**
 * Clean up existing data from the database
 */
export async function cleanDatabase() {
  try {
    console.log('Cleaning existing data...');
    
    // Delete data in reverse order of dependencies
    await prisma.pPECompliance.deleteMany({});
    await prisma.livestockDetection.deleteMany({});
    await prisma.filterDevice.deleteMany({});
    await prisma.devicePPE.deleteMany({});
    await prisma.teamPPEItem.deleteMany({});
    await prisma.teamLivestockItem.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.zone.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.teamRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.team.deleteMany({});
    
    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}
