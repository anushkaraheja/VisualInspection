import React from 'react';
import { FiShield } from 'react-icons/fi';
import {
  FaHand,
  FaHelmetSafety,
  FaShirt,
  FaGlasses,
  FaBootstrap,
  FaHeadSideMask,
  FaEarListen,
} from 'react-icons/fa6';
import { MdSafetyDivider } from 'react-icons/md';
import DashboardCard from './DashboardCard';
import DashboardSection from '../shared/DashboardSection';
import { useComplianceTotalCount } from 'hooks/useComplianceData';
import { useRouter } from 'next/router';

// Define compliance data interface - updated to support dynamic PPE items
export interface ComplianceData {
  overall: number;
  ppeCompliance: Record<string, number>;
  activePpeItems: string[];
}

interface ComplianceOverviewProps {
  complianceData: ComplianceData | undefined;
  isLoading: boolean;
  primaryColor: string;
  teamSlug?: string; // Add optional team slug parameter
  selectedDate: Date; // Add selected date prop
}

// Define the card type interface to fix TypeScript errors
interface ComplianceCard {
  title: string;
  percentage: number;
  count: number;
  icon: React.ReactNode;
  showTotal?: boolean;
  trend: string;
}

const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  complianceData,
  isLoading,
  primaryColor,
  teamSlug: propTeamSlug,
  selectedDate,
}) => {
  // Get team slug from props or router
  const router = useRouter();
  const routeTeamSlug = router.query.slug as string;
  const teamSlug = propTeamSlug || routeTeamSlug;

  // Use the hook to fetch total compliances count with selected date
  const { data: complianceCountData, isLoading: countLoading } =
    useComplianceTotalCount(teamSlug, selectedDate);

  // Get the total compliances count from the API or use fallback
  const totalCompliances = complianceCountData?.count || 0;

  // Check if we have no compliance data for the selected date
  const hasNoDataForDate =
    !isLoading &&
    complianceData &&
    complianceData.overall === 0 &&
    totalCompliances === 0;

  const getIcon = (ppeType: string) => {
    switch (ppeType.toLowerCase()) {
      case 'overall compliance':
        return (
          <FiShield className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      case 'hard hat':
        return (
          <FaHelmetSafety className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      case 'vest':
        return <FaShirt className="h-6 w-6 text-gray-600 dark:text-gray-400" />;
      case 'gloves':
        return <FaHand className="h-6 w-6 text-gray-600 dark:text-gray-400" />;
      case 'safety glasses':
        return (
          <FaGlasses className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      case 'steel toe boots':
      case 'steel-toe boots':
        return (
          <FaBootstrap className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      case 'respiratory mask':
        return (
          <FaHeadSideMask className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      case 'ear protection':
        return (
          <FaEarListen className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
      default:
        return (
          <MdSafetyDivider className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  // Prepare compliance cards configuration - dynamically based on all active PPE items
  const getComplianceCards = (): ComplianceCard[] => {
    if (!complianceData || !complianceData.ppeCompliance) return [];

    // Check if we have no data (total count is 0)
    const noData = totalCompliances === 0;

    // Start with the overall compliance
    const cards: ComplianceCard[] = [
      {
        title: 'Overall Compliance',
        percentage: noData ? 0 : Number((complianceData.overall || 0).toFixed(1)),
        count: noData ? 0 : Math.round(((complianceData.overall || 0) / 100) * totalCompliances),
        icon: getIcon('Overall Compliance'),
        showTotal: true,
        trend: 'up',
      },
    ];

    // Add cards for each active PPE item
    if (complianceData.activePpeItems && complianceData.ppeCompliance) {
      complianceData.activePpeItems.forEach((ppeItem) => {
        const percentage = noData ? 0 : (complianceData.ppeCompliance[ppeItem] || 0);

        cards.push({
          title: `${ppeItem} Compliance`,
          percentage: noData ? 0 : Number(percentage.toFixed(1)),
          count: noData ? 0 : Math.round((percentage / 100) * totalCompliances),
          icon: getIcon(ppeItem),
          showTotal: false,
          trend: percentage > 90 ? 'up' : percentage > 75 ? 'stable' : 'down',
        });
      });
    }

    // Return all cards - no limit
    return cards;
  };

  // Get the number of cards to determine grid layout
  const getCardCount = (): number => {
    if (!complianceData || !complianceData.activePpeItems) return 4; // Default for skeleton loading
    return 1 + (complianceData.activePpeItems?.length || 0);
  };

  // Calculate the best grid columns to distribute cards evenly
  const calculateGridCols = (): string => {
    const cardCount = getCardCount();

    // For fewer cards, use their exact count
    if (cardCount <= 4) {
      return `repeat(${cardCount}, 1fr)`;
    }

    // Find the most appropriate grid layout for the cards
    // Try to find a divisor that will create a balanced grid
    if (cardCount % 4 === 0) return 'repeat(4, 1fr)';
    if (cardCount % 3 === 0) return 'repeat(3, 1fr)';
    if (cardCount % 5 === 0) return 'repeat(5, 1fr)';
    if (cardCount % 2 === 0) return 'repeat(4, 1fr)'; // Even numbers work well in 4 columns

    // For prime numbers or other counts, use a layout that covers the full width
    if (cardCount <= 5) return 'repeat(5, 1fr)';
    if (cardCount <= 6) return 'repeat(6, 1fr)';
    if (cardCount <= 8) return 'repeat(4, 1fr)'; // 7 or 8 items in 4 columns
    if (cardCount <= 10) return 'repeat(5, 1fr)'; // 9 or 10 items in 5 columns

    return 'repeat(6, 1fr)'; // For larger counts, use 6 columns
  };

  // Combined loading state
  const isComponentLoading = isLoading || countLoading;

  // Get placeholder card count for loading state
  const getLoadingPlaceholderCount = (): number => {
    // If we have data but it's refreshing, use the actual card count
    if (complianceData && complianceData.activePpeItems) {
      return 1 + complianceData.activePpeItems.length;
    }
    
    // Default to 4 placeholder cards when no data is available yet
    return 4;
  };

  return (
    <DashboardSection 
      title="Overview" 
      selectedDate={selectedDate} 
      dynamicDateTitle={true}
    >
      {hasNoDataForDate && !isComponentLoading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                No data available
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  No compliance data found for{' '}
                  {selectedDate.toLocaleDateString()}. Try selecting a
                  different date or check if cameras are properly configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        className="grid gap-2 mb-3 relative z-10"
        style={{
          gridTemplateColumns: calculateGridCols(),
          width: '100%', // Ensure the grid takes full width
        }}
      >
        {isComponentLoading
          ? // Skeleton loading state - show placeholders that match the layout
            Array.from({ length: getLoadingPlaceholderCount() }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-surfaceColor rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-[84px] animate-pulse"
              >
                <div className="flex p-3 items-center">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="ml-3 space-y-2 w-full">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            ))
          : complianceData &&
            getComplianceCards().map((card, index) => (
              <DashboardCard
                key={index}
                title={card.title}
                value={card.count || 0}
                icon={card.icon}
                iconBgColor={`bg-${primaryColor}/10`}
                iconColor="text-gray-600 dark:text-gray-400"
                valueSuffix={
                  card.showTotal ? (
                    <span className="whitespace-nowrap">
                      {' '}
                      / {totalCompliances || 'N/A'}
                    </span>
                  ) : null
                }
                showProgressBar={true}
                progressPercentage={card.percentage || 0}
                progressBarColor={primaryColor}
                height="h-auto"
              />
            ))}
      </div>
    </DashboardSection>
  );
};

export default ComplianceOverview;
