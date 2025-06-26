import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { PrismaClient } from '@prisma/client';
import { format, subHours } from 'date-fns';
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

interface Detection {
  id: string;
  timestamp: Date;
  timeAgo: string;
  zone: string;
  camera: string;
  eventType: string;
  severity: 'high' | 'medium' | 'low' | 'none';
  personId: string;
  imageUrl?: string | null; // Update to accept null values as well
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await throwIfNoTeamAccess(req, res);
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const slug = req.query.slug as string;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    // Get limit and sortBy params
    const limit = parseInt(req.query.limit as string) || 50; // Default to 50 detections
    const sortBy = (req.query.sortBy as string) || 'time';
    const sortOrder = (req.query.order as string) || 'desc';

    // Optional camera filter
    const cameraFilter = req.query.camera as string | undefined;

    // Get team with active PPE items
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
    const ppeItemMap = new Map<string, { name: string }>();
    team.teamPPEItem.forEach((item) => {
      const complianceField = PPE_COMPLIANCE_MAP[item.ppeItem.name];
      if (complianceField) {
        activeComplianceFields.add(complianceField);
        ppeItemMap.set(complianceField, { name: item.ppeItem.name });
      }
    });

    // Get all locations and zones with their devices
    const locations = await prisma.location.findMany({
      where: { teamId: team.id },
      include: {
        Zone: {
          include: {
            devices: {
              include: {
                filterDevice: true,
              },
              where: cameraFilter ? { name: cameraFilter } : undefined,
            },
          },
        },
      },
    });

    // Extract all filter IDs and build mapping to device and zone info
    const filterMap: Record<
      string,
      {
        deviceName: string;
        zoneName: string;
        zoneId: string;
      }
    > = {};

    const filterIds: string[] = [];

    for (const location of locations) {
      for (const zone of location.Zone) {
        for (const device of zone.devices) {
          if (device.filterDevice?.filterId) {
            const filterId = device.filterDevice.filterId;
            filterIds.push(filterId);
            filterMap[filterId] = {
              deviceName: device.name,
              zoneName: zone.name,
              zoneId: zone.id,
            };
          }
        }
      }
    }

    if (filterIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get PPE compliance records from last 24 hours
    const lastDay = subHours(new Date(), 24);
    const complianceRecords = await prisma.pPECompliance.findMany({
      where: {
        filterId: { in: filterIds },
        timestamp: { gte: lastDay },
      },
      orderBy: {
        timestamp: sortOrder === 'asc' ? 'asc' : 'desc',
      },
      take: limit,
    });

    // Map compliance records to Detection objects
    const detections: Detection[] = complianceRecords.map((record) => {
      const compliances = record.compliances as Record<string, string>;

      // Get device, zone information from filterId
      const filterInfo = filterMap[record.filterId];

      // Find non-compliant items (where value is "No") and filter by active PPE items
      const violations = Object.entries(compliances)
        .filter(
          ([key, value]) => value === 'No' && activeComplianceFields.has(key)
        )
        .map(([key]) => {
          const item = ppeItemMap.get(key);
          return item?.name || key.replace('Compliance', '');
        });

      // Determine event type and severity based on violations
      let eventType = 'All PPE Compliant';
      let severity: 'high' | 'medium' | 'low' | 'none' = 'none';

      if (violations.length > 0) {
        // Use the first violation as the primary event type
        eventType = `${violations[0]} Missing`;

        // Determine severity based on number of violations
        if (violations.length >= 3) {
          severity = 'high';
        } else if (violations.length === 2) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
      }

      // Calculate timeAgo
      const now = new Date();
      const diffMinutes = Math.floor(
        (now.getTime() - new Date(record.timestamp).getTime()) / 60000
      );

      let timeAgo: string;
      if (diffMinutes < 1) {
        timeAgo = 'Just now';
      } else if (diffMinutes < 60) {
        timeAgo = `${diffMinutes}m ago`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        timeAgo = `${hours}h ago`;
      }

      return {
        id: record.id,
        timestamp: record.timestamp,
        timeAgo,
        zone: filterInfo?.zoneName || 'Unknown Zone',
        camera: filterInfo?.deviceName || 'Unknown Camera',
        eventType,
        severity,
        personId: record.workerId,
        imageUrl: record.imageUrl || undefined, // Convert null to undefined if needed
      };
    });

    // Apply requested sorting if needed
    if (sortBy !== 'time') {
      detections.sort((a, b) => {
        switch (sortBy) {
          case 'zone':
            return sortOrder === 'asc'
              ? a.zone.localeCompare(b.zone)
              : b.zone.localeCompare(a.zone);
          case 'camera':
            return sortOrder === 'asc'
              ? a.camera.localeCompare(b.camera)
              : b.camera.localeCompare(a.camera);
          case 'eventType':
            return sortOrder === 'asc'
              ? a.eventType.localeCompare(b.eventType)
              : b.eventType.localeCompare(a.eventType);
          case 'severity':
            const severityOrder = { high: 3, medium: 2, low: 1, none: 0 };
            return sortOrder === 'asc'
              ? severityOrder[a.severity] - severityOrder[b.severity]
              : severityOrder[b.severity] - severityOrder[a.severity];
          default:
            return 0;
        }
      });
    }

    return res.status(200).json(detections);
  } catch (error) {
    console.error('Error fetching detections:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
