import { Theme } from '@prisma/client';

export interface AnimalCounts {
  date: string;
  count: number;
}

export interface AnimalSummary {
  id: string;
  name: string;
  icon: string;
  activeAnimal: number;
  inactiveAnimal: number;
  totalAnimal: number;
}

export interface ZoneData {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  locationName?: string;
}

export interface DateFilterProps {
  filters: {
    start: Date;
    end: Date;
  };
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  handleSearch: () => void;
  handleQuickDateFilter: (days: number) => void;
  showFilters: boolean;
  theme?: Theme | null;
}

export interface DashboardFiltersProps {
  viewMode: 'chart' | 'table';
  setViewMode: (mode: 'chart' | 'table') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedLocationId: string;
  handleLocationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleRefresh: () => void;
  locations?: { id: string; name: string }[];
  dateFilterProps: DateFilterProps;
  theme?: Theme | null;
}

export interface AnimalCardsSectionProps {
  totalAnimals: number;
  totalActive: number;
  totalInactive: number;
  locationDetails?: { name: string } | null;
  selectedLocationId: string;
  theme?: Theme | null;
}

export interface ChartSectionProps {
  timeSeriesData: TimeSeriesData[];
  viewMode: 'chart' | 'table';
  selectedLocationId: string;
  theme?: Theme | null;
}

export interface ZoneChartSectionProps {
  zoneData: ZoneData[];
  viewMode: 'chart' | 'table';
  theme?: Theme | null;
}
