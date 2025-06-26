import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { throwIfNoTeamAccess } from 'models/team';

const prisma = new PrismaClient();

// Mapping between PPE item names and compliance field names
const PPE_COMPLIANCE_MAP: Record<string, string> = {
  Vest: 'VestCompliance',
  Gloves: 'GlovesCompliance',
  'Hard Hat': 'HardHatCompliance',
  'Ear Protection': 'EarProtectionCompliance',
  'Safety Glasses': 'SafetyGlassesCompliance',
  'Steel-toe Boots': 'Steel-toeBootsCompliance',
  'Respiratory Mask': 'RespiratoryMaskCompliance',
};

interface ZoneRiskData {
  id: string;
  name: string;
  location: string;
  violations: number;
  complianceRate: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const slug = req.query.slug as string;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }
    const session = await throwIfNoTeamAccess(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get team ID from slug and active PPE items
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
        teamPPEItem: {
          where: { active: true },
          include: { ppeItem: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Create a set of active compliance fields
    const activeComplianceFields = new Set<string>();
    team.teamPPEItem.forEach((item) => {
      const complianceField = PPE_COMPLIANCE_MAP[item.ppeItem.name];
      if (complianceField) {
        activeComplianceFields.add(complianceField);
      }
    });



    // Configuration - minimum number of non-compliant records to be considered high risk
    // You can adjust this threshold as needed
    const MIN_VIOLATIONS_THRESHOLD = 1400;

    // First get all locations for this team
    const locations = await prisma.location.findMany({
      where: { teamId: team.id },
      include: {
        Zone: {
          include: {
            devices: {
              include: {
                filterDevice: {
                  include: {
                    compliance: true,
                  },
                },
              },
            },
          },
        },
      },
    });


    // Calculate high-risk zones based on compliance data
    const highRiskZones: ZoneRiskData[] = [];
    const zoneViolationCounts: Record<string, Record<string, number>> = {};

    for (const location of locations) {

      for (const zone of location.Zone) {
        // Skip zones with no devices
        if (zone.devices.length === 0) continue;

        let totalViolations = 0;
        let complianceCount = 0;
        let totalComplianceChecks = 0;

        // Initialize violation tracking for this zone
        if (!zoneViolationCounts[zone.id]) {
          zoneViolationCounts[zone.id] = {};
        }

        // Process each device in the zone
        for (const device of zone.devices) {
          if (!device.filterDevice) continue;

          // Get compliance data for this device
          const complianceData = device.filterDevice.compliance;

          if (complianceData.length === 0) continue;

          // Process compliance data
          for (const record of complianceData) {
            // Parse the JSON compliance data
            const compliances = record.compliances as Record<string, string>;

            // Count compliances and violations only for active PPE items
            for (const [key, value] of Object.entries(compliances)) {
              // Skip if not an active compliance field
              if (!activeComplianceFields.has(key)) continue;

              totalComplianceChecks++;

              // Check if the value is compliant ("Yes" means compliant, anything else is non-compliant)
              const isCompliant = value === 'Yes';

              if (isCompliant) {
                complianceCount++;
              } else {
                totalViolations++;

                // Track violations by type for this zone
                if (!zoneViolationCounts[zone.id][key]) {
                  zoneViolationCounts[zone.id][key] = 0;
                }
                zoneViolationCounts[zone.id][key]++;
              }
            }
          }
        }

        // Only include zones with compliance checks
        if (totalComplianceChecks > 0) {
          const complianceRate = Math.round(
            (complianceCount / totalComplianceChecks) * 100
          );

          // Check if any type of violation exceeds the threshold
          let isHighRiskZone = false;
          for (const [_, count] of Object.entries(
            zoneViolationCounts[zone.id]
          )) {
            if (count >= MIN_VIOLATIONS_THRESHOLD) {
              isHighRiskZone = true;
              break;
            }
          }

          // Check if total violations exceed threshold
          const meetsThreshold = totalViolations >= MIN_VIOLATIONS_THRESHOLD;

          // Only include zones that meet the threshold
          if (isHighRiskZone || meetsThreshold) {

            highRiskZones.push({
              id: zone.id,
              name: zone.name,
              location: location.name,
              violations: totalViolations,
              complianceRate: complianceRate,
            });

            // Log detailed violation counts for debugging
          } 
        }
      }
    }

    // Log summary of violations by zone
    Object.entries(zoneViolationCounts).forEach(([zoneId, violations]) => {
      const zone = highRiskZones.find((z) => z.id === zoneId);
      if (zone) {
        const violationSum = Object.values(violations).reduce(
          (sum, count) => sum + count,
          0
        );
      }
    });

    // Sort by compliance rate (lowest first)
    highRiskZones.sort((a, b) => a.complianceRate - b.complianceRate);


    return res.status(200).json(highRiskZones);
  } catch (error) {
    console.error('Error fetching high risk zones:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
