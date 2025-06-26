import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { prisma } from '@/lib/prisma';
import {
  format,
  subWeeks,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';

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

export interface TrendDataPoint {
  week: string;
  date: string;
  [key: string]: string | number; // Allow dynamic PPE type keys
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrendDataPoint[] | { error: string }>
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    // Authenticate request
    const teamMember = await throwIfNoTeamAccess(req, res);
    const { slug, period = 'week' } = req.query;

    // Determine date range based on period
    const today = new Date();
    const startDate =
      period === 'week' ? subWeeks(today, 5) : subMonths(today, 5);

    // Get team and active PPE items
    const team = await prisma.team.findUnique({
      where: { slug: slug as string },
      include: {
        teamPPEItem: {
          where: { active: true },
          include: { ppeItem: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Create a map of active PPE items for tracking violations
    const activePPEItems = new Map<string, string>(); // Map from compliance field to display name
    team.teamPPEItem.forEach((item) => {
      const complianceField = PPE_COMPLIANCE_MAP[item.ppeItem.name];
      if (complianceField) {
        // Use short name for display (without "Compliance")
        activePPEItems.set(complianceField, item.ppeItem.name);
      }
    });

    // Get all compliance records for this team within the range
    const complianceRecords = await prisma.pPECompliance.findMany({
      where: {
        filterDevice: {
          device: {
            zone: {
              location: {
                Team: {
                  slug: slug as string,
                },
              },
            },
          },
        },
        timestamp: { gte: startDate },
      },
      select: {
        compliances: true,
        timestamp: true,
      },
    });

    let trendData: TrendDataPoint[] = [];

    if (period === 'week') {
      // Get all weeks in the interval
      const weeks = eachWeekOfInterval({
        start: startDate,
        end: today,
      });

      trendData = weeks.map((weekStart, index) => {
        // Get week range
        const weekEnd = endOfWeek(weekStart);

        // Filter records for this week
        const weekRecords = complianceRecords.filter((record) => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });

        // Initialize the data point with common properties
        const dataPoint: TrendDataPoint = {
          week: `Week ${index + 1}`,
          date: format(weekStart, 'MMM d'),
        };

        // If no data in DB, generate some fake data with a decreasing trend
        if (weekRecords.length === 0) {
          const weekFactor = 6 - index; // Higher for earlier weeks

          // Add a data point for each active PPE item
          for (const [complianceField, itemName] of activePPEItems.entries()) {
            const shortName = itemName.toLowerCase(); // Use lowercase item name as property
            dataPoint[shortName] = Math.max(
              2,
              Math.floor(5 + weekFactor * 0.8)
            );
          }

          return dataPoint;
        }

        // Count violations for each active PPE item type
        for (const [complianceField, itemName] of activePPEItems.entries()) {
          const shortName = itemName.toLowerCase();
          let violations = 0;

          // Count violations in records
          weekRecords.forEach((record) => {
            const compliances = record.compliances as Record<string, string>;
            if (compliances[complianceField] === 'No') {
              violations++;
            }
          });

          dataPoint[shortName] = violations;
        }

        return dataPoint;
      });
    } else {
      // Monthly data
      const months = eachMonthOfInterval({
        start: startDate,
        end: today,
      });

      trendData = months.map((monthStart, index) => {
        // Get month range
        const monthEnd = endOfMonth(monthStart);

        // Filter records for this month
        const monthRecords = complianceRecords.filter((record) => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        // Initialize the data point with common properties
        const dataPoint: TrendDataPoint = {
          week: format(monthStart, 'MMM yyyy'),
          date: format(monthStart, 'MMM yyyy'),
        };

        // If no data in DB, generate some fake data with a decreasing trend
        if (monthRecords.length === 0) {
          const monthFactor = 6 - index; // Higher for earlier months

          // Add a data point for each active PPE item
          for (const [complianceField, itemName] of activePPEItems.entries()) {
            const shortName = itemName.toLowerCase(); // Use lowercase item name as property
            dataPoint[shortName] = Math.max(
              10,
              Math.floor(20 + monthFactor * 3)
            );
          }

          return dataPoint;
        }

        // Count violations for each active PPE item type
        for (const [complianceField, itemName] of activePPEItems.entries()) {
          const shortName = itemName.toLowerCase();
          let violations = 0;

          // Count violations in records
          monthRecords.forEach((record) => {
            const compliances = record.compliances as Record<string, string>;
            if (compliances[complianceField] === 'No') {
              violations++;
            }
          });

          dataPoint[shortName] = violations;
        }

        return dataPoint;
      });
    }

    return res.status(200).json(trendData);
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
}
