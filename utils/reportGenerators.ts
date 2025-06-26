import { ReportType, ReportFormat } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  getReportTemplate,
  PDFTemplateOptions,
  ExcelTemplateOptions,
  CSVTemplateOptions,
} from '../lib/reports/reportsTemplates';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Define return types for better type safety
export interface GeneratedFileInfo {
  filePath: string;
  fileSize: number;
}

// Make sure the reports directory exists
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure the reports directory exists
async function ensureReportsDirectory(): Promise<void> {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      await mkdir(REPORTS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating reports directory:', err);
    throw err;
  }
}

/**
 * Generate a report file in the specified format
 */
export async function generateReportFile(
  reportType: ReportType,
  format: ReportFormat,
  data: any
): Promise<GeneratedFileInfo> {
  // Make sure the reports directory exists
  await ensureReportsDirectory();

  // Format the data according to report type
  const formattedData = formatReportData(reportType, data);

  switch (format) {
    case 'PDF':
      return await generatePDFReport(reportType, formattedData);
    case 'EXCEL':
      return await generateExcelReport(reportType, formattedData);
    case 'CSV':
      return await generateCSVReport(reportType, formattedData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Format report data based on report type
 */
function formatReportData(reportType: ReportType, data: any): any {
  switch (reportType) {
    case 'COMPLIANCE_SUMMARY':
      return formatComplianceSummaryData(data);
    case 'VIOLATION_TREND':
      return formatViolationTrendData(data);
    case 'REPEAT_OFFENDERS_ANALYSIS':
      return formatRepeatOffendersData(data);
    case 'ZONE_LOCATION_ANALYSIS':
      return formatZoneLocationData(data);
    default:
      return data;
  }
}

/**
 * Generate PDF report
 */
async function generatePDFReport(
  reportType: ReportType,
  data: any
): Promise<GeneratedFileInfo> {
  const filename = `${Date.now()}-${reportType}.pdf`;
  const filePath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      // Handle stream errors
      stream.on('error', reject);

      // When the document is finished, resolve the promise
      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        resolve({
          filePath,
          fileSize: stats.size,
        });
      });

      // Pipe the PDF document to the file
      doc.pipe(stream);

      // Get the appropriate template function with proper casting
      const templateFn = getReportTemplate(reportType, 'PDF');

      if (templateFn) {
        // Apply the template with correctly typed parameters
        const pdfTemplateFn = templateFn as (
          options: PDFTemplateOptions
        ) => void;
        pdfTemplateFn({ doc, data });
      } else {
        // Fallback for unsupported report types
        doc.fontSize(20).text(`${reportType} Report`, { align: 'center' });
        doc.moveDown(2);
        doc
          .fontSize(12)
          .text('No specific template for this report type.', {
            align: 'center',
          });
      }

      // Finalize the PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate Excel report
 */
async function generateExcelReport(
  reportType: ReportType,
  data: any
): Promise<GeneratedFileInfo> {
  const filename = `${Date.now()}-${reportType}.xlsx`;
  const filePath = path.join(REPORTS_DIR, filename);

  try {
    const workbook = new ExcelJS.Workbook();

    // Get the appropriate template function with proper casting
    const templateFn = getReportTemplate(reportType, 'EXCEL');

    if (templateFn) {
      // Apply the template with correctly typed parameters
      const excelTemplateFn = templateFn as (
        options: ExcelTemplateOptions
      ) => Promise<void>;
      await excelTemplateFn({ workbook, data });
    } else {
      // Fallback for unsupported report types
      const sheet = workbook.addWorksheet('Report');
      sheet.addRow([`${reportType} Report`]);
      sheet.addRow(['No specific template for this report type.']);
    }

    // Save the workbook
    await workbook.xlsx.writeFile(filePath);

    // Get the file size
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileSize: stats.size,
    };
  } catch (err) {
    console.error('Error generating Excel report:', err);
    throw err;
  }
}

/**
 * Generate CSV report
 */
async function generateCSVReport(
  reportType: ReportType,
  data: any
): Promise<GeneratedFileInfo> {
  const filename = `${Date.now()}-${reportType}.csv`;
  const filePath = path.join(REPORTS_DIR, filename);

  try {
    // Get the appropriate template function with proper casting
    const templateFn = getReportTemplate(reportType, 'CSV');

    let csvContent = '';
    if (templateFn) {
      // Apply the template with correctly typed parameters
      const csvTemplateFn = templateFn as (
        options: CSVTemplateOptions
      ) => string;
      csvContent = csvTemplateFn({ data });
    } else {
      // Fallback for unsupported report types
      csvContent = `Report Type,${reportType}\nNo specific template for this report type.`;
    }

    // Write the CSV content to a file
    await writeFile(filePath, csvContent);

    // Get the file size
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileSize: stats.size,
    };
  } catch (err) {
    console.error('Error generating CSV report:', err);
    throw err;
  }
}

/**
 * Data formatting utilities
 */
