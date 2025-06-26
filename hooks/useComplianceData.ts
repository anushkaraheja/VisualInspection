import React from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

// The compliance field mapping between API naming convention and our internal naming
const PPE_COMPLIANCE_MAP: Record<string, string> = {
  Vest: 'VestCompliance',
  Gloves: 'GlovesCompliance',
  'Hard Hat': 'HardHatCompliance',
  'Ear Protection': 'EarProtectionCompliance',
  'Safety Glasses': 'SafetyGlassesCompliance',
  'Steel-toe Boots': 'Steel-toeBootsCompliance',
  'Respiratory Mask': 'RespiratoryMaskCompliance',
};

// Reverse mapping to transform database fields to our API format
const REVERSE_PPE_COMPLIANCE_MAP: Record<string, string> = {
  VestCompliance: 'vest',
  GlovesCompliance: 'gloves',
  HardHatCompliance: 'hardHat',
  EarProtectionCompliance: 'earProtection',
  SafetyGlassesCompliance: 'safetyGlasses',
  'Steel-toeBootsCompliance': 'steelToeBoots',
  RespiratoryMaskCompliance: 'respiratoryMask',
};

export interface ComplianceData {
  overall: number;
  hardHat: number;
  vest: number;
  safetyGlasses: number;
  gloves: number; // Added gloves field
  earProtection?: number;
  steelToeBoots?: number;
  respiratoryMask?: number;
  [key: string]: number | undefined; // Allow dynamic fields based on active PPE items
}

interface ComplianceCountResponse {
  count: number;
}

// Raw DB compliance data type
interface RawComplianceData {
  VestCompliance?: string;
  GlovesCompliance?: string;
  HardHatCompliance?: string;
  EarProtectionCompliance?: string;
  SafetyGlassesCompliance?: string;
  'Steel-toeBootsCompliance'?: string;
  RespiratoryMaskCompliance?: string;
  [key: string]: string | undefined;
}

/**
 * Process raw compliance data from DB format to our API format
 * @param rawComplianceData Raw compliance data from database
 */
function processComplianceData(
  rawComplianceData: RawComplianceData[]
): ComplianceData {
  const result: Record<string, number> = {
    overall: 0,
  };

  // Initialize all compliance fields with 0
  Object.values(REVERSE_PPE_COMPLIANCE_MAP).forEach((field) => {
    result[field] = 0;
  });

  if (rawComplianceData.length === 0) {
    return result as ComplianceData;
  }

  // Count total compliances by PPE type
  const compliances: Record<string, { total: number; compliant: number }> = {};

  // Initialize the compliance counters
  Object.keys(REVERSE_PPE_COMPLIANCE_MAP).forEach((key) => {
    compliances[key] = { total: 0, compliant: 0 };
  });

  // Process each record
  rawComplianceData.forEach((record) => {
    Object.entries(record).forEach(([key, value]) => {
      if (key in compliances) {
        compliances[key].total += 1;
        if (value === 'Yes') {
          compliances[key].compliant += 1;
        }
      }
    });
  });

  // Calculate compliance percentages
  Object.entries(compliances).forEach(([key, counts]) => {
    // Get the API property name for this compliance field
    const fieldName = REVERSE_PPE_COMPLIANCE_MAP[key];

    if (fieldName) {
      // If there are records, calculate percentage, otherwise default to 0
      result[fieldName] =
        counts.total > 0 ? (counts.compliant / counts.total) * 100 : 0;
    }
  });

  // Calculate overall compliance
  let overallTotal = 0;
  let overallCompliant = 0;

  Object.values(compliances).forEach((counts) => {
    overallTotal += counts.total;
    overallCompliant += counts.compliant;
  });

  result.overall =
    overallTotal > 0 ? (overallCompliant / overallTotal) * 100 : 0;

  return result as ComplianceData;
}

/**
 * Hook to fetch compliance data for a team
 * @param teamSlug The team slug to fetch data for
 * @param date Optional date parameter to fetch data for a specific date
 */
export function useComplianceData(
  teamSlug: string | undefined,
  date?: Date
) {
  // Format the date as an ISO string and use proper query parameter format with ?
  const dateParam = date ? `?date=${date.toISOString().split('T')[0]}` : '';
  
  const {
    data: rawData,
    error,
    isLoading,
  } = useSWR<any>(
    teamSlug ? `/api/teams/${teamSlug}/compliance-data${dateParam}` : null,
    fetcher,
    { refreshInterval: 60000 } // refresh every minute
  );

  // Process the raw data to get properly formatted compliance data
  const data = React.useMemo(() => {
    if (!rawData) return undefined;

    // If the API already returns processed data, use it directly
    if (rawData.overall !== undefined) {
      // Ensure gloves field exists even if not in the response
      return {
        ...rawData,
        gloves: rawData.gloves !== undefined ? rawData.gloves : 0,
      };
    }

    // Otherwise, process the raw compliance data from the DB
    return processComplianceData(rawData.data || []);
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch the total number of PPE compliances for a team
 * @param teamSlug The team slug to fetch data for
 * @param date Date parameter to fetch data for a specific date
 */
export function useComplianceTotalCount(
  teamSlug: string | undefined, 
  date: Date
) {
  // Format the date as an ISO string and use proper query parameter format with ?
  const dateParam = date ? `?date=${date.toISOString().split('T')[0]}` : '';
  
  const { data, error, isLoading } = useSWR<ComplianceCountResponse>(
    teamSlug ? `/api/teams/${teamSlug}/compliance-count${dateParam}` : null,
    fetcher,
    { refreshInterval: 60000 } // refresh every minute
  );

  return {
    data: data || { count: 0 }, // Ensure we always return a count
    isLoading,
    error,
  };
}
