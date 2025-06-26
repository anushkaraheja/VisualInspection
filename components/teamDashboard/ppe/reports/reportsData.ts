export interface Report {
  id: string;
  title: string;
  frequency: string;
  generatedOn: string;
  pages: number;
  formats: string[];
}

// Sample data for saved reports
export const savedReports: Report[] = [
  {
    id: '1',
    title: 'Daily Compliance Summary',
    frequency: 'Daily',
    generatedOn: 'April 2, 2025',
    pages: 5,
    formats: ['pdf', 'excel', 'csv'],
  },
  {
    id: '2',
    title: 'Weekly Compliance Summary',
    frequency: 'Weekly',
    generatedOn: 'April 1, 2025',
    pages: 12,
    formats: ['pdf', 'excel', 'csv'],
  },
  {
    id: '3',
    title: 'Zone A Detailed Analysis',
    frequency: 'Custom',
    generatedOn: 'March 28, 2025',
    pages: 8,
    formats: ['pdf', 'excel'],
  },
  {
    id: '4',
    title: 'Violation Trends Report',
    frequency: 'Weekly',
    generatedOn: 'March 25, 2025',
    pages: 5,
    formats: ['pdf', 'csv'],
  },
  {
    id: '5',
    title: 'Repeat Offenders Analysis',
    frequency: 'Monthly',
    generatedOn: 'March 20, 2025',
    pages: 7,
    formats: ['pdf', 'excel', 'csv'],
  },
  {
    id: '6',
    title: 'Monthly Compliance Summary',
    frequency: 'Monthly',
    generatedOn: 'March 15, 2025',
    pages: 10,
    formats: ['pdf', 'csv'],
  },
];

// Get reports data based on filter criteria (to be expanded)
export const getReportData = (filter?: string): Report[] => {
  // Here you could add filtering logic based on the provided filter
  return savedReports;
};
