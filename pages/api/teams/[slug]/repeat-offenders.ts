import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { throwIfNoTeamAccess } from 'models/team';

const prisma = new PrismaClient();

// Configuration variable for minimum violations threshold
const DEFAULT_MIN_VIOLATIONS = 10;
const DEFAULT_LIMIT = 5;

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


    // Get parameters from query
    const minViolations =
      parseInt(req.query.minViolations as string) || DEFAULT_MIN_VIOLATIONS;
    const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
    const sortBy = (req.query.sortBy as string) || 'violations';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Log the configuration


    // Find team by slug
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
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
        teamPPEItem: {
          where: {
            active: true,
          },
          include: {
            ppeItem: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get active PPE items for the team
    const activeTeamPPEItems = team.teamPPEItem;

    // Create a set of active compliance fields (e.g., 'VestCompliance', 'GlovesCompliance')
    const activeComplianceFields = new Set<string>();
    for (const teamPPEItem of activeTeamPPEItems) {
      const itemName = teamPPEItem.ppeItem.name;
      const complianceField = PPE_COMPLIANCE_MAP[itemName];
      if (complianceField) {
        activeComplianceFields.add(complianceField);
      }
    }


    // Create a map to store zone and location info by filterId
    const filterInfo: Record<
      string,
      {
        zoneId: string;
        zoneName: string;
        locationName: string;
        locationId: string;
      }
    > = {};

    // Map all filter IDs to their zones and locations
    for (const location of team.locations) {
      for (const zone of location.Zone) {
        for (const device of zone.devices) {
          if (device.filterDevice) {
            filterInfo[device.filterDevice.filterId] = {
              zoneId: zone.id,
              zoneName: zone.name,
              locationName: location.name,
              locationId: location.id,
            };
          }
        }
      }
    }

    // Get all filter IDs
    const filterIds = Object.keys(filterInfo);

    if (filterIds.length === 0) {
      return res.status(200).json([]); // Return empty array if no filters found
    }

    // Find all PPE compliance records for these filters
    const complianceData = await prisma.pPECompliance.findMany({
      where: {
        filterId: {
          in: filterIds,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Track violations by worker
    const workerViolations: Record<
      string,
      {
        workerId: string;
        employeeId: string;
        violations: number;
        lastViolation: Date;
        lastViolationDetails: {
          filterId: string;
          timestamp: Date;
          complianceIssues: string[];
        };
        zone: string;
        locationName: string;
        violationTypes: Set<string>;
      }
    > = {};

    // Process each compliance record to find violations
    for (const record of complianceData) {
      const compliances = record.compliances as Record<string, string>;

      // Find non-compliant items (where value is "No") and filter by active PPE items
      const violations = Object.entries(compliances)
        .filter(
          ([key, value]) => value === 'No' && activeComplianceFields.has(key)
        )
        .map(([key]) => {
          // Map back from compliance field to PPE item name for display
          for (const [itemName, complianceField] of Object.entries(
            PPE_COMPLIANCE_MAP
          )) {
            if (complianceField === key) {
              return itemName;
            }
          }
          return key.replace('Compliance', '');
        });

      // Skip if no violations
      if (violations.length === 0) continue;

      const workerId = record.workerId;
      const filter = filterInfo[record.filterId];

      // Skip if filter info not found
      if (!filter) continue;

      // Initialize worker record if not exists
      if (!workerViolations[workerId]) {
        workerViolations[workerId] = {
          workerId,
          employeeId: workerId, // Using workerId as employeeId
          violations: 0,
          lastViolation: record.timestamp,
          lastViolationDetails: {
            filterId: record.filterId,
            timestamp: record.timestamp,
            complianceIssues: violations,
          },
          zone: filter.zoneName,
          locationName: filter.locationName,
          violationTypes: new Set(),
        };
      }

      // Update violation count
      workerViolations[workerId].violations += violations.length;

      // Track violation types
      violations.forEach((v) =>
        workerViolations[workerId].violationTypes.add(v)
      );

      // Update last violation if this is more recent
      if (record.timestamp > workerViolations[workerId].lastViolation) {
        workerViolations[workerId].lastViolation = record.timestamp;
        workerViolations[workerId].lastViolationDetails = {
          filterId: record.filterId,
          timestamp: record.timestamp,
          complianceIssues: violations,
        };
        workerViolations[workerId].zone = filter.zoneName;
        workerViolations[workerId].locationName = filter.locationName;
      }
    }

    // Filter workers with violations >= minViolations threshold
    let repeatOffenders = Object.values(workerViolations)
      .filter((worker) => worker.violations >= minViolations)
      .map((worker) => ({
        id: worker.workerId,
        workerId: worker.workerId,
        employeeId: worker.workerId,
        violations: worker.violations,
        lastViolation: worker.lastViolation,
        lastViolationType:
          worker.lastViolationDetails.complianceIssues.join(', '),
        zone: worker.zone,
        locationName: worker.locationName,
        location: worker.locationName,
        riskLevel:
          worker.violations >= 20
            ? 'high'
            : worker.violations >= 15
              ? 'medium'
              : 'low',
        violationTypes: Array.from(worker.violationTypes),
      }));

    // Sort on the server side based on query parameters
    repeatOffenders.sort((a, b) => {
      switch (sortBy) {
        case 'violations':
          return sortOrder === 'desc'
            ? b.violations - a.violations
            : a.violations - b.violations;

        case 'lastViolation':
          return sortOrder === 'desc'
            ? new Date(b.lastViolation).getTime() -
                new Date(a.lastViolation).getTime()
            : new Date(a.lastViolation).getTime() -
                new Date(b.lastViolation).getTime();

        case 'name':
          return sortOrder === 'desc'
            ? b.employeeId.localeCompare(a.employeeId)
            : a.employeeId.localeCompare(b.employeeId);

        // Update 'department' to 'location'
        case 'location':
          return sortOrder === 'desc'
            ? b.locationName.localeCompare(a.locationName)
            : a.locationName.localeCompare(b.locationName);

        case 'riskLevel':
          const riskValues = { high: 3, medium: 2, low: 1 };
          const aValue = riskValues[a.riskLevel as keyof typeof riskValues];
          const bValue = riskValues[b.riskLevel as keyof typeof riskValues];
          return sortOrder === 'desc'
            ? (bValue ?? 0) - (aValue ?? 0)
            : (aValue ?? 0) - (bValue ?? 0);

        default:
          return sortOrder === 'desc'
            ? b.violations - a.violations
            : a.violations - b.violations;
      }
    });

    // Apply limit after sorting
    repeatOffenders = repeatOffenders.slice(0, limit);


    return res.status(200).json(repeatOffenders);
  } catch (error) {
    console.error('Error fetching repeat offenders:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
