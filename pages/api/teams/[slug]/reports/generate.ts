import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ReportType,
  ReportFormat,
  PrismaClient,
  PPECompliance,
  Device,
  Location,
  Zone,
  Prisma,
} from '@prisma/client';
import { generateReportFile } from '../../../../../utils/reportGenerators';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// Define response type for clarity
interface GenerateReportResponse {
  report?: any;
  data?: any;
  message?: string;
  error?: any;
}

interface ComplianceSummary {
  summary: {
    totalDetections: number;
    complianceRate: number;
    totalViolations: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  dailyCompliance: Array<{
    date: string;
    total: number;
    compliant: number;
    violations: number;
  }>;
  ppeItemCompliance: Array<{
    name: string;
    total: number;
    compliant: number;
    complianceRate: number;
  }>;
  hourlyCompliance: Array<{
    hour: number;
    total: number;
    compliant: number;
    complianceRate: number;
  }>;
}

interface ViolationTrend {
  summary: {
    totalViolations: number;
    violationRate: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  dailyViolations: Array<{
    date: string;
    total_detections: number;
    violations: number;
  }>;
  violationTypes: Array<{
    name: string;
    violations: number;
  }>;
  hourlyViolations: Array<{
    hour: number;
    total: number;
    violations: number;
    violationRate: number;
  }>;
  highRiskZones: Array<{
    zone: string;
    location: string;
    total: number;
    violations: number;
    violationRate: number;
  }>;
}

interface RepeatOffendersAnalysis {
  summary: {
    totalOffenders: number;
    totalIncidents: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  repeatOffenders: Array<{
    workerId: string;
    total_detections: number;
    violations: number;
    violationRate: number;
    rank: number;
    totalDetections?: number;
    violationsByType?: Array<{
      type: string;
      count: number;
    }>;
    violationsByLocation?: Array<{
      location: string;
      zone: string;
      violations: number;
    }>;
  }>;
}

interface ZoneLocationAnalysis {
  summary: {
    totalZones: number;
    averageComplianceRate: number;
    worstPerformingZone: string;
    bestPerformingZone: string;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  zones: Array<{
    zoneId: string;
    zoneName: string;
    locationName: string;
    locationId: string;
    totalDetections: number;
    compliant: number;
    violations: number;
    complianceRate: number;
    ppeCompliance: Array<{
      ppeName: string;
      totalDetections: number;
      compliant: number;
      complianceRate: number;
    }>;
    timeSeriesData: Array<{
      date: string;
      totalDetections: number;
      compliant: number;
      complianceRate: number;
    }>;
  }>;
}

type ReportData =
  | ComplianceSummary
  | ViolationTrend
  | RepeatOffendersAnalysis
  | ZoneLocationAnalysis;

// Define the filter type to make the code more type-safe
type ComplianceFilter = {
  timestamp: {
    gte: Date;
    lte: Date;
  };
  filterDevice: {
    device: {
      zone: {
        location: {
          teamId: string;
          id?: string;
        };
      };
      zoneId?: string;
    };
  };
};

type ComplianceRecord = {
  timestamp: Date;
  compliances: {
    VestCompliance?: string;
    GlovesCompliance?: string;
    HardHatCompliance?: string;
    EarProtectionCompliance?: string;
    SafetyGlassesCompliance?: string;
    'Steel-toeBootsCompliance'?: string;
    RespiratoryMaskCompliance?: string;
    [key: string]: string | undefined;
  };
};

// Helper function to determine if a compliance record is compliant
function isRecordCompliant(compliances: any): boolean {
  if (typeof compliances !== 'object' || compliances === null) {
    return false;
  }
  return !Object.values(compliances).some((value) => value === 'No');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateReportResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { slug } = req.query;

  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({ message: 'Invalid team slug' });
  }

  const team = await prisma.team.findUnique({
    where: { slug: slug as string },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      locations: true,
    },
  });

  if (!team || team.members.length === 0) {
    return res
      .status(404)
      .json({ message: 'Team not found or you are not a member' });
  }

