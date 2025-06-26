import React, { useState, useEffect, useRef } from 'react';
import {
  FiDownload,
  FiMail,
  FiCalendar,
  FiFileText,
  FiGrid,
  FiDatabase,
  FiX,
  FiChevronDown,
  FiLoader,
} from 'react-icons/fi';
import { useReports } from '../../../../hooks/useReportHooks';
import { useRouter } from 'next/router';
import useOrgTheme from '../../../../hooks/useOrgTheme';
import { ReportFormat, ReportType } from '@prisma/client';
import { Table } from '../../../shared/table/Table';
import { TableBodyType } from '../../../shared/table/TableBody';
import ButtonFromTheme from '../../../shared/ButtonFromTheme';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getReportData, Report as SampleReport } from './reportsData';

interface ComplianceReportsProps {
  // You can add props here as needed
}

// Default report templates for the UI
const DEFAULT_REPORT_TEMPLATES = [
  {
    id: 'template-COMPLIANCE_SUMMARY',
    type: 'COMPLIANCE_SUMMARY' as ReportType,
    title: 'Compliance Summary Report',
    description: 'Overview of compliance metrics across all areas',
    pages: 5,
  },
  {
    id: 'template-VIOLATION_TREND',
    type: 'VIOLATION_TREND' as ReportType,
    title: 'Violation Trends Report',
    description: 'Analysis of violation patterns over time',
    pages: 8,
  },
  {
    id: 'template-REPEAT_OFFENDERS_ANALYSIS',
    type: 'REPEAT_OFFENDERS_ANALYSIS' as ReportType,
    title: 'Repeat Offenders Analysis',
    description: 'Detailed analysis of repeat offenders',
    pages: 10,
  },
  {
    id: 'template-ZONE_LOCATION_ANALYSIS',
    type: 'ZONE_LOCATION_ANALYSIS' as ReportType,
    title: 'Zone Location Analysis',
    description: 'Compliance analysis by zone and location',
    pages: 12,
  },
];

