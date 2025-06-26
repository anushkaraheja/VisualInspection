// This is a temporary configuration file until WebVis URLs are stored in the database
// These URLs should never be exposed to the client directly

export const WEBVIS_URLS = {
  // URLs are organized by purpose
  STREAM: {
    URL:
      process.env.NEXT_PUBLIC_WEBVIS_STREAM_URL || 'http://132.145.163.159:8001',
  },
  DATA: {
    URL: process.env.NEXT_PUBLIC_WEBVIS_DATA_URL || 'http://132.145.163.159:8001',
  },
};

// Function to get URL by location and type without exposing it directly
export const getWebvisUrl = (type: 'STREAM' | 'DATA', locationId?: string) => {
  // In the future, this could do a lookup based on locationId from the database
  // For now, simply return the configured URL
  return WEBVIS_URLS[type].URL;
};
