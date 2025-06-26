/**
 * Configuration file for dynamic seeding
 * Customize these variables to control what data gets seeded
 */

// Tenant Type Configuration
export const TENANT_TYPE: 'PPE' | 'Farm'  = 'PPE'; // Options: 'PPE' or 'Farm'

// Company Configuration
export const COMPANY_NAME = 'Viridor'; // Will be used for team name
export const COMPANY_SLUG = ''; // Leave empty to auto-generate from company name
export const COMPANY_DOMAIN = ''; // Leave empty to auto-generate from slug

// Theme Configuration
export const THEME = {
  primaryColor: '#00853b', // Blue
  secondaryColor: '#00853b', // Green
  logo: '', // URL to logo image
};

// User Configuration
export const ADMIN_USER = {
  firstName: 'Admin',
  lastName: 'User',
  email: '', // Leave empty to auto-generate based on company domain
  password: '1234567890', // Default password
};

// Data Volume Configuration
export const DATA_VOLUME = {
  locations: 4, // Number of locations to create
  zonesPerLocation: 4, // Number of zones per location
  devicesPerZone: 2, // Number of devices (cameras) per zone
  workersCount: 10, // Number of workers for PPE compliance data
  livestockCount: 3, // Number of livestock types for Farm tenant
  ppeItemsCount: 3, // Number of active PPE items for PPE tenant
};

// Time Range Configuration
export const TIME_RANGE = {
  daysOfData: 90, // Number of days to generate historical data
  entriesPerDay: {
    min: 5, // Minimum entries per day
    max: 10, // Maximum entries per day
  },
};

// Randomization Configuration
export const RANDOMIZATION = {
  deviceOfflineChance: 0.2, // Probability of a device being offline (0-1)
  complianceViolationChance: 0.2, // Probability of PPE compliance violation (0-1)
  livestockConfidenceRange: { min: 0.7, max: 0.98 }, // Range for livestock detection confidence
};

// Database Configuration
export const DATABASE_OPTIONS = {
  cleanBeforeSeeding: false, // Set to false to keep existing data
};
