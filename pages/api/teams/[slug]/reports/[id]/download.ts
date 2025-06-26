import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, ReportFormat, Report, ReportType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { generateReportFile } from '../../../../../../utils/reportGenerators';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// Define typed response
interface DownloadResponse {
  message?: string;
  error?: any;
  // The actual response will be the file data
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DownloadResponse | Buffer | string>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { slug, id } = req.query;
  const format = (
    (req.query.format as string) || 'PDF'
  ).toUpperCase() as ReportFormat;

  if (!slug || Array.isArray(slug) || !id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }

  try {
    // Find team and verify membership
    const team = await prisma.team.findUnique({
      where: { slug: slug as string },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!team || team.members.length === 0) {
      return res
        .status(404)
        .json({ message: 'Team not found or you are not a member' });
    }

    // Find the report with its parameters and verify it belongs to this team
    const report = await prisma.report.findFirst({
      where: {
        id: id as string,
        teamId: team.id, // This ensures the report belongs to the team
      },
      include: {
        parameters: true, // Include stored parameters
      },
    });

    if (!report) {
      return res
        .status(404)
        .json({ message: 'Report not found or unauthorized access' });
    }

    // Record the download
    await prisma.reportDownload.create({
      data: {
        reportId: report.id,
        userId: session.user.id,
        downloadedAt: new Date(),
      },
    });

    let filePath = report.filePath;
    let fileExists = false;

    // Check if the file exists and is in the correct format
    if (filePath) {
      const fileExtension = path.extname(filePath).toLowerCase();
      const requestedExtension = `.${format.toLowerCase()}`;

      if (fileExtension === requestedExtension && fs.existsSync(filePath)) {
        fileExists = true;
      }
    }

    // If file doesn't exist or is in wrong format, generate it
    if (!fileExists) {
      // Fetch the report data using stored parameters or fall back to team-filtered data
      const reportData = await fetchReportData(report, team.id);

      // Generate the report file in the requested format
      const fileInfo = await generateReportFile(
        report.type,
        format,
        reportData
      );
      filePath = fileInfo.filePath;

      // Update the report record with the new file path if it's PDF (default format)
      if (
        format === 'PDF' &&
        (!report.filePath || !fs.existsSync(report.filePath))
      ) {
        await prisma.report.update({
          where: { id: report.id },
          data: { filePath: filePath, fileSize: fileInfo.fileSize },
        });
      }
    }

    // Format the current date for the filename
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Set appropriate content type and headers
    // Create a cleaned version of the title (no spaces, special chars)
    const cleanTitle = report.title.replace(/[^a-zA-Z0-9]/g, '_');

    // Use correct file extension for each format
    let fileExtension: string;
    switch (format) {
      case 'CSV':
        fileExtension = 'csv';
        res.setHeader('Content-Type', 'text/csv');
        break;
      case 'EXCEL':
        fileExtension = 'xlsx'; // Corrected from 'excel' to 'xlsx'
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        break;
      case 'PDF':
      default:
        fileExtension = 'pdf';
        res.setHeader('Content-Type', 'application/pdf');
        break;
    }

    const fileName = `${cleanTitle}_${currentDate}.${fileExtension}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath!);
    fileStream.pipe(res);

    // Handle file streaming errors
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      // If the stream has already started, we can't send a JSON response
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file', error: err });
      }
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return res
      .status(500)
      .json({ message: 'Failed to download report', error });
  }
}

// Function to fetch report data for regeneration
async function fetchReportData(
  report: Report & { parameters?: any },
  teamId: string
): Promise<any> {
  try {
    // Create the base filter to ensure we only access data belonging to this team
    const baseFilter: ComplianceFilter = {
      timestamp: {
        // Default to last 30 days if no parameters
        gte: report.parameters?.startDate
          ? new Date(report.parameters.startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: report.parameters?.endDate
          ? new Date(report.parameters.endDate)
          : new Date(),
      },
      filterDevice: {
        device: {
          zone: {
            location: {
              teamId, // Always enforce team scoping
            },
          },
        },
      },
    };

    // Add location filter if specified in parameters
    if (report.parameters?.locationId) {
      baseFilter.filterDevice.device.zone.location.id =
        report.parameters.locationId;
    }

    // Add zone filter if specified in parameters
    if (report.parameters?.zoneId) {
      baseFilter.filterDevice.device.zoneId = report.parameters.zoneId;
    }

    // Generate data based on report type using the appropriate filter
    switch (report.type) {
      case 'COMPLIANCE_SUMMARY':
        return await generateComplianceSummary(baseFilter);
      case 'VIOLATION_TREND':
        return await generateViolationTrend(baseFilter);
      case 'REPEAT_OFFENDERS_ANALYSIS':
        return await generateRepeatOffendersAnalysis(baseFilter);
      case 'ZONE_LOCATION_ANALYSIS':
        return await generateZoneLocationAnalysis(
          baseFilter,
          teamId,
          report.parameters?.locationId
        );
      default:
        throw new Error(`Unsupported report type: ${report.type}`);
    }
  } catch (error) {
    console.error('Error creating report data:', error);
    throw error;
  }
}

// These functions mirror the implementation from generate.ts to maintain consistency
// Using the same logic to ensure reports are properly generated with real data

async function generateComplianceSummary(filter: any): Promise<any> {
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

async function generateViolationTrend(filter: any): Promise<any> {
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

async function generateRepeatOffendersAnalysis(filter: any): Promise<any> {
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
  filter: any,
  teamId: string,
  locationId?: string
): Promise<any> {
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

// Helper functions - implementing the same logic as in generate.ts
function isRecordCompliant(compliances: any): boolean {
  if (typeof compliances !== 'object' || compliances === null) {
    return false;
  }
  return !Object.values(compliances).some((value) => value === 'No');
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

async function getPPEItemCompliance(filter: any): Promise<Array<any>> {
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

function calculateHourlyCompliance(records: any[]): Array<any> {
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

function calculateComplianceRate(complianceData: Array<any>): number {
  let totalCompliant = 0;
  let totalDetections = 0;

  complianceData.forEach((day) => {
    totalCompliant += Number(day.compliant || 0);
    totalDetections += Number(day.total || 0);
  });

  return totalDetections === 0 ? 0 : (totalCompliant / totalDetections) * 100;
}

function calculateTotalViolations(complianceData: Array<any>): number {
  return complianceData.reduce(
    (sum, day) => sum + Number(day.violations || 0),
    0
  );
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

function processHourlyViolations(records: any[]): Array<any> {
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

function processHighRiskZones(records: any[]): Array<any> {
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

function processRepeatOffenders(records: any[]): Array<any> {
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
  repeatOffenders: any[]
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

  for (const workerId of topWorkerIds) {
    if (!workerId) continue; // Skip invalid workerIds

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
  }

  return offenderDetails;
}

function processZoneAnalysisData(locations: any[]): Record<string, any> {
  const zonesData: Record<string, any> = {};

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
