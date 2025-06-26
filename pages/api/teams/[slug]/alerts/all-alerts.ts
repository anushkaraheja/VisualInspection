import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Severity } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { getSession } from '@/lib/session';

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

// Update the ViolationStats interface to allow numeric operations
interface ViolationStats {
  [key: string]: number | Record<string, number> | any;
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
  comments?: { text: string; timestamp: string; user: string; statusFrom?: string; statusTo: string; }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      slug,
      startDate,
      endDate,
      zone,
      status,
      severity,
      limit = '25',
      offset = '0',
    } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    await throwIfNoTeamAccess(req, res);
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse limit and offset
    const limitNum = parseInt(limit as string, 10) || 25;
    const offsetNum = parseInt(offset as string, 10) || 0;

    // Get team with active PPE items
    const team = await prisma.team.findUnique({
      where: { slug },
      include: {
        teamPPEItem: {
          where: { active: true },
          include: { ppeItem: true },
        },
        complianceStatuses: true,
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

    // Check if the team has any compliance statuses
    if (team.complianceStatuses.length === 0) {
      return res.status(200).json({
        alerts: [],
        total: 0,
        stats: {},
        zones: [],
        statuses: [],
        severities: Object.values(Severity),
      });
    }

    // Find the default status (where isDefault is true)
    const defaultStatus = team.complianceStatuses.find(status => status.isDefault);

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
        locationId: string;
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
              locationId: location.id,
            };
          }
        }
      }
    }

    // Get all filter IDs
    const filterIds = Object.keys(filterInfo);

    if (filterIds.length === 0) {
      return res.status(200).json({
        alerts: [],
        total: 0,
        stats: {},
        zones: [],
        statuses: team.complianceStatuses,
      });
    }

    // Build date range filter
    let dateFilter: { gte: Date; lte?: Date } = {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 1 week ago
    };

    if (startDate && typeof startDate === 'string') {
      dateFilter.gte = new Date(startDate);
    }

    if (endDate && typeof endDate === 'string') {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause for filtering
    const where: any = {
      filterId: { in: filterIds },
      timestamp: dateFilter,
    };

    // Filter by severity if provided
    if (severity && typeof severity === 'string') {
      // Cast the string value to Severity enum using type assertion
      // This is safe because we validated that severity is a valid enum value
      // by checking it exists in Severity enum
      if (Object.values(Severity).includes(severity as Severity)) {
        where.severity = severity as Severity;
      }
    }

    // Filter by status if provided
    if (status && typeof status === 'string') {
      // If we're filtering by the default status, include both that status ID and null values
      if (defaultStatus && status === defaultStatus.id) {
        where.OR = [
          { statusId: status },
          { statusId: null }
        ];
      } else {
        where.statusId = status;
      }
    }

    // Filter by zone if provided
    let zoneFilterIds: string[] = filterIds;
    if (zone && typeof zone === 'string') {
      // Get filter IDs for the specific zone
      zoneFilterIds = Object.entries(filterInfo)
        .filter(([_, info]) => info.zoneName === zone || info.zoneId === zone)
        .map(([id, _]) => id);

      if (zoneFilterIds.length === 0) {
        return res.status(200).json({
          alerts: [],
          total: 0,
          stats: {},
          zones: Object.values(filterInfo)
            .map((info) => ({
              id: info.zoneId,
              name: info.zoneName,
              locationId: info.locationId,
              locationName: info.locationName,
            }))
            .filter(
              (zone, index, self) =>
                self.findIndex((z) => z.id === zone.id) === index
            ),
          statuses: team.complianceStatuses,
        });
      }

      where.filterId = { in: zoneFilterIds };
    }

    // Count total alerts first (for pagination)
    let totalComplianceRecords = 0;
    
    if (status && typeof status === 'string') {
      // If filtering by status, use the where clause with status filter
      totalComplianceRecords = await prisma.pPECompliance.count({ where });
    } else {
      // If showing all alerts (no status filter), count all records with violations
      totalComplianceRecords = await prisma.pPECompliance.count({
        where: {
          filterId: { in: filterIds },
          timestamp: dateFilter,
          // Cast severity to Severity enum if provided
          ...(severity && typeof severity === 'string' && Object.values(Severity).includes(severity as Severity) 
              ? { severity: severity as Severity } 
              : {}),
          ...(zone && { filterId: { in: zoneFilterIds } })
        }
      });
    }

    // Create stats object for tracking alerts by status
    const statusCounts: Record<string, number> = {};

    // Get status counts using Prisma groupBy instead of raw query
    const statusGroupResults = await prisma.pPECompliance.groupBy({
      by: ['statusId'],
      where: {
        filterId: { in: filterIds },
        timestamp: dateFilter,
        ...(zone && { filterId: { in: zoneFilterIds } })
      },
      _count: {
        id: true
      }
    });

    // Process the groupBy results
    statusGroupResults.forEach(group => {
      if (group.statusId) {
        statusCounts[group.statusId] = group._count.id;
      }
    });

    // Count records with null statusId - these will be assigned default status
    const nullStatusCount = await prisma.pPECompliance.count({
      where: {
        filterId: { in: filterIds },
        timestamp: dateFilter,
        statusId: null,
        ...(zone && { filterId: { in: zoneFilterIds } })
      }
    });

    // Assign null status count to default status
    if (defaultStatus) {
      statusCounts._pending = nullStatusCount;
      statusCounts[defaultStatus.id] = (statusCounts[defaultStatus.id] || 0) + nullStatusCount;
    }

    // Calculate total alerts across all statuses for the "All" tab
    const totalAllAlerts = Object.values(statusCounts).reduce((sum, count) => {
      if (typeof count === 'number') {
        return sum + count;
      }
      return sum;
    }, 0) - (statusCounts._pending || 0); // Subtract _pending to avoid double counting

    // Add the total count to stats for use in UI
    const violationStats: ViolationStats = {};
    violationStats._statusCounts = statusCounts;
    violationStats._totalAlerts = totalAllAlerts;

    // Get the compliance records with pagination and filtering
    const complianceRecords = await prisma.pPECompliance.findMany({
      where,
      include: {
        complianceStatus: true, // Include the related status
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: offsetNum,
      take: limitNum,
    });

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
          // Track violation statistics - cast to number to fix the type issue
          const itemName = ppeItemMap.get(key) || key.replace('Compliance', '');
          if (typeof violationStats[itemName] === 'number') {
            violationStats[itemName] = (violationStats[itemName] as number) + 1;
          } else {
            violationStats[itemName] = 1;
          }

          return itemName;
        });

      // Skip if no active violations
      if (violations.length === 0) continue;

      const filter = filterInfo[record.filterId];

      // Skip if filter info not found
      if (!filter) continue;

      // Determine the status to use - either the record's status or the default status
      let alertStatus;
      if (record.complianceStatus) {
        alertStatus = {
          id: record.complianceStatus.id,
          name: record.complianceStatus.name,
          code: record.complianceStatus.code,
          color: record.complianceStatus.color || undefined,
          icon: record.complianceStatus.icon || undefined,
        };
      } else if (defaultStatus) {
        // Use default status if the record doesn't have a status
        alertStatus = {
          id: defaultStatus.id,
          name: defaultStatus.name,
          code: defaultStatus.code,
          color: defaultStatus.color || undefined,
          icon: defaultStatus.icon || undefined,
        };
      }

      alerts.push({
        id: record.id,
        workerId: record.workerId,
        timestamp: record.timestamp,
        zone: filter.zoneName,
        location: filter.locationName,
        violations: violations,
        severity: record.severity,
        status: alertStatus,
        comments: record.comments as { text: string; timestamp: string; user: string; statusFrom?: string; statusTo: string; }[] || []
      });
    }

    // Extract unique zones for filtering with location information
    const uniqueZones = Object.values(filterInfo)
      .map((info) => ({
        id: info.zoneId,
        name: info.zoneName,
        locationId: info.locationId,
        locationName: info.locationName,
      }))
      .filter(
        (zone, index, self) => self.findIndex((z) => z.id === zone.id) === index
      );

    // Return alerts with pagination info, violation stats, and filter options
    return res.status(200).json({
      alerts,
      total: totalComplianceRecords,
      limit: limitNum,
      offset: offsetNum,
      stats: violationStats,
      zones: uniqueZones,
      statuses: team.complianceStatuses,
      severities: Object.values(Severity),
    });
  } catch (error) {
    console.error('Error fetching all alerts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
