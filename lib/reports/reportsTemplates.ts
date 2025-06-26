import { ReportType } from '@prisma/client';
import ExcelJS from 'exceljs';
import type * as PDFKit from 'pdfkit';

// Template interfaces
export interface PDFTemplateOptions {
  doc: PDFKit.PDFDocument;
  data: any;
}

export interface ExcelTemplateOptions {
  workbook: ExcelJS.Workbook;
  data: any;
}

export interface CSVTemplateOptions {
  data: any;
}

/**
 * PDF Report Templates
 */
export function generateComplianceSummaryPDF({
  doc,
  data,
}: PDFTemplateOptions): void {
  doc.fontSize(24).text('Compliance Summary Report', { align: 'center' });
  doc.moveDown();

  // Add summary section
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Detections: ${data.summary.totalDetections}`);
  doc
    .fontSize(12)
    .text(`Compliance Rate: ${data.summary.complianceRate.toFixed(1)}%`);
  doc.fontSize(12).text(`Total Violations: ${data.summary.totalViolations}`);
  doc
    .fontSize(12)
    .text(
      `Date Range: ${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`
    );

  doc.moveDown();

  // Add PPE compliance table
  doc.fontSize(16).text('PPE Compliance', { underline: true });
  doc.moveDown(0.5);

  // Table headers
  const startX = 50;
  let y = doc.y;
  doc.fontSize(10).text('PPE Item', startX, y);
  doc.text('Total', startX + 150, y);
  doc.text('Compliant', startX + 200, y);
  doc.text('Rate', startX + 250, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 300, y)
    .stroke();
  doc.moveDown(0.5);

  // Table rows
  data.ppeItemCompliance.forEach((item: any) => {
    y = doc.y;
    doc.fontSize(10).text(item.name, startX, y);
    doc.text(item.total.toString(), startX + 150, y);
    doc.text(item.compliant.toString(), startX + 200, y);
    doc.text(`${item.complianceRate.toFixed(1)}%`, startX + 250, y);
    doc.moveDown(0.5);
  });

  doc.moveDown();

  // Add daily compliance section
  doc.addPage();
  doc.fontSize(16).text('Daily Compliance', { underline: true });
  doc.moveDown(0.5);

  // Table headers
  y = doc.y;
  doc.fontSize(10).text('Date', startX, y);
  doc.text('Total', startX + 150, y);
  doc.text('Compliant', startX + 200, y);
  doc.text('Violations', startX + 250, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 300, y)
    .stroke();
  doc.moveDown(0.5);

  // Table rows (limit to avoid too many pages)
  data.dailyCompliance.slice(0, 15).forEach((day: any) => {
    y = doc.y;
    doc.fontSize(10).text(day.date, startX, y);
    doc.text(day.total.toString(), startX + 150, y);
    doc.text(day.compliant.toString(), startX + 200, y);
    doc.text(day.violations.toString(), startX + 250, y);
    doc.moveDown(0.5);
  });

  // Add hourly compliance section
  doc.addPage();
  doc.fontSize(16).text('Hourly Compliance Analysis', { underline: true });
  doc.moveDown(0.5);

  // Table headers
  y = doc.y;
  doc.fontSize(10).text('Hour', startX, y);
  doc.text('Total', startX + 100, y);
  doc.text('Compliant', startX + 150, y);
  doc.text('Rate', startX + 200, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 250, y)
    .stroke();
  doc.moveDown(0.5);

  // Table rows for hourly data
  data.hourlyCompliance.forEach((hour: any) => {
    y = doc.y;
    doc.fontSize(10).text(`${hour.hour}:00`, startX, y);
    doc.text(hour.total.toString(), startX + 100, y);
    doc.text(hour.compliant.toString(), startX + 150, y);
    doc.text(`${hour.complianceRate.toFixed(1)}%`, startX + 200, y);
    doc.moveDown(0.5);
  });
}

export function generateViolationTrendPDF({
  doc,
  data,
}: PDFTemplateOptions): void {
  doc.fontSize(24).text('Violation Trends Report', { align: 'center' });
  doc.moveDown();

  // Add summary section
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Violations: ${data.summary.totalViolations}`);
  doc
    .fontSize(12)
    .text(`Violation Rate: ${data.summary.violationRate.toFixed(1)}%`);
  doc
    .fontSize(12)
    .text(
      `Date Range: ${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`
    );

  doc.moveDown(1);

  // Add violation types section
  doc.fontSize(16).text('Violation by Type', { underline: true });
  doc.moveDown(0.5);

  const startX = 50;
  let y = doc.y;
  doc.fontSize(10).text('PPE Type', startX, y);
  doc.text('Violations', startX + 200, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 300, y)
    .stroke();
  doc.moveDown(0.5);

  data.violationTypes.forEach((type: any) => {
    y = doc.y;
    doc.fontSize(10).text(type.name, startX, y);
    doc.text(type.violations.toString(), startX + 200, y);
    doc.moveDown(0.5);
  });

  // Add daily violations
  doc.addPage();
  doc.fontSize(16).text('Daily Violation Analysis', { underline: true });
  doc.moveDown(0.5);

  y = doc.y;
  doc.fontSize(10).text('Date', startX, y);
  doc.text('Total Detections', startX + 100, y);
  doc.text('Violations', startX + 200, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 300, y)
    .stroke();
  doc.moveDown(0.5);

  data.dailyViolations.slice(0, 15).forEach((day: any) => {
    y = doc.y;
    doc.fontSize(10).text(day.date, startX, y);
    doc.text(day.total_detections.toString(), startX + 100, y);
    doc.text(day.violations.toString(), startX + 200, y);
    doc.moveDown(0.5);
  });

  // Add high risk zones
  doc.addPage();
  doc.fontSize(16).text('High Risk Zones', { underline: true });
  doc.moveDown(0.5);

  y = doc.y;
  doc.fontSize(10).text('Zone', startX, y);
  doc.text('Location', startX + 100, y);
  doc.text('Total', startX + 200, y);
  doc.text('Violations', startX + 250, y);
  doc.text('Rate', startX + 300, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 350, y)
    .stroke();
  doc.moveDown(0.5);

  data.highRiskZones.forEach((zone: any) => {
    y = doc.y;
    doc.fontSize(10).text(zone.zone, startX, y);
    doc.text(zone.location, startX + 100, y);
    doc.text(zone.total.toString(), startX + 200, y);
    doc.text(zone.violations.toString(), startX + 250, y);
    doc.text(`${zone.violationRate.toFixed(1)}%`, startX + 300, y);
    doc.moveDown(0.5);
  });
}

