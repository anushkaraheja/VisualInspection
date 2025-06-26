import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { ComplianceData } from 'hooks/useComplianceData';

const prisma = new PrismaClient();

// The compliance field mapping between display names and DB field names
const PPE_COMPLIANCE_MAP: Record<string, string> = {
  Vest: 'VestCompliance',
  Gloves: 'GlovesCompliance',
  'Hard Hat': 'HardHatCompliance',
  'Ear Protection': 'EarProtectionCompliance',
  'Safety Glasses': 'SafetyGlassesCompliance',
  'Steel-toe Boots': 'Steel-toeBootsCompliance',
  'Respiratory Mask': 'RespiratoryMaskCompliance',
};

// Reverse mapping for API response fields
const API_FIELD_MAP: Record<string, string> = {
  VestCompliance: 'vest',
  GlovesCompliance: 'gloves',
  HardHatCompliance: 'hardHat',
  EarProtectionCompliance: 'earProtection',
  SafetyGlassesCompliance: 'safetyGlasses',
  'Steel-toeBootsCompliance': 'steelToeBoots',
  RespiratoryMaskCompliance: 'respiratoryMask',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    // Validate and authorize access
    const teamMember = await throwIfNoTeamAccess(req, res);
    const slug = req.query.slug as string;

    // Get team info
    const team = await prisma.team.findUnique({
      where: { slug },
      select: {
        id: true,
        teamPPEItem: {
          where: { active: true },
          include: { ppeItem: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found' } });
    }

    // Get active PPE item names for this team
    const activePPEItems = team.teamPPEItem.map((item) => item.ppeItem.name);

    // Get compliance data for the active PPE items
    const complianceRecords = await prisma.pPECompliance.findMany({
      where: {
        filterDevice: {
          device: {
            zone: {
              location: {
                teamId: team.id,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to recent records for performance
    });

    // Handle empty response
    if (complianceRecords.length === 0) {
      // Return empty data with zeros
      const emptyResponse: ComplianceData = {
        overall: 0,
        hardHat: 0,
        vest: 0,
        safetyGlasses: 0,
        gloves: 0,
        earProtection: 0,
        steelToeBoots: 0,
        respiratoryMask: 0,
      };
      return res.status(200).json(emptyResponse);
    }

    // Process compliance data
    const complianceStats: Record<
      string,
      { total: number; compliant: number }
    > = {};

    // Initialize counts for all potential compliance fields
    Object.keys(PPE_COMPLIANCE_MAP).forEach((item) => {
      const dbField = PPE_COMPLIANCE_MAP[item];
      complianceStats[dbField] = { total: 0, compliant: 0 };
    });

    // Count compliances
    complianceRecords.forEach((record) => {
      const compliances = record.compliances as Record<string, string>;

      Object.entries(compliances).forEach(([field, value]) => {
        if (complianceStats[field]) {
          complianceStats[field].total++;
          if (value === 'Yes') {
            complianceStats[field].compliant++;
          }
        }
      });
    });

    // Calculate percentages and prepare response
    const result: ComplianceData = {
      overall: 0,
      hardHat: 0,
      vest: 0,
      safetyGlasses: 0,
      gloves: 0,
      earProtection: 0,
      steelToeBoots: 0,
      respiratoryMask: 0,
    };

    let overallTotal = 0;
    let overallCompliant = 0;

    Object.entries(complianceStats).forEach(([field, counts]) => {
      if (counts.total > 0) {
        const apiField = API_FIELD_MAP[field];
        if (apiField) {
          result[apiField] = (counts.compliant / counts.total) * 100;
        }

        // Add to overall totals
        overallTotal += counts.total;
        overallCompliant += counts.compliant;
      }
    });

    // Calculate overall compliance
    result.overall =
      overallTotal > 0 ? (overallCompliant / overallTotal) * 100 : 0;

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return res
      .status(500)
      .json({ error: { message: 'Internal server error' } });
  } finally {
    await prisma.$disconnect();
  }
}