const ComplianceReports: React.FC<ComplianceReportsProps> = () => {
  // Keep the original samples from reportsData.ts for UI consistency
  const [samples] = useState<SampleReport[]>(getReportData());

  // Manage date ranges for each report template
  const [dateRanges, setDateRanges] = useState<
    Record<string, { start?: Date; end?: Date }>
  >({});
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [formats, setFormats] = useState<Record<string, ReportFormat[]>>({});

  // Track which dropdown is currently open (only one can be open at a time)
  const [openDropdown, setOpenDropdown] = useState<{
    type: 'date' | 'format';
    id: string;
  } | null>(null);

  const router = useRouter();
  const { slug } = router.query;
  const teamSlug = Array.isArray(slug) ? slug[0] : slug || '';

  const { theme } = useOrgTheme(teamSlug);
  const {
    reports,
    isLoading,
    error,
    fetchReports,
    downloadReport,
    generateReport,
  } = useReports(teamSlug);

  // Create refs for the containers
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teamSlug) {
      fetchReports();
    }
  }, [teamSlug, fetchReports]);

  // Initialize formats for report templates
  useEffect(() => {
    // Set default formats for all templates
    const defaultFormats: Record<string, ReportFormat[]> = {};
    DEFAULT_REPORT_TEMPLATES.forEach((template) => {
      defaultFormats[template.id] = ['PDF'];
    });
    setFormats(defaultFormats);
  }, []);

  // Add global click listener to close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openDropdown &&
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    // Add event listener only when a dropdown is open
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Format handlers
  const formatIcons = {
    PDF: <FiFileText className="h-4 w-4 mr-1" />,
    EXCEL: <FiGrid className="h-4 w-4 mr-1" />,
    CSV: <FiDatabase className="h-4 w-4 mr-1" />,
  };

  const toggleDatePicker = (reportId: string) => {
    if (
      openDropdown &&
      openDropdown.type === 'date' &&
      openDropdown.id === reportId
    ) {
      // Close the dropdown if it's already open
      setOpenDropdown(null);
    } else {
      // Open this dropdown and close any others
      setOpenDropdown({ type: 'date', id: reportId });
    }
  };

  const toggleFormatDropdown = (reportId: string) => {
    if (
      openDropdown &&
      openDropdown.type === 'format' &&
      openDropdown.id === reportId
    ) {
      // Close the dropdown if it's already open
      setOpenDropdown(null);
    } else {
      // Open this dropdown and close any others
      setOpenDropdown({ type: 'format', id: reportId });
    }
  };

  const handleDateChange = (
    reportId: string,
    dates: [Date | null, Date | null]
  ) => {
    const [start, end] = dates;

    // Update the date range state
    setDateRanges((prev) => ({
      ...prev,
      [reportId]: {
        start: start || undefined,
        end: end || undefined,
      },
    }));

    // Only close the calendar if both dates are selected
    // This ensures the calendar stays open during range selection
    if (start && end) {
      // Add a short delay to allow the user to see their selection before closing
      setTimeout(() => setOpenDropdown(null), 300);
    }
  };

  const toggleFormat = (reportId: string, format: ReportFormat) => {
    setFormats((prev) => {
      const currentFormats = [...(prev[reportId] || [])];

      if (currentFormats.includes(format)) {
        // Don't remove the last format
        if (currentFormats.length <= 1) {
          return prev;
        }
        return {
          ...prev,
          [reportId]: currentFormats.filter((f) => f !== format),
        };
      } else {
        return {
          ...prev,
          [reportId]: [...currentFormats, format],
        };
      }
    });
  };

  const handleGenerateReport = async (
    reportId: string,
    title: string,
    type: ReportType
  ) => {
    const dateRange = dateRanges[reportId];
    if (!dateRange?.start || !dateRange?.end) {
      alert('Please select a date range first');
      return;
    }

    const reportFormats = formats[reportId];
    if (!reportFormats || reportFormats.length === 0) {
      alert('Please select at least one format');
      return;
    }

    setActiveReport(reportId);

    try {
      const reportData = {
        title,
        description: `Generated ${formatReportType(type)} report`,
        type,
        formats: reportFormats,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      };

      // Generate the report
      const generatedReport = await generateReport(reportData);
      await fetchReports();

      // If report was generated successfully, trigger download for each format
      if (generatedReport) {
        // Download each format, but wait briefly between downloads
        for (let i = 0; i < reportFormats.length; i++) {
          // Small delay between downloads to prevent browser issues
          if (i > 0) await new Promise((r) => setTimeout(r, 500));

          await downloadReport(generatedReport.id, reportFormats[i]);
        }
      }

      // Clear the date range after successful generation
      setDateRanges((prev) => ({
        ...prev,
        [reportId]: { start: undefined, end: undefined },
      }));
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setActiveReport(null);
    }
  };

  const handleDownload = async (reportId: string, format: ReportFormat) => {
    await downloadReport(reportId, format);
  };

  // Format date ranges for display
  const formatDateRange = (reportId: string) => {
    const range = dateRanges[reportId] || {};
    if (!range.start) return 'Select date range';

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    if (range.start && range.end) {
      return `${formatDate(range.start)} - ${formatDate(range.end)}`;
    }

    return formatDate(range.start);
  };

  // For the date picker dropdown
  const datePickerStyles = {
    position: 'absolute' as const,
    zIndex: 100,
    right: 0,
    top: '100%',
    minWidth: '300px',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
  };

  // Add a separate click handler for the dropdown container to stop propagation
  const handleDropdownContentClick = (e: React.MouseEvent) => {
    // Prevent clicks inside the dropdown from closing it
    e.stopPropagation();
  };

  // Prepare table data for displaying generated reports
  const tableColumns = ['Title', 'Type', 'Generated', 'Formats', 'Actions'];
  const tableData: TableBodyType[] = reports.map((report) => ({
    id: report.id,
    cells: [
      { text: report.title },
      { text: formatReportType(report.type) },
      { text: formatDate(new Date(report.generatedOn)) },
      {
        element: (
          <div className="flex space-x-2">
            {report.formats.map((format) => (
              <span
                key={format}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs flex items-center"
              >
                {formatIcons[format as keyof typeof formatIcons]} {format}
              </span>
            ))}
          </div>
        ),
      },
      {
        actions: [
          {
            text: 'Download',
            icon: <FiDownload className="h-5 w-5" />,
            onClick: () => handleDownload(report.id, report.formats[0]),
            destructive: false,
          },
        ],
      },
    ],
  }));

  return (
    <div>
      {/* Sample report tiles - using the same UI as the original */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {samples.map((report, index) => {
          // Match each sample with a report template type (using index for simplicity)
          const reportTemplate =
            DEFAULT_REPORT_TEMPLATES[index % DEFAULT_REPORT_TEMPLATES.length];
          const reportId = reportTemplate.id;

          // Create a unique ID for this report card (for dropdown identification)
          const uniqueReportId = `${reportId}-${index}`;

          return (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-textColor">
                  {report.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {report.frequency}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Generated on {report.generatedOn}
                </p>
              </div>

              <div className="p-4 flex items-center space-x-4 text-gray-600 dark:text-gray-400 text-xs">
                {report.formats.map((format) => (
                  <div key={format} className="flex items-center">
                    {formatIcons[
                      format.toUpperCase() as keyof typeof formatIcons
                    ] || <FiFileText className="h-4 w-4 mr-1" />}{' '}
                    {formatReportFormat(format)}
                  </div>
                ))}
              </div>

              <div className="p-4 flex justify-between items-center">
                <ButtonFromTheme
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                  outline
                  icon={
                    activeReport === uniqueReportId ? (
                      <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FiDownload className="h-4 w-4 mr-2" />
                    )
                  }
                  iconClassName=""
                  onClick={() =>
                    handleGenerateReport(
                      uniqueReportId,
                      report.title,
                      reportTemplate.type
                    )
                  }
                  disabled={activeReport === uniqueReportId}
                >
                  {activeReport === uniqueReportId
                    ? 'Generating...'
                    : 'Generate'}
                </ButtonFromTheme>

                <div className="flex items-center space-x-2">
                  {/* Date picker icon and dropdown */}
                  <div className="relative">
                    <button
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => toggleDatePicker(uniqueReportId)}
                      aria-label="Select date range"
                    >
                      <FiCalendar className="h-5 w-5" />
                    </button>

                    {openDropdown &&
                      openDropdown.type === 'date' &&
                      openDropdown.id === uniqueReportId && (
                        <div
                          ref={dropdownContainerRef}
                          style={datePickerStyles}
                          className="dark:bg-gray-800 dark:border-gray-700"
                          onClick={handleDropdownContentClick}
                        >
                          <div className="mb-2 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {formatDateRange(uniqueReportId)}
                            </span>
                            <button
                              onClick={() => setOpenDropdown(null)}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                          <DatePicker
                            selected={dateRanges[uniqueReportId]?.start}
                            onChange={(dates) =>
                              handleDateChange(
                                uniqueReportId,
                                dates as [Date | null, Date | null]
                              )
                            }
                            startDate={dateRanges[uniqueReportId]?.start}
                            endDate={dateRanges[uniqueReportId]?.end}
                            selectsRange
                            inline
                            calendarClassName="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                            shouldCloseOnSelect={false}
                          />
                        </div>
                      )}
                  </div>

                  {/* Format dropdown */}
                  <div className="relative">
                    <button
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => toggleFormatDropdown(uniqueReportId)}
                      aria-label="Select formats"
                    >
                      <FiFileText className="h-5 w-5" />
                    </button>

                    {openDropdown &&
                      openDropdown.type === 'format' &&
                      openDropdown.id === uniqueReportId && (
                        <div
                          ref={dropdownContainerRef}
                          className="absolute z-10 mt-1 right-0 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-700"
                          onClick={handleDropdownContentClick}
                        >
                          <div className="py-1">
                            {(['PDF', 'EXCEL', 'CSV'] as ReportFormat[]).map(
                              (format) => (
                                <div
                                  key={format}
                                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                  onClick={() =>
                                    toggleFormat(uniqueReportId, format)
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={(
                                      formats[uniqueReportId] || ['PDF']
                                    ).includes(format)}
                                    onChange={() => {}}
                                    className="mr-2"
                                  />
                                  <span className="flex items-center text-sm">
                                    {
                                      formatIcons[
                                        format as keyof typeof formatIcons
                                      ]
                                    }{' '}
                                    {format}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <FiMail className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-right text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                {report.pages} pages
              </div>
            </div>
          );
        })}
      </div>

      {/* Display generated reports in a table below */}
      <div className="mt-8">
        <Table
          heading="Generated Reports"
          cols={tableColumns}
          body={tableData}
          showDropdown={false}
        />

        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <FiLoader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            No reports have been generated yet. Use the tiles above to generate
            reports.
          </div>
        )}

        {error && (
          <div className="text-center p-4 text-red-500">
            Error: {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for formatting
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatReportType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatReportFormat(format: string): string {
  const formatNames: Record<string, string> = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
  };
  return formatNames[format.toLowerCase()] || format;
}

export default ComplianceReports;