export function generateRepeatOffendersPDF({
  doc,
  data,
}: PDFTemplateOptions): void {
  doc.fontSize(24).text('Repeat Offenders Analysis', { align: 'center' });
  doc.moveDown();

  // Add summary section
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Offenders: ${data.summary.totalOffenders}`);
  doc.fontSize(12).text(`Total Incidents: ${data.summary.totalIncidents}`);
  doc
    .fontSize(12)
    .text(
      `Date Range: ${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`
    );

  doc.moveDown(1);

  // Top repeat offenders table
  doc.fontSize(16).text('Top Repeat Offenders', { underline: true });
  doc.moveDown(0.5);

  const startX = 50;
  let y = doc.y;
  doc.fontSize(10).text('Rank', startX, y);
  doc.text('Worker ID', startX + 50, y);
  doc.text('Total Detections', startX + 150, y);
  doc.text('Violations', startX + 250, y);
  doc.text('Violation Rate', startX + 320, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 400, y)
    .stroke();
  doc.moveDown(0.5);

  data.repeatOffenders.slice(0, 15).forEach((offender: any) => {
    y = doc.y;
    doc.fontSize(10).text(offender.rank.toString(), startX, y);
    doc.text(offender.workerId, startX + 50, y);
    doc.text(offender.total_detections.toString(), startX + 150, y);
    doc.text(offender.violations.toString(), startX + 250, y);
    doc.text(`${offender.violationRate.toFixed(1)}%`, startX + 320, y);
    doc.moveDown(0.5);
  });

  // For top offenders, show detailed breakdown
  if (
    data.repeatOffenders.length > 0 &&
    data.repeatOffenders[0].violationsByType
  ) {
    const topOffender = data.repeatOffenders[0];

    doc.addPage();
    doc
      .fontSize(16)
      .text(`Top Offender Detail: ${topOffender.workerId}`, {
        underline: true,
      });
    doc.moveDown(0.5);

    // Violation by type
    doc.fontSize(14).text('Violations by Type');
    doc.moveDown(0.5);

    y = doc.y;
    doc.fontSize(10).text('Type', startX, y);
    doc.text('Count', startX + 150, y);

    doc.moveDown(0.5);
    y = doc.y;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 200, y)
      .stroke();
    doc.moveDown(0.5);

    topOffender.violationsByType.forEach((violation: any) => {
      y = doc.y;
      doc.fontSize(10).text(violation.type, startX, y);
      doc.text(violation.count.toString(), startX + 150, y);
      doc.moveDown(0.5);
    });

    // Violations by location
    doc.moveDown(1);
    doc.fontSize(14).text('Violations by Location');
    doc.moveDown(0.5);

    y = doc.y;
    doc.fontSize(10).text('Location', startX, y);
    doc.text('Zone', startX + 120, y);
    doc.text('Violations', startX + 220, y);

    doc.moveDown(0.5);
    y = doc.y;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 280, y)
      .stroke();
    doc.moveDown(0.5);

    if (topOffender.violationsByLocation) {
      topOffender.violationsByLocation.forEach((location: any) => {
        y = doc.y;
        doc.fontSize(10).text(location.location, startX, y);
        doc.text(location.zone, startX + 120, y);
        doc.text(location.violations.toString(), startX + 220, y);
        doc.moveDown(0.5);
      });
    }
  }
}

export function generateZoneLocationPDF({
  doc,
  data,
}: PDFTemplateOptions): void {
  doc.fontSize(24).text('Zone Location Analysis', { align: 'center' });
  doc.moveDown();

  // Add summary section
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Zones: ${data.summary.totalZones}`);
  doc
    .fontSize(12)
    .text(
      `Average Compliance Rate: ${data.summary.averageComplianceRate.toFixed(1)}%`
    );
  doc
    .fontSize(12)
    .text(`Best Performing Zone: ${data.summary.bestPerformingZone}`);
  doc
    .fontSize(12)
    .text(`Worst Performing Zone: ${data.summary.worstPerformingZone}`);
  doc
    .fontSize(12)
    .text(
      `Date Range: ${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`
    );

  doc.moveDown(1);

  // Zone analysis table
  doc.fontSize(16).text('Zone Performance Analysis', { underline: true });
  doc.moveDown(0.5);

  const startX = 50;
  let y = doc.y;
  doc.fontSize(10).text('Zone', startX, y);
  doc.text('Location', startX + 100, y);
  doc.text('Total', startX + 200, y);
  doc.text('Compliant', startX + 240, y);
  doc.text('Compliance Rate', startX + 300, y);

  doc.moveDown(0.5);
  y = doc.y;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 400, y)
    .stroke();
  doc.moveDown(0.5);

  data.zones.forEach((zone: any, index: number) => {
    // New page after certain number of zones
    if (index > 0 && index % 15 === 0) {
      doc.addPage();
      doc
        .fontSize(16)
        .text('Zone Performance Analysis (Continued)', { underline: true });
      doc.moveDown(0.5);

      y = doc.y;
      doc.fontSize(10).text('Zone', startX, y);
      doc.text('Location', startX + 100, y);
      doc.text('Total', startX + 200, y);
      doc.text('Compliant', startX + 240, y);
      doc.text('Compliance Rate', startX + 300, y);

      doc.moveDown(0.5);
      y = doc.y;
      doc
        .moveTo(startX, y)
        .lineTo(startX + 400, y)
        .stroke();
      doc.moveDown(0.5);
    }

    y = doc.y;
    doc.fontSize(10).text(zone.zoneName, startX, y);
    doc.text(zone.locationName, startX + 100, y);
    doc.text(zone.totalDetections.toString(), startX + 200, y);
    doc.text(zone.compliant.toString(), startX + 240, y);
    doc.text(`${zone.complianceRate.toFixed(1)}%`, startX + 300, y);
    doc.moveDown(0.5);
  });

  // Per-zone PPE compliance for the top zone
  if (data.zones.length > 0) {
    const topZone = data.zones[0];

    doc.addPage();
    doc
      .fontSize(16)
      .text(`Detailed Analysis: ${topZone.zoneName}`, { underline: true });
    doc.moveDown(0.5);

    // PPE Compliance breakdown
    doc.fontSize(14).text('PPE Compliance Breakdown');
    doc.moveDown(0.5);

    y = doc.y;
    doc.fontSize(10).text('PPE Item', startX, y);
    doc.text('Total', startX + 150, y);
    doc.text('Compliant', startX + 200, y);
    doc.text('Rate', startX + 250, y);

    doc.moveDown(0.5);
    y = doc.y;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 300, y)
      .stroke();
    doc.moveDown(0.5);

    if (topZone.ppeCompliance) {
      topZone.ppeCompliance.forEach((ppe: any) => {
        y = doc.y;
        doc.fontSize(10).text(ppe.ppeName, startX, y);
        doc.text(ppe.totalDetections.toString(), startX + 150, y);
        doc.text(ppe.compliant.toString(), startX + 200, y);
        doc.text(`${ppe.complianceRate.toFixed(1)}%`, startX + 250, y);
        doc.moveDown(0.5);
      });
    }

    // Time series data for the zone
    doc.moveDown(1);
    doc.fontSize(14).text('Compliance Trend Over Time');
    doc.moveDown(0.5);

    y = doc.y;
    doc.fontSize(10).text('Date', startX, y);
    doc.text('Total', startX + 150, y);
    doc.text('Compliant', startX + 200, y);
    doc.text('Rate', startX + 250, y);

    doc.moveDown(0.5);
    y = doc.y;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 300, y)
      .stroke();
    doc.moveDown(0.5);

    if (topZone.timeSeriesData) {
      topZone.timeSeriesData.slice(0, 15).forEach((timeData: any) => {
        y = doc.y;
        doc.fontSize(10).text(timeData.date, startX, y);
        doc.text(timeData.totalDetections.toString(), startX + 150, y);
        doc.text(timeData.compliant.toString(), startX + 200, y);
        doc.text(`${timeData.complianceRate.toFixed(1)}%`, startX + 250, y);
        doc.moveDown(0.5);
      });
    }
  }
}

