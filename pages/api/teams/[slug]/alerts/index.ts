import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Severity } from '@prisma/client';
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

// To facilitate statistics in the frontend
interface ViolationStats {
  [key: string]: number;
}

interface Alert {
  id: string;
  workerId: string;
  timestamp: Date;
  zone: string;
  location: string;
  violations: string[];
  severity: Severity;
  status?: {
    id: string;
    name: string;
    code: string;
    color?: string;
    icon?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { slug, limit = '10', offset = '0' } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }
    const session = await throwIfNoTeamAccess(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse limit and offset
    const limitNum = parseInt(limit as string, 10) || 10;
    const offsetNum = parseInt(offset as string, 10) || 0;

    // Get team with active PPE items
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
        teamPPEItem: {
          where: { active: true },
          include: { ppeItem: true },
        },
        locations: {
          select: {
            id: true,
            name: true,
            Zone: {
              select: {
                id: true,
                name: true,
                devices: {
                  select: {
                    id: true,
                    filterDevice: {
                      select: {
                        filterId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Create a set of active compliance fields
    const activeComplianceFields = new Set<string>();
    const ppeItemMap = new Map<string, string>(); // Map from compliance field to PPE item name

    team.teamPPEItem.forEach((item) => {
      const complianceField = PPE_COMPLIANCE_MAP[item.ppeItem.name];
      if (complianceField) {
        activeComplianceFields.add(complianceField);
        ppeItemMap.set(complianceField, item.ppeItem.name);
      }
    });

    // Create a map of filter IDs to zone and location info
    const filterInfo: Record<
      string,
      {
        zoneId: string;
        zoneName: string;
        locationName: string;
      }
    > = {};

    // Build the filter info map
    for (const location of team.locations) {
      for (const zone of location.Zone) {
        for (const device of zone.devices) {
          if (device.filterDevice) {
            filterInfo[device.filterDevice.filterId] = {
              zoneId: zone.id,
              zoneName: zone.name,
              locationName: location.name,
            };
          }
        }
      }
    }

    // Get all filter IDs
    const filterIds = Object.keys(filterInfo);

    if (filterIds.length === 0) {
      return res.status(200).json({ alerts: [], total: 0, stats: {} });
    }

    // Get timestamp for 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Count total alerts first (for pagination)
    const totalComplianceRecords = await prisma.pPECompliance.count({
      where: {
        filterId: { in: filterIds },
        timestamp: { gte: oneHourAgo }, // Only records from the last hour
      },
    });

    // Get the recent compliance records with pagination
    const complianceRecords = await prisma.pPECompliance.findMany({
      where: {
        filterId: { in: filterIds },
        timestamp: { gte: oneHourAgo }, // Only records from the last hour
      },
      include: {
        complianceStatus: true, // Include the related status
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: offsetNum,
      take: limitNum,
    });

    // Track violation statistics for each PPE type
    const violationStats: ViolationStats = {};

    // Process compliance records to create alerts
    const alerts: Alert[] = [];

    for (const record of complianceRecords) {
      const compliances = record.compliances as Record<string, string>;

      // Find violations (non-compliant items) and filter by active PPE items
      const violations = Object.entries(compliances)
        .filter(
          ([key, value]) => value === 'No' && activeComplianceFields.has(key)
        )
        .map(([key]) => {
          // Track violation statistics
          const itemName = ppeItemMap.get(key) || key.replace('Compliance', '');
          violationStats[itemName] = (violationStats[itemName] || 0) + 1;

          return itemName;
        });

      // Skip if no active violations
      if (violations.length === 0) continue;

      const filter = filterInfo[record.filterId];

      // Skip if filter info not found
      if (!filter) continue;

      alerts.push({
        id: record.id,
        workerId: record.workerId,
        timestamp: record.timestamp,
        zone: filter.zoneName,
        location: filter.locationName,
        violations: violations,
        severity: record.severity,
        status: record.complianceStatus
          ? {
              id: record.complianceStatus.id,
              name: record.complianceStatus.name,
              code: record.complianceStatus.code,
              color: record.complianceStatus.color || undefined,
              icon: record.complianceStatus.icon || undefined,
            }
          : undefined,
      });
    }

    // Return alerts with pagination info and violation stats
    return res.status(200).json({
      alerts,
      total: totalComplianceRecords,
      limit: limitNum,
      offset: offsetNum,
      stats: violationStats,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
