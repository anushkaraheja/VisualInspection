import { useState, useCallback } from 'react';
import { ReportFormat, ReportType } from '@prisma/client';
import { toast } from 'react-hot-toast';

// Types matching our frontend needs (adapted from the DB schema)
export interface ReportData {
  id: string;
  title: string;
  description?: string | null;
  type: ReportType;
  formats: ReportFormat[];
  generatedOn: string | Date;
  pages: number;
  fileSize?: number | null;
  teamId: string;
  downloads?: number; // Added from API response
}

export interface ReportDownloadData {
  reportId: string;
  userId: string;
  downloadedAt: string | Date;
}

interface UseReportsResult {
  reports: ReportData[];
  isLoading: boolean;
  error: Error | null;
  fetchReports: (filter?: string) => Promise<void>;
  downloadReport: (reportId: string, format: ReportFormat) => Promise<boolean>;
  generateReport: (
    reportData: Partial<ReportData>
  ) => Promise<ReportData | null>;
}

export const useReports = (teamSlug: string): UseReportsResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);

  // Helper function for API requests with proper headers
  const makeApiRequest = async (url: string, options: RequestInit = {}) => {
    // Ensure headers are included
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      // Include credentials to send cookies with the request (important for auth)
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error (${response.status}): ${response.statusText}`;
      try {
        // Try to parse the error message if it's JSON
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the text as is
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    return response;
  };

  const fetchReports = useCallback(
    async (filter?: string): Promise<void> => {
      if (!teamSlug) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter) {
          params.append('filter', filter);
        }

        const response = await makeApiRequest(
          `/api/teams/${teamSlug}/reports?${params.toString()}`
        );
        const data = await response.json();
        setReports(data.reports || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [teamSlug]
  );

  const downloadReport = useCallback(
    async (reportId: string, format: ReportFormat): Promise<boolean> => {
      if (!teamSlug) return false;

      setError(null);

      try {
        toast.loading('Preparing download...');

        const response = await makeApiRequest(
          `/api/teams/${teamSlug}/reports/${reportId}/download?format=${format}`
        );

        // Get title and date information from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report-${reportId}.${format.toLowerCase()}`;

        if (contentDisposition && contentDisposition.includes('filename=')) {
          filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.dismiss();
        toast.success('Download complete');

        // Return success
        return true;
      } catch (err) {
        toast.dismiss();
        toast.error(err instanceof Error ? err.message : 'Download failed');
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Error downloading report:', err);
        return false;
      }
    },
    [teamSlug]
  );

  const generateReport = useCallback(
    async (reportData: Partial<ReportData>): Promise<ReportData | null> => {
      if (!teamSlug) return null;

      setIsLoading(true);
      setError(null);

      try {
        toast.loading('Generating report...');

        const response = await makeApiRequest(
          `/api/teams/${teamSlug}/reports/generate`,
          {
            method: 'POST',
            body: JSON.stringify(reportData),
          }
        );

        const data = await response.json();

        if (data.report) {
          // Add the new report to the list
          setReports((prevReports) => [...prevReports, data.report]);
          toast.dismiss();
          toast.success('Report generated successfully');
        }

        return data.report;
      } catch (err) {
        toast.dismiss();
        toast.error(
          err instanceof Error ? err.message : 'Failed to generate report'
        );
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Error generating report:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [teamSlug]
  );

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    downloadReport,
    generateReport,
  };
};