export function formatComplianceSummaryData(data: any): any {
  // Format and validate compliance summary data
  const formattedData = {
    summary: {
      totalDetections: data.summary?.totalDetections || 0,
      complianceRate: data.summary?.complianceRate || 0,
      totalViolations: data.summary?.totalViolations || 0,
      dateRange: {
        start: data.summary?.dateRange?.start || new Date(),
        end: data.summary?.dateRange?.end || new Date(),
      },
    },
    dailyCompliance: Array.isArray(data.dailyCompliance)
      ? data.dailyCompliance.map((item: any) => ({
          date: item.date || 'N/A',
          total: item.total || 0,
          compliant: item.compliant || 0,
          violations: item.violations || 0,
        }))
      : [],
    ppeItemCompliance: Array.isArray(data.ppeItemCompliance)
      ? data.ppeItemCompliance.map((item: any) => ({
          name: item.name || 'Unknown PPE',
          total: item.total || 0,
          compliant: item.compliant || 0,
          complianceRate: item.complianceRate || 0,
        }))
      : [],
    hourlyCompliance: Array.isArray(data.hourlyCompliance)
      ? data.hourlyCompliance.map((item: any) => ({
          hour: item.hour || 0,
          total: item.total || 0,
          compliant: item.compliant || 0,
          complianceRate: item.complianceRate || 0,
        }))
      : [],
  };

  return formattedData;
}

export function formatViolationTrendData(data: any): any {
  // Format and validate violation trend data
  const formattedData = {
    summary: {
      totalViolations: data.summary?.totalViolations || 0,
      violationRate: data.summary?.violationRate || 0,
      dateRange: {
        start: data.summary?.dateRange?.start || new Date(),
        end: data.summary?.dateRange?.end || new Date(),
      },
    },
    dailyViolations: Array.isArray(data.dailyViolations)
      ? data.dailyViolations.map((item: any) => ({
          date: item.date || 'N/A',
          total_detections: item.total_detections || 0,
          violations: item.violations || 0,
        }))
      : [],
    violationTypes: Array.isArray(data.violationTypes)
      ? data.violationTypes.map((item: any) => ({
          name: item.name || 'Unknown PPE',
          violations: item.violations || 0,
        }))
      : [],
    hourlyViolations: Array.isArray(data.hourlyViolations)
      ? data.hourlyViolations.map((item: any) => ({
          hour: item.hour || 0,
          total: item.total || 0,
          violations: item.violations || 0,
          violationRate: item.violationRate || 0,
        }))
      : [],
    highRiskZones: Array.isArray(data.highRiskZones)
      ? data.highRiskZones.map((item: any) => ({
          zone: item.zone || 'Unknown Zone',
          location: item.location || 'Unknown Location',
          total: item.total || 0,
          violations: item.violations || 0,
          violationRate: item.violationRate || 0,
        }))
      : [],
  };

  return formattedData;
}

export function formatRepeatOffendersData(data: any): any {
  // Format and validate repeat offenders data
  const formattedData = {
    summary: {
      totalOffenders: data.summary?.totalOffenders || 0,
      totalIncidents: data.summary?.totalIncidents || 0,
      dateRange: {
        start: data.summary?.dateRange?.start || new Date(),
        end: data.summary?.dateRange?.end || new Date(),
      },
    },
    repeatOffenders: Array.isArray(data.repeatOffenders)
      ? data.repeatOffenders.map((offender: any) => ({
          rank: offender.rank || 0,
          workerId: offender.workerId || 'Unknown Worker',
          total_detections: offender.total_detections || 0,
          violations: offender.violations || 0,
          violationRate: offender.violationRate || 0,
          violationsByType: Array.isArray(offender.violationsByType)
            ? offender.violationsByType
            : [],
          violationsByLocation: Array.isArray(offender.violationsByLocation)
            ? offender.violationsByLocation
            : [],
        }))
      : [],
  };

  return formattedData;
}

export function formatZoneLocationData(data: any): any {
  // Format and validate zone location data
  const formattedData = {
    summary: {
      totalZones: data.summary?.totalZones || 0,
      averageComplianceRate: data.summary?.averageComplianceRate || 0,
      bestPerformingZone: data.summary?.bestPerformingZone || 'N/A',
      worstPerformingZone: data.summary?.worstPerformingZone || 'N/A',
      dateRange: {
        start: data.summary?.dateRange?.start || new Date(),
        end: data.summary?.dateRange?.end || new Date(),
      },
    },
    zones: Array.isArray(data.zones)
      ? data.zones.map((zone: any) => ({
          zoneId: zone.zoneId || 'unknown',
          zoneName: zone.zoneName || 'Unknown Zone',
          locationName: zone.locationName || 'Unknown Location',
          locationId: zone.locationId || 'unknown',
          totalDetections: zone.totalDetections || 0,
          compliant: zone.compliant || 0,
          violations: zone.violations || 0,
          complianceRate: zone.complianceRate || 0,
          ppeCompliance: Array.isArray(zone.ppeCompliance)
            ? zone.ppeCompliance.map((ppe: any) => ({
                ppeName: ppe.ppeName || 'Unknown PPE',
                totalDetections: ppe.totalDetections || 0,
                compliant: ppe.compliant || 0,
                complianceRate: ppe.complianceRate || 0,
              }))
            : [],
          timeSeriesData: Array.isArray(zone.timeSeriesData)
            ? zone.timeSeriesData.map((timeData: any) => ({
                date: timeData.date || 'N/A',
                totalDetections: timeData.totalDetections || 0,
                compliant: timeData.compliant || 0,
                complianceRate: timeData.complianceRate || 0,
              }))
            : [],
        }))
      : [],
  };

  return formattedData;
}
