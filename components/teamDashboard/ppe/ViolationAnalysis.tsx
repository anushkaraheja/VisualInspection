import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  FaHelmetSafety,
  FaShirt,
  FaHand,
  FaHeadSideMask,
  FaEarListen,
  FaBootstrap,
  FaGlasses,
} from 'react-icons/fa6';
import { useTrends, TrendDataPoint } from 'hooks/useTrends';
import { Loading } from '../../shared';

// PPE item icon mapping
const PPE_ICONS: Record<string, React.ReactNode> = {
  'hard hat': <FaHelmetSafety className="h-3.5 w-3.5" />,
  vest: <FaShirt className="h-3.5 w-3.5" />,
  gloves: <FaHand className="h-3.5 w-3.5" />,
  'respiratory mask': <FaHeadSideMask className="h-3.5 w-3.5" />,
  'ear protection': <FaEarListen className="h-3.5 w-3.5" />,
  'steel-toe boots': <FaBootstrap className="h-3.5 w-3.5" />,
  'safety glasses': <FaGlasses className="h-3.5 w-3.5" />,
};

// PPE item color mapping
const PPE_COLORS: Record<string, { bg: string; text: string }> = {
  'hard hat': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  vest: { bg: 'bg-[#71D2F6]', text: 'text-[#2563EB]' },
  gloves: { bg: 'bg-pink-100', text: 'text-pink-600' },
  'respiratory mask': { bg: 'bg-green-100', text: 'text-green-600' },
  'ear protection': { bg: 'bg-purple-100', text: 'text-purple-600' },
  'steel-toe boots': { bg: 'bg-orange-100', text: 'text-orange-600' },
  'safety glasses': { bg: 'bg-blue-100', text: 'text-blue-600' },
};

// Line color mapping
const LINE_COLORS: Record<string, string> = {
  'hard hat': '#EAB308',
  vest: '#2563EB',
  gloves: '#EC4899',
  'respiratory mask': '#10B981',
  'ear protection': '#8B5CF6',
  'steel-toe boots': '#F97316',
  'safety glasses': '#3B82F6',
};

interface ViolationAnalysisProps {
  teamSlug?: string;
}

const ViolationAnalysis: React.FC<ViolationAnalysisProps> = ({ teamSlug }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(
    'week'
  );
  // Initialize with empty object for visible indicators
  const [visibleIndicators, setVisibleIndicators] = useState<
    Record<string, boolean>
  >({});

  // Get data from API
  const { data: trendData, isLoading } = useTrends(teamSlug, selectedPeriod);

  // Extract available PPE items from trend data
  const availablePPEItems = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];

    // Get all keys from the first data point, excluding 'week' and 'date'
    const firstDataPoint = trendData[0];
    return Object.keys(firstDataPoint).filter(
      (key) => key !== 'week' && key !== 'date'
    );
  }, [trendData]);

  // Initialize visible indicators when PPE items are determined
  useEffect(() => {
    if (availablePPEItems.length > 0) {
      const initialVisibleState: Record<string, boolean> = {};
      availablePPEItems.forEach((item) => {
        initialVisibleState[item] = true;
      });
      setVisibleIndicators(initialVisibleState);
    }
  }, [availablePPEItems]);

  // Toggle indicator visibility
  const toggleIndicator = (indicator: string) => {
    setVisibleIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Custom tooltip component for multiple data points
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={`incident-${index}`}
              style={{ color: entry.color }}
              className="text-sm"
            >
              {`${entry.name}: ${entry.value} incidents`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surfaceColor shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="w-full bg-white dark:bg-surfaceColor rounded-md">
          <div className="mb-6 flex items-center justify-between px-4">
            <div className="text-lg font-medium text-gray-700 dark:text-textColor">
              No. of incidents
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {availablePPEItems.map((item) => {
                const colorConfig = PPE_COLORS[item] || {
                  bg: 'bg-gray-100',
                  text: 'text-gray-600',
                };
                const icon = PPE_ICONS[item] || (
                  <FaHelmetSafety className="h-3.5 w-3.5" />
                );
                return (
                  <div
                    key={item}
                    className={`${visibleIndicators[item] ? 'bg-white' : 'bg-gray-100'} border border-gray-300 rounded-full flex gap-2 py-1.5 px-3 items-center shadow-sm cursor-pointer transition-colors`}
                    onClick={() => toggleIndicator(item)}
                  >
                    <div
                      className={`${visibleIndicators[item] ? colorConfig.bg + ' ' + colorConfig.text : 'bg-gray-200 text-gray-500'} rounded-full p-1.5 transition-colors`}
                    >
                      {icon}
                    </div>
                    <span
                      className={`text-sm ${visibleIndicators[item] ? 'text-gray-600' : 'text-gray-400'} dark:text-gray-400 transition-colors capitalize`}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <Loading/>
          ) : (
            <div className="h-64 px-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                >
                  <CartesianGrid horizontal={false} stroke="#E0E7FF" />
                  <XAxis
                    dataKey="week"
                    stroke="#000"
                    tick={{ fill: '#000', fontSize: 10 }}
                    tickLine={{ stroke: '#9CA3AF' }}
                    axisLine={{ stroke: '#4B5563' }}
                    padding={{ left: 50, right: 50 }}
                    scale="point"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    stroke="#000"
                    tick={{ fill: '#000', fontSize: 10 }}
                    tickLine={{ stroke: '#9CA3AF' }}
                    axisLine={{ stroke: '#4B5563' }}
                    padding={{ bottom: 0 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {availablePPEItems.map((item, index) => {
                    const lineColor = LINE_COLORS[item] || '#000000';

                    // Only render line if the indicator is visible
                    return visibleIndicators[item] ? (
                      <Line
                        key={item}
                        type="monotone"
                        dataKey={item}
                        name={item.charAt(0).toUpperCase() + item.slice(1)} // Capitalize first letter
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={{ r: 3, fill: lineColor }}
                        activeDot={{ r: 4, fill: lineColor }}
                        isAnimationActive={isVisible}
                        animationDuration={1500}
                        animationBegin={index * 300}
                      />
                    ) : null;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationAnalysis;