  try {
    const {
      title,
      description,
      type,
      formats,
      startDate,
      endDate,
      locationId,
      zoneId,
    } = req.body;

    if (!title || !type) {
      return res
        .status(400)
        .json({ message: 'Report title and type are required' });
    }

    const parsedStartDate = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const reportData = await generateReportData(
      team.id,
      type as ReportType,
      parsedStartDate,
      parsedEndDate,
      locationId,
      zoneId
    );

    if (!reportData) {
      return res
        .status(404)
        .json({ message: 'No data found for the specified criteria' });
    }

    // Generate the primary format first (first in the formats array)
    const primaryFormat =
      formats && formats.length > 0 ? (formats[0] as ReportFormat) : 'PDF';
    const reportFileInfo = await generateReportFile(
      type as ReportType,
      primaryFormat,
      reportData
    );

    // Create the report record in the database
    const report = await prisma.report.create({
      data: {
        title,
        description,
        teamId: team.id,
        type: type as ReportType,
        formats: formats || ['PDF'],
        pages: Math.ceil(Object.keys(reportData).length / 10),
        generatedOn: new Date(),
        filePath: reportFileInfo?.filePath,
        fileSize: reportFileInfo?.fileSize,
        parameters: {
          create: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            locationId: locationId || null,
            zoneId: zoneId || null,
          },
        },
      },
    });

    // Generate the additional formats asynchronously if needed
    if (formats && formats.length > 1) {
      // We don't await this to avoid blocking the response
      Promise.all(
        formats.slice(1).map(async (format) => {
          try {
            await generateReportFile(
              type as ReportType,
              format as ReportFormat,
              reportData
            );
          } catch (err) {
            console.error(`Error generating ${format} format:`, err);
          }
        })
      );
    }

    return res.status(201).json({
      report,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return res
      .status(500)
      .json({ message: 'Failed to generate report', error });
  }
}

async function generateReportData(
  teamId: string,
  reportType: ReportType,
  startDate: Date,
  endDate: Date,
  locationId?: string,
  zoneId?: string
): Promise<ReportData | null> {
  // Validate that the requested location belongs to the team
  if (locationId) {
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        teamId: teamId,
      },
    });

    if (!location) {
      throw new Error('Location not found or does not belong to this team');
    }
  }

  // Validate that the requested zone belongs to a location that belongs to the team
  if (zoneId) {
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        location: {
          teamId: teamId,
        },
      },
    });

    if (!zone) {
      throw new Error('Zone not found or does not belong to this team');
    }
  }

  // This filter ensures we only get PPECompliance records that belong to the team's locations
  // following the relationship: Team -> Location -> Zone -> Device -> FilterDevice -> PPECompliance
  const baseFilter: ComplianceFilter = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
    filterDevice: {
      device: {
        zone: {
          location: {
            teamId, // This ensures data is only for locations in the specified team
          },
        },
      },
    },
  };

  // Add location filter if specified
  if (locationId) {
    baseFilter.filterDevice.device.zone.location.id = locationId;
  }

  // Add zone filter if specified
  if (zoneId) {
    baseFilter.filterDevice.device.zoneId = zoneId;
  }

  switch (reportType) {
    case 'COMPLIANCE_SUMMARY':
      return await generateComplianceSummary(baseFilter);
    case 'VIOLATION_TREND':
      return await generateViolationTrend(baseFilter);
    case 'REPEAT_OFFENDERS_ANALYSIS':
      return await generateRepeatOffendersAnalysis(baseFilter);
    case 'ZONE_LOCATION_ANALYSIS':
      return await generateZoneLocationAnalysis(baseFilter, teamId, locationId);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}