/**
 * Excel Report Templates
 */
export async function generateComplianceSummaryExcel({
  workbook,
  data,
}: ExcelTemplateOptions): Promise<void> {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  summarySheet.addRows([
    { metric: 'Total Detections', value: data.summary.totalDetections },
    {
      metric: 'Compliance Rate',
      value: `${data.summary.complianceRate.toFixed(1)}%`,
    },
    { metric: 'Total Violations', value: data.summary.totalViolations },
    {
      metric: 'Date Range',
      value: `${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`,
    },
  ]);

  // Apply some styling
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // PPE compliance sheet
  const ppeSheet = workbook.addWorksheet('PPE Compliance');
  ppeSheet.columns = [
    { header: 'PPE Item', key: 'name', width: 20 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Compliant', key: 'compliant', width: 15 },
    { header: 'Compliance Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  ppeSheet.getRow(1).font = { bold: true };
  ppeSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.ppeItemCompliance.forEach((item: any) => {
    ppeSheet.addRow({
      name: item.name,
      total: item.total,
      compliant: item.compliant,
      rate: `${item.complianceRate.toFixed(1)}%`,
    });
  });

  // Daily compliance sheet
  const dailySheet = workbook.addWorksheet('Daily Compliance');
  dailySheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Compliant', key: 'compliant', width: 15 },
    { header: 'Violations', key: 'violations', width: 15 },
    { header: 'Compliance Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  dailySheet.getRow(1).font = { bold: true };
  dailySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.dailyCompliance.forEach((day: any) => {
    const rate = day.total > 0 ? (day.compliant / day.total) * 100 : 0;
    dailySheet.addRow({
      date: day.date,
      total: day.total,
      compliant: day.compliant,
      violations: day.violations,
      rate: `${rate.toFixed(1)}%`,
    });
  });

  // Hourly compliance sheet
  const hourlySheet = workbook.addWorksheet('Hourly Compliance');
  hourlySheet.columns = [
    { header: 'Hour', key: 'hour', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Compliant', key: 'compliant', width: 15 },
    { header: 'Compliance Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  hourlySheet.getRow(1).font = { bold: true };
  hourlySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.hourlyCompliance.forEach((hour: any) => {
    hourlySheet.addRow({
      hour: `${hour.hour}:00`,
      total: hour.total,
      compliant: hour.compliant,
      rate: `${hour.complianceRate.toFixed(1)}%`,
    });
  });
}

export async function generateViolationTrendExcel({
  workbook,
  data,
}: ExcelTemplateOptions): Promise<void> {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  summarySheet.addRows([
    { metric: 'Total Violations', value: data.summary.totalViolations },
    {
      metric: 'Violation Rate',
      value: `${data.summary.violationRate.toFixed(1)}%`,
    },
    {
      metric: 'Date Range',
      value: `${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`,
    },
  ]);

  // Style the header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Violation types sheet
  const typeSheet = workbook.addWorksheet('Violation Types');
  typeSheet.columns = [
    { header: 'PPE Type', key: 'name', width: 20 },
    { header: 'Violations', key: 'violations', width: 15 },
  ];

  // Style the header row
  typeSheet.getRow(1).font = { bold: true };
  typeSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.violationTypes.forEach((type: any) => {
    typeSheet.addRow({
      name: type.name,
      violations: type.violations,
    });
  });

  // Daily violations sheet
  const dailySheet = workbook.addWorksheet('Daily Violations');
  dailySheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Total Detections', key: 'total', width: 15 },
    { header: 'Violations', key: 'violations', width: 15 },
    { header: 'Violation Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  dailySheet.getRow(1).font = { bold: true };
  dailySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.dailyViolations.forEach((day: any) => {
    const rate =
      day.total_detections > 0
        ? (day.violations / day.total_detections) * 100
        : 0;
    dailySheet.addRow({
      date: day.date,
      total: day.total_detections,
      violations: day.violations,
      rate: `${rate.toFixed(1)}%`,
    });
  });

  // High risk zones sheet
  const zoneSheet = workbook.addWorksheet('High Risk Zones');
  zoneSheet.columns = [
    { header: 'Zone', key: 'zone', width: 20 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Violations', key: 'violations', width: 15 },
    { header: 'Violation Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  zoneSheet.getRow(1).font = { bold: true };
  zoneSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.highRiskZones.forEach((zone: any) => {
    zoneSheet.addRow({
      zone: zone.zone,
      location: zone.location,
      total: zone.total,
      violations: zone.violations,
      rate: `${zone.violationRate.toFixed(1)}%`,
    });
  });

  // Hourly violations sheet if available
  if (data.hourlyViolations) {
    const hourlySheet = workbook.addWorksheet('Hourly Violations');
    hourlySheet.columns = [
      { header: 'Hour', key: 'hour', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Violations', key: 'violations', width: 15 },
      { header: 'Violation Rate', key: 'rate', width: 15 },
    ];

    // Style the header row
    hourlySheet.getRow(1).font = { bold: true };
    hourlySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    data.hourlyViolations.forEach((hour: any) => {
      hourlySheet.addRow({
        hour: `${hour.hour}:00`,
        total: hour.total,
        violations: hour.violations,
        rate: `${hour.violationRate.toFixed(1)}%`,
      });
    });
  }
}

export async function generateRepeatOffendersExcel({
  workbook,
  data,
}: ExcelTemplateOptions): Promise<void> {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  summarySheet.addRows([
    { metric: 'Total Offenders', value: data.summary.totalOffenders },
    { metric: 'Total Incidents', value: data.summary.totalIncidents },
    {
      metric: 'Date Range',
      value: `${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`,
    },
  ]);

  // Style the header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Top offenders sheet
  const offendersSheet = workbook.addWorksheet('Repeat Offenders');
  offendersSheet.columns = [
    { header: 'Rank', key: 'rank', width: 10 },
    { header: 'Worker ID', key: 'workerId', width: 30 },
    { header: 'Total Detections', key: 'detections', width: 15 },
    { header: 'Violations', key: 'violations', width: 15 },
    { header: 'Violation Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  offendersSheet.getRow(1).font = { bold: true };
  offendersSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.repeatOffenders.forEach((offender: any) => {
    offendersSheet.addRow({
      rank: offender.rank,
      workerId: offender.workerId,
      detections: offender.total_detections,
      violations: offender.violations,
      rate: `${offender.violationRate.toFixed(1)}%`,
    });
  });

  // Create sheets for additional details for top offenders if available
  const topOffenders = data.repeatOffenders.slice(0, 3);
  topOffenders.forEach((offender: any, index: number) => {
    if (offender.violationsByType || offender.violationsByLocation) {
      const offenderSheet = workbook.addWorksheet(`Offender ${index + 1}`);

      // Add title and worker ID
      offenderSheet.mergeCells('A1:D1');
      const titleCell = offenderSheet.getCell('A1');
      titleCell.value = `Detailed Analysis for Worker ${offender.workerId}`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      // Skip a row
      const row = 3;

      // Add violation by type section
      if (offender.violationsByType) {
        offenderSheet.getCell(`A${row}`).value = 'Violations by Type';
        offenderSheet.getCell(`A${row}`).font = { bold: true };

        // Add headers
        offenderSheet.getCell(`A${row + 1}`).value = 'PPE Type';
        offenderSheet.getCell(`B${row + 1}`).value = 'Count';
        offenderSheet.getRow(row + 1).font = { bold: true };

        // Add data
        let currentRow = row + 2;
        offender.violationsByType.forEach((violation: any) => {
          offenderSheet.getCell(`A${currentRow}`).value = violation.type;
          offenderSheet.getCell(`B${currentRow}`).value = violation.count;
          currentRow++;
        });

        // Skip rows for next section
        currentRow += 2;

        // Add violations by location section if available
        if (offender.violationsByLocation) {
          offenderSheet.getCell(`A${currentRow}`).value =
            'Violations by Location';
          offenderSheet.getCell(`A${currentRow}`).font = { bold: true };

          // Add headers
          offenderSheet.getCell(`A${currentRow + 1}`).value = 'Location';
          offenderSheet.getCell(`B${currentRow + 1}`).value = 'Zone';
          offenderSheet.getCell(`C${currentRow + 1}`).value = 'Violations';
          offenderSheet.getRow(currentRow + 1).font = { bold: true };

          // Add data
          currentRow += 2;
          offender.violationsByLocation.forEach((location: any) => {
            offenderSheet.getCell(`A${currentRow}`).value = location.location;
            offenderSheet.getCell(`B${currentRow}`).value = location.zone;
            offenderSheet.getCell(`C${currentRow}`).value = location.violations;
            currentRow++;
          });
        }
      }
    }
  });
}

export async function generateZoneLocationExcel({
  workbook,
  data,
}: ExcelTemplateOptions): Promise<void> {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 25 },
  ];

  summarySheet.addRows([
    { metric: 'Total Zones', value: data.summary.totalZones },
    {
      metric: 'Average Compliance Rate',
      value: `${data.summary.averageComplianceRate.toFixed(1)}%`,
    },
    { metric: 'Best Performing Zone', value: data.summary.bestPerformingZone },
    {
      metric: 'Worst Performing Zone',
      value: data.summary.worstPerformingZone,
    },
    {
      metric: 'Date Range',
      value: `${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}`,
    },
  ]);

  // Style the header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Zones performance sheet
  const zonesSheet = workbook.addWorksheet('Zone Performance');
  zonesSheet.columns = [
    { header: 'Zone', key: 'zone', width: 20 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Total Detections', key: 'detections', width: 15 },
    { header: 'Compliant', key: 'compliant', width: 15 },
    { header: 'Violations', key: 'violations', width: 15 },
    { header: 'Compliance Rate', key: 'rate', width: 15 },
  ];

  // Style the header row
  zonesSheet.getRow(1).font = { bold: true };
  zonesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.zones.forEach((zone: any) => {
    zonesSheet.addRow({
      zone: zone.zoneName,
      location: zone.locationName,
      detections: zone.totalDetections,
      compliant: zone.compliant,
      violations: zone.violations,
      rate: `${zone.complianceRate.toFixed(1)}%`,
    });
  });

  // Create detailed sheet for top performing and worst performing zones
  if (data.zones.length > 0) {
    // Get best and worst zones
    const sortedZones = [...data.zones].sort(
      (a, b) => b.complianceRate - a.complianceRate
    );
    const bestZone = sortedZones[0];
    const worstZone = sortedZones[sortedZones.length - 1];

    // Create detailed sheets for both zones
    [bestZone, worstZone].forEach((zone: any, index: number) => {
      const sheetName = index === 0 ? 'Best Zone Detail' : 'Worst Zone Detail';
      const zoneSheet = workbook.addWorksheet(sheetName);

      // Add title
      zoneSheet.mergeCells('A1:D1');
      const titleCell = zoneSheet.getCell('A1');
      titleCell.value = `${zone.zoneName} (${zone.locationName})`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      // Add summary info
      zoneSheet.getCell('A3').value = 'Total Detections:';
      zoneSheet.getCell('B3').value = zone.totalDetections;
      zoneSheet.getCell('A4').value = 'Compliance Rate:';
      zoneSheet.getCell('B4').value = `${zone.complianceRate.toFixed(1)}%`;

      // Add PPE compliance breakdown
      zoneSheet.getCell('A6').value = 'PPE Compliance Breakdown';
      zoneSheet.getCell('A6').font = { bold: true };

      // Add headers
      zoneSheet.getCell('A7').value = 'PPE Item';
      zoneSheet.getCell('B7').value = 'Total';
      zoneSheet.getCell('C7').value = 'Compliant';
      zoneSheet.getCell('D7').value = 'Compliance Rate';
      zoneSheet.getRow(7).font = { bold: true };

      // Add data
      let currentRow = 8;
      if (zone.ppeCompliance) {
        zone.ppeCompliance.forEach((ppe: any) => {
          zoneSheet.getCell(`A${currentRow}`).value = ppe.ppeName;
          zoneSheet.getCell(`B${currentRow}`).value = ppe.totalDetections;
          zoneSheet.getCell(`C${currentRow}`).value = ppe.compliant;
          zoneSheet.getCell(`D${currentRow}`).value =
            `${ppe.complianceRate.toFixed(1)}%`;
          currentRow++;
        });
      }

      // Skip rows for time series data
      currentRow += 2;

      // Add time series data
      zoneSheet.getCell(`A${currentRow}`).value = 'Compliance Trend Over Time';
      zoneSheet.getCell(`A${currentRow}`).font = { bold: true };

      // Add headers
      zoneSheet.getCell(`A${currentRow + 1}`).value = 'Date';
      zoneSheet.getCell(`B${currentRow + 1}`).value = 'Total';
      zoneSheet.getCell(`C${currentRow + 1}`).value = 'Compliant';
      zoneSheet.getCell(`D${currentRow + 1}`).value = 'Compliance Rate';
      zoneSheet.getRow(currentRow + 1).font = { bold: true };

      // Add data
      currentRow += 2;
      if (zone.timeSeriesData) {
        zone.timeSeriesData.forEach((timeData: any) => {
          zoneSheet.getCell(`A${currentRow}`).value = timeData.date;
          zoneSheet.getCell(`B${currentRow}`).value = timeData.totalDetections;
          zoneSheet.getCell(`C${currentRow}`).value = timeData.compliant;
          zoneSheet.getCell(`D${currentRow}`).value =
            `${timeData.complianceRate.toFixed(1)}%`;
          currentRow++;
        });
      }
    });
  }
}

/**
 * CSV Report Templates
 */
export function generateComplianceSummaryCSV({
  data,
}: CSVTemplateOptions): string {
  let csvContent = '';

  // Summary section
  csvContent += 'Summary\n';
  csvContent += `Total Detections,${data.summary.totalDetections}\n`;
  csvContent += `Compliance Rate,${data.summary.complianceRate.toFixed(1)}%\n`;
  csvContent += `Total Violations,${data.summary.totalViolations}\n`;
  csvContent += `Date Range,${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}\n\n`;

  // PPE compliance section
  csvContent += 'PPE Compliance\n';
  csvContent += 'PPE Item,Total,Compliant,Compliance Rate\n';

  data.ppeItemCompliance.forEach((item: any) => {
    csvContent += `${item.name},${item.total},${item.compliant},${item.complianceRate.toFixed(1)}%\n`;
  });

  csvContent += '\n';

  // Daily compliance section
  csvContent += 'Daily Compliance\n';
  csvContent += 'Date,Total,Compliant,Violations\n';

  data.dailyCompliance.forEach((day: any) => {
    csvContent += `${day.date},${day.total},${day.compliant},${day.violations}\n`;
  });

  csvContent += '\n';

  // Hourly compliance section
  csvContent += 'Hourly Compliance\n';
  csvContent += 'Hour,Total,Compliant,Compliance Rate\n';

  data.hourlyCompliance.forEach((hour: any) => {
    csvContent += `${hour.hour}:00,${hour.total},${hour.compliant},${hour.complianceRate.toFixed(1)}%\n`;
  });

  return csvContent;
}

export function generateViolationTrendCSV({
  data,
}: CSVTemplateOptions): string {
  let csvContent = '';

  // Summary section
  csvContent += 'Summary\n';
  csvContent += `Total Violations,${data.summary.totalViolations}\n`;
  csvContent += `Violation Rate,${data.summary.violationRate.toFixed(1)}%\n`;
  csvContent += `Date Range,${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}\n\n`;

  // Violation types section
  csvContent += 'Violation by Type\n';
  csvContent += 'PPE Type,Violations\n';

  data.violationTypes.forEach((type: any) => {
    csvContent += `${type.name},${type.violations}\n`;
  });

  csvContent += '\n';

  // Daily violations section
  csvContent += 'Daily Violations\n';
  csvContent += 'Date,Total Detections,Violations\n';

  data.dailyViolations.forEach((day: any) => {
    csvContent += `${day.date},${day.total_detections},${day.violations}\n`;
  });

  csvContent += '\n';

  // High risk zones section
  csvContent += 'High Risk Zones\n';
  csvContent += 'Zone,Location,Total,Violations,Violation Rate\n';

  data.highRiskZones.forEach((zone: any) => {
    csvContent += `${zone.zone},${zone.location},${zone.total},${zone.violations},${zone.violationRate.toFixed(1)}%\n`;
  });

  // Hourly violations section if available
  if (data.hourlyViolations) {
    csvContent += '\nHourly Violations\n';
    csvContent += 'Hour,Total,Violations,Violation Rate\n';

    data.hourlyViolations.forEach((hour: any) => {
      csvContent += `${hour.hour}:00,${hour.total},${hour.violations},${hour.violationRate.toFixed(1)}%\n`;
    });
  }

  return csvContent;
}

export function generateRepeatOffendersCSV({
  data,
}: CSVTemplateOptions): string {
  let csvContent = '';

  // Summary section
  csvContent += 'Summary\n';
  csvContent += `Total Offenders,${data.summary.totalOffenders}\n`;
  csvContent += `Total Incidents,${data.summary.totalIncidents}\n`;
  csvContent += `Date Range,${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}\n\n`;

  // Repeat offenders section
  csvContent += 'Repeat Offenders\n';
  csvContent += 'Rank,Worker ID,Total Detections,Violations,Violation Rate\n';

  data.repeatOffenders.forEach((offender: any) => {
    csvContent += `${offender.rank},${offender.workerId},${offender.total_detections},${offender.violations},${offender.violationRate.toFixed(1)}%\n`;
  });

  // Add detailed data for top offenders
  if (data.repeatOffenders.length > 0) {
    const topOffender = data.repeatOffenders[0];

    if (topOffender.violationsByType) {
      csvContent += `\nViolations by Type for Worker ${topOffender.workerId}\n`;
      csvContent += 'Type,Count\n';

      topOffender.violationsByType.forEach((violation: any) => {
        csvContent += `${violation.type},${violation.count}\n`;
      });
    }

    if (topOffender.violationsByLocation) {
      csvContent += `\nViolations by Location for Worker ${topOffender.workerId}\n`;
      csvContent += 'Location,Zone,Violations\n';

      topOffender.violationsByLocation.forEach((location: any) => {
        csvContent += `${location.location},${location.zone},${location.violations}\n`;
      });
    }
  }

  return csvContent;
}

export function generateZoneLocationCSV({ data }: CSVTemplateOptions): string {
  let csvContent = '';

  // Summary section
  csvContent += 'Summary\n';
  csvContent += `Total Zones,${data.summary.totalZones}\n`;
  csvContent += `Average Compliance Rate,${data.summary.averageComplianceRate.toFixed(1)}%\n`;
  csvContent += `Best Performing Zone,${data.summary.bestPerformingZone}\n`;
  csvContent += `Worst Performing Zone,${data.summary.worstPerformingZone}\n`;
  csvContent += `Date Range,${new Date(data.summary.dateRange.start).toLocaleDateString()} to ${new Date(data.summary.dateRange.end).toLocaleDateString()}\n\n`;

  // Zone performance section
  csvContent += 'Zone Performance\n';
  csvContent +=
    'Zone,Location,Total Detections,Compliant,Violations,Compliance Rate\n';

  data.zones.forEach((zone: any) => {
    csvContent += `${zone.zoneName},${zone.locationName},${zone.totalDetections},${zone.compliant},${zone.violations},${zone.complianceRate.toFixed(1)}%\n`;
  });

  // Add detailed data for top zone
  if (data.zones.length > 0) {
    const topZone = data.zones[0];

    if (topZone.ppeCompliance) {
      csvContent += `\nPPE Compliance Breakdown for ${topZone.zoneName}\n`;
      csvContent += 'PPE Item,Total,Compliant,Compliance Rate\n';

      topZone.ppeCompliance.forEach((ppe: any) => {
        csvContent += `${ppe.ppeName},${ppe.totalDetections},${ppe.compliant},${ppe.complianceRate.toFixed(1)}%\n`;
      });
    }

    if (topZone.timeSeriesData) {
      csvContent += `\nCompliance Trend Over Time for ${topZone.zoneName}\n`;
      csvContent += 'Date,Total,Compliant,Compliance Rate\n';

      topZone.timeSeriesData.forEach((timeData: any) => {
        csvContent += `${timeData.date},${timeData.totalDetections},${timeData.compliant},${timeData.complianceRate.toFixed(1)}%\n`;
      });
    }
  }

  return csvContent;
}

// Function to get template function based on report type and format
export function getReportTemplate(
  reportType: ReportType,
  format: string
): Function | undefined {
  const templateMap = {
    PDF: {
      COMPLIANCE_SUMMARY: generateComplianceSummaryPDF,
      VIOLATION_TREND: generateViolationTrendPDF,
      REPEAT_OFFENDERS_ANALYSIS: generateRepeatOffendersPDF,
      ZONE_LOCATION_ANALYSIS: generateZoneLocationPDF,
    },
    EXCEL: {
      COMPLIANCE_SUMMARY: generateComplianceSummaryExcel,
      VIOLATION_TREND: generateViolationTrendExcel,
      REPEAT_OFFENDERS_ANALYSIS: generateRepeatOffendersExcel,
      ZONE_LOCATION_ANALYSIS: generateZoneLocationExcel,
    },
    CSV: {
      COMPLIANCE_SUMMARY: generateComplianceSummaryCSV,
      VIOLATION_TREND: generateViolationTrendCSV,
      REPEAT_OFFENDERS_ANALYSIS: generateRepeatOffendersCSV,
      ZONE_LOCATION_ANALYSIS: generateZoneLocationCSV,
    },
  };

  return templateMap[format as keyof typeof templateMap]?.[
    reportType as keyof (typeof templateMap)['PDF']
  ];
}