async function generateComplianceSummary(
  filter: ComplianceFilter
): Promise<ComplianceSummary> {
  const totalCompliance = await prisma.pPECompliance.count({
    where: filter,
  });

  const complianceRecords = await prisma.pPECompliance.findMany({
    where: filter,
    select: {
      timestamp: true,
      compliances: true,
    },
  });

  const complianceByDate = processComplianceByDate(complianceRecords);
  const ppeItemCompliance = await getPPEItemCompliance(filter);
  const hourlyCompliance = calculateHourlyCompliance(complianceRecords);

  return {
    summary: {
      totalDetections: totalCompliance,
      complianceRate: calculateComplianceRate(complianceByDate),
      totalViolations: calculateTotalViolations(complianceByDate),
      dateRange: {
        start: filter.timestamp.gte,
        end: filter.timestamp.lte,
      },
    },
    dailyCompliance: complianceByDate,
    ppeItemCompliance,
    hourlyCompliance,
  };
}

async function getPPEItemCompliance(filter: ComplianceFilter): Promise<
  Array<{
    name: string;
    total: number;
    compliant: number;
    complianceRate: number;
  }>
> {
  const devices = await prisma.device.findMany({
    where: {
      filterDevice: {
        compliance: {
          some: {
            timestamp: {
              gte: filter.timestamp.gte,
              lte: filter.timestamp.lte,
            },
          },
        },
      },
    },
    select: {
      id: true,
      ppeItems: {
        select: {
          teamPPEItem: {
            select: {
              id: true,
              ppeItem: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      filterDevice: {
        select: {
          compliance: {
            where: {
              timestamp: {
                gte: filter.timestamp.gte,
                lte: filter.timestamp.lte,
              },
            },
            select: {
              compliances: true,
            },
          },
        },
      },
    },
  });

  const ppeCompliance: Record<
    string,
    { name: string; total: number; compliant: number }
  > = {};

  devices.forEach((device) => {
    device.ppeItems.forEach((item) => {
      const ppeName = item.teamPPEItem.ppeItem.name;
      if (!ppeCompliance[ppeName]) {
        ppeCompliance[ppeName] = { name: ppeName, total: 0, compliant: 0 };
      }

      device.filterDevice?.compliance.forEach((compliance) => {
        ppeCompliance[ppeName].total++;

        const complianceKey = getPPEComplianceKey(ppeName);

        if (
          compliance.compliances &&
          typeof compliance.compliances === 'object' &&
          complianceKey &&
          compliance.compliances[complianceKey] === 'Yes'
        ) {
          ppeCompliance[ppeName].compliant++;
        }
      });
    });
  });

  return Object.values(ppeCompliance).map((item) => ({
    ...item,
    complianceRate: item.total > 0 ? (item.compliant / item.total) * 100 : 0,
  }));
}

function getPPEComplianceKey(ppeName: string): string | undefined {
  const mapping: Record<string, string> = {
    Vest: 'VestCompliance',
    Gloves: 'GlovesCompliance',
    'Hard Hat': 'HardHatCompliance',
    'Ear Protection': 'EarProtectionCompliance',
    'Safety Glasses': 'SafetyGlassesCompliance',
    'Steel-toe Boots': 'Steel-toeBootsCompliance',
    'Respiratory Mask': 'RespiratoryMaskCompliance',
  };

  return (
    mapping[ppeName] ||
    Object.values(mapping).find((key) =>
      ppeName.includes(key.replace('Compliance', ''))
    )
  );
}

function calculateHourlyCompliance(records: any[]): Array<{
  hour: number;
  total: number;
  compliant: number;
  complianceRate: number;
}> {
  const byHour: Record<
    number,
    { hour: number; total: number; compliant: number }
  > = {};

  records.forEach((record) => {
    const hour = new Date(record.timestamp).getHours();
    if (!byHour[hour]) {
      byHour[hour] = { hour, total: 0, compliant: 0 };
    }

    byHour[hour].total++;

    if (isRecordCompliant(record.compliances)) {
      byHour[hour].compliant++;
    }
  });

  return Object.values(byHour).map((item) => ({
    ...item,
    complianceRate: item.total > 0 ? (item.compliant / item.total) * 100 : 0,
  }));
}

function processComplianceByDate(
  records: any[]
): Array<{
  date: string;
  total: number;
  compliant: number;
  violations: number;
}> {
  const byDate: Record<
    string,
    { date: string; total: number; compliant: number; violations: number }
  > = {};

  records.forEach((record) => {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, total: 0, compliant: 0, violations: 0 };
    }

    byDate[date].total++;

    const recordCompliant = isRecordCompliant(record.compliances);

    if (recordCompliant) {
      byDate[date].compliant++;
    } else {
      byDate[date].violations++;
    }
  });

  return Object.values(byDate);
}

function calculateComplianceRate(
  complianceData: Array<{ compliant: number; total: number }>
): number {
  let totalCompliant = 0;
  let totalDetections = 0;

  complianceData.forEach((day) => {
    totalCompliant += Number(day.compliant || 0);
    totalDetections += Number(day.total || 0);
  });

  return totalDetections === 0 ? 0 : (totalCompliant / totalDetections) * 100;
}

function calculateTotalViolations(
  complianceData: Array<{ violations: number }>
): number {
  return complianceData.reduce(
    (sum, day) => sum + Number(day.violations || 0),
    0
  );
}

async function generateViolationTrend(
  filter: ComplianceFilter
): Promise<ViolationTrend> {
  const complianceRecords = await prisma.pPECompliance.findMany({
    where: filter,
    select: {
      timestamp: true,
      compliances: true,
      workerId: true,
      filterId: true,
      filterDevice: {
        select: {
          device: {
            select: {
              id: true,
              zoneId: true,
              zone: {
                select: {
                  name: true,
                  locationId: true,
                  location: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              ppeItems: {
                select: {
                  teamPPEItem: {
                    select: {
                      ppeItem: {
                        select: {
                          name: true,
                        },
                      },
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

  const violationsByDate = processViolationsByDate(complianceRecords);
  const violationTypes = processViolationTypes(complianceRecords);
  const hourlyViolations = processHourlyViolations(complianceRecords);
  const highRiskZones = processHighRiskZones(complianceRecords);

  return {
    summary: {
      totalViolations: calculateTotalViolationsFromArray(violationsByDate),
      violationRate: calculateViolationRate(violationsByDate),
      dateRange: {
        start: filter.timestamp.gte,
        end: filter.timestamp.lte,
      },
    },
    dailyViolations: violationsByDate,
    violationTypes,
    hourlyViolations,
    highRiskZones,
  };
}

async function generateRepeatOffendersAnalysis(
  filter: ComplianceFilter
): Promise<RepeatOffendersAnalysis> {
  const complianceRecords = await prisma.pPECompliance.findMany({
    where: filter,
    select: {
      workerId: true,
      compliances: true,
      timestamp: true,
      filterId: true,
      filterDevice: {
        select: {
          device: {
            select: {
              id: true,
              zoneId: true,
              zone: {
                select: {
                  name: true,
                  locationId: true,
                  location: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              ppeItems: {
                select: {
                  teamPPEItem: {
                    select: {
                      ppeItem: {
                        select: {
                          name: true,
                        },
                      },
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

  const repeatOffenders = processRepeatOffenders(complianceRecords);

  if (repeatOffenders.length === 0) {
    return {
      summary: {
        totalOffenders: 0,
        totalIncidents: 0,
        dateRange: {
          start: filter.timestamp.gte,
          end: filter.timestamp.lte,
        },
      },
      repeatOffenders: [],
    };
  }

  const offenderDetails = processOffenderDetails(
    complianceRecords,
    repeatOffenders
  );

  return {
    summary: {
      totalOffenders: repeatOffenders.length,
      totalIncidents: repeatOffenders.reduce(
        (acc, curr) => acc + curr.violations,
        0
      ),
      dateRange: {
        start: filter.timestamp.gte,
        end: filter.timestamp.lte,
      },
    },
    repeatOffenders: repeatOffenders.map((offender, index) => ({
      ...offender,
      rank: index + 1,
      ...(offenderDetails.find((d) => d.workerId === offender.workerId) || {}),
    })),
  };
}

async function generateZoneLocationAnalysis(
  filter: ComplianceFilter,
  teamId: string,
  locationId?: string
): Promise<ZoneLocationAnalysis> {
  const locationFilter = locationId ? { id: locationId } : { teamId };

  const locations = await prisma.location.findMany({
    where: locationFilter,
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
                  compliance: {
                    where: {
                      timestamp: {
                        gte: filter.timestamp.gte,
                        lte: filter.timestamp.lte,
                      },
                    },
                    select: {
                      id: true,
                      compliances: true,
                      timestamp: true,
                    },
                  },
                },
              },
              ppeItems: {
                select: {
                  teamPPEItem: {
                    select: {
                      ppeItem: {
                        select: {
                          name: true,
                        },
                      },
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

  const zonesData = processZoneAnalysisData(locations);
  const zonesArray = Object.values(zonesData).sort(
    (a: any, b: any) => a.complianceRate - b.complianceRate
  );

  return {
    summary: {
      totalZones: zonesArray.length,
      averageComplianceRate:
        zonesArray.length > 0
          ? zonesArray.reduce(
              (sum: number, zone: any) => sum + zone.complianceRate,
              0
            ) / zonesArray.length
          : 0,
      worstPerformingZone: zonesArray[0]?.zoneName || 'N/A',
      bestPerformingZone: zonesArray[zonesArray.length - 1]?.zoneName || 'N/A',
      dateRange: {
        start: filter.timestamp.gte,
        end: filter.timestamp.lte,
      },
    },
    zones: zonesArray,
  };
}

function processViolationsByDate(
  records: any[]
): Array<{ date: string; total_detections: number; violations: number }> {
  const byDate: Record<
    string,
    { date: string; total_detections: number; violations: number }
  > = {};

  records.forEach((record) => {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, total_detections: 0, violations: 0 };
    }

    byDate[date].total_detections++;

    if (!isRecordCompliant(record.compliances)) {
      byDate[date].violations++;
    }
  });

  return Object.values(byDate);
}

function processViolationTypes(
  records: any[]
): Array<{ name: string; violations: number }> {
  const violationsByType: Record<string, { name: string; violations: number }> =
    {};

  records.forEach((record) => {
    if (
      !isRecordCompliant(record.compliances) &&
      record.filterDevice?.device?.ppeItems
    ) {
      record.filterDevice.device.ppeItems.forEach((item: any) => {
        const ppeName = item.teamPPEItem.ppeItem.name;
        const complianceKey = getPPEComplianceKey(ppeName);

        if (
          complianceKey &&
          record.compliances &&
          record.compliances[complianceKey] === 'No'
        ) {
          if (!violationsByType[ppeName]) {
            violationsByType[ppeName] = { name: ppeName, violations: 0 };
          }
          violationsByType[ppeName].violations++;
        }
      });
    }
  });

  return Object.values(violationsByType);
}

function processHourlyViolations(records: any[]): Array<{
  hour: number;
  total: number;
  violations: number;
  violationRate: number;
}> {
  const byHour: Record<
    number,
    { hour: number; total: number; violations: number }
  > = {};

  records.forEach((record) => {
    const hour = new Date(record.timestamp).getHours();
    if (!byHour[hour]) {
      byHour[hour] = { hour, total: 0, violations: 0 };
    }

    byHour[hour].total++;

    if (!isRecordCompliant(record.compliances)) {
      byHour[hour].violations++;
    }
  });

  return Object.values(byHour).map((item) => ({
    ...item,
    violationRate: item.total > 0 ? (item.violations / item.total) * 100 : 0,
  }));
}

function processHighRiskZones(records: any[]): Array<{
  zone: string;
  location: string;
  total: number;
  violations: number;
  violationRate: number;
}> {
  const zoneViolations: Record<
    string,
    {
      zone: string;
      location: string;
      total: number;
      violations: number;
    }
  > = {};

  records.forEach((record) => {
    if (record.filterDevice?.device?.zone) {
      const zoneName = record.filterDevice.device.zone.name;
      const locationName = record.filterDevice.device.zone.location.name;
      const key = `${zoneName}_${locationName}`;

      if (!zoneViolations[key]) {
        zoneViolations[key] = {
          zone: zoneName,
          location: locationName,
          total: 0,
          violations: 0,
        };
      }

      zoneViolations[key].total++;

      if (!isRecordCompliant(record.compliances)) {
        zoneViolations[key].violations++;
      }
    }
  });

  return Object.values(zoneViolations)
    .map((zone) => ({
      ...zone,
      violationRate: zone.total > 0 ? (zone.violations / zone.total) * 100 : 0,
    }))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 10);
}

function calculateTotalViolationsFromArray(
  violationData: Array<{ violations: number }>
): number {
  return violationData.reduce(
    (sum, item) => sum + Number(item.violations || 0),
    0
  );
}

function calculateViolationRate(
  violationData: Array<{ total_detections: number; violations: number }>
): number {
  let totalViolations = 0;
  let totalDetections = 0;

  violationData.forEach((item: any) => {
    totalViolations += Number(item.violations || 0);
    totalDetections += Number(item.total_detections || 0);
  });

  return totalDetections === 0 ? 0 : (totalViolations / totalDetections) * 100;
}

function processRepeatOffenders(records: any[]): Array<{
  workerId: string;
  total_detections: number;
  violations: number;
  violationRate: number;
}> {
  const offenders: Record<
    string,
    {
      workerId: string;
      total_detections: number;
      violations: number;
    }
  > = {};

  records.forEach((record) => {
    const workerId = record.workerId;
    if (!workerId) return; // Skip records without workerId

    if (!offenders[workerId]) {
      offenders[workerId] = {
        workerId,
        total_detections: 0,
        violations: 0,
      };
    }

    offenders[workerId].total_detections++;

    if (!isRecordCompliant(record.compliances)) {
      offenders[workerId].violations++;
    }
  });

  return Object.values(offenders)
    .filter((offender) => offender.violations > 1)
    .map((offender) => ({
      ...offender,
      violationRate:
        offender.total_detections > 0
          ? (offender.violations / offender.total_detections) * 100
          : 0,
    }))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 20);
}

function processOffenderDetails(
  records: any[],
  repeatOffenders: Array<{ workerId: string }>
): Array<{
  workerId: string;
  totalDetections: number;
  violationsByType: Array<{ type: string; count: number }>;
  violationsByLocation: Array<{
    location: string;
    zone: string;
    violations: number;
  }>;
}> {
  const topWorkerIds = repeatOffenders.slice(0, 10).map((o) => o.workerId);
  const offenderDetails: Array<{
    workerId: string;
    totalDetections: number;
    violationsByType: Array<{ type: string; count: number }>;
    violationsByLocation: Array<{
      location: string;
      zone: string;
      violations: number;
    }>;
  }> = [];

  topWorkerIds.forEach((workerId) => {
    if (!workerId) return; // Skip invalid workerIds

    const workerRecords = records.filter((r) => r.workerId === workerId);

    const violationsByType: Record<string, { type: string; count: number }> =
      {};
    const violationsByLocation: Record<
      string,
      { location: string; zone: string; violations: number }
    > = {};

    workerRecords.forEach((record) => {
      if (!isRecordCompliant(record.compliances)) {
        // Process violations by type
        if (record.filterDevice?.device?.ppeItems) {
          record.filterDevice.device.ppeItems.forEach((item: any) => {
            const ppeName = item.teamPPEItem.ppeItem.name;
            const complianceKey = getPPEComplianceKey(ppeName);

            if (
              complianceKey &&
              record.compliances &&
              record.compliances[complianceKey] === 'No'
            ) {
              if (!violationsByType[ppeName]) {
                violationsByType[ppeName] = { type: ppeName, count: 0 };
              }
              violationsByType[ppeName].count++;
            }
          });
        }

        // Process violations by location
        if (record.filterDevice?.device?.zone) {
          const locationName = record.filterDevice.device.zone.location.name;
          const zoneName = record.filterDevice.device.zone.name;
          const key = `${locationName}_${zoneName}`;

          if (!violationsByLocation[key]) {
            violationsByLocation[key] = {
              location: locationName,
              zone: zoneName,
              violations: 0,
            };
          }

          violationsByLocation[key].violations++;
        }
      }
    });

    offenderDetails.push({
      workerId,
      totalDetections: workerRecords.length,
      violationsByType: Object.values(violationsByType),
      violationsByLocation: Object.values(violationsByLocation),
    });
  });

  return offenderDetails;
}

function processZoneAnalysisData(locations: any[]): Record<
  string,
  {
    zoneId: string;
    zoneName: string;
    locationName: string;
    locationId: string;
    totalDetections: number;
    compliant: number;
    violations: number;
    complianceRate: number;
    ppeCompliance: Array<{
      ppeName: string;
      totalDetections: number;
      compliant: number;
      complianceRate: number;
    }>;
    timeSeriesData: Array<{
      date: string;
      totalDetections: number;
      compliant: number;
      complianceRate: number;
    }>;
  }
> {
  const zonesData: Record<
    string,
    {
      zoneId: string;
      zoneName: string;
      locationName: string;
      locationId: string;
      totalDetections: number;
      compliant: number;
      violations: number;
      complianceRate: number;
      ppeCompliance: Array<{
        ppeName: string;
        totalDetections: number;
        compliant: number;
        complianceRate: number;
      }>;
      timeSeriesData: Array<{
        date: string;
        totalDetections: number;
        compliant: number;
        complianceRate: number;
      }>;
    }
  > = {};

  locations.forEach((location) => {
    if (!location.Zone) return;

    location.Zone.forEach((zone: any) => {
      if (!zone.devices) return;

      let totalDetections = 0;
      let compliant = 0;
      let violations = 0;
      const ppeCompliance: Record<
        string,
        {
          ppeName: string;
          totalDetections: number;
          compliant: number;
        }
      > = {};
      const timeSeriesData: Record<
        string,
        {
          date: string;
          totalDetections: number;
          compliant: number;
        }
      > = {};

      zone.devices.forEach((device: any) => {
        if (device.filterDevice?.compliance) {
          device.filterDevice.compliance.forEach((record: any) => {
            totalDetections++;

            const recordCompliant = isRecordCompliant(record.compliances);

            if (recordCompliant) {
              compliant++;
            } else {
              violations++;
            }

            // Process PPE compliance
            if (device.ppeItems) {
              device.ppeItems.forEach((item: any) => {
                const ppeName = item.teamPPEItem.ppeItem.name;
                if (!ppeCompliance[ppeName]) {
                  ppeCompliance[ppeName] = {
                    ppeName,
                    totalDetections: 0,
                    compliant: 0,
                  };
                }

                ppeCompliance[ppeName].totalDetections++;

                const complianceKey = getPPEComplianceKey(ppeName);
                if (
                  complianceKey &&
                  record.compliances &&
                  record.compliances[complianceKey] === 'Yes'
                ) {
                  ppeCompliance[ppeName].compliant++;
                }
              });
            }

            // Process time series data
            const date = new Date(record.timestamp).toISOString().split('T')[0];
            if (!timeSeriesData[date]) {
              timeSeriesData[date] = {
                date,
                totalDetections: 0,
                compliant: 0,
              };
            }

            timeSeriesData[date].totalDetections++;
            if (recordCompliant) {
              timeSeriesData[date].compliant++;
            }
          });
        }
      });

      // Only add zones with data
      if (totalDetections > 0) {
        zonesData[zone.id] = {
          zoneId: zone.id,
          zoneName: zone.name,
          locationName: location.name,
          locationId: location.id,
          totalDetections,
          compliant,
          violations,
          complianceRate:
            totalDetections > 0 ? (compliant / totalDetections) * 100 : 0,
          ppeCompliance: Object.values(ppeCompliance).map((item) => ({
            ...item,
            complianceRate:
              item.totalDetections > 0
                ? (item.compliant / item.totalDetections) * 100
                : 0,
          })),
          timeSeriesData: Object.values(timeSeriesData).map((item) => ({
            ...item,
            complianceRate:
              item.totalDetections > 0
                ? (item.compliant / item.totalDetections) * 100
                : 0,
          })),
        };
      }
    });
  });

  return zonesData;
}
