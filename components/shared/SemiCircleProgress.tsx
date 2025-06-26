import { useTranslation } from 'next-i18next';

interface SemiCircleProgressProps {
  percentage: number;
  color: string;
  size?: number;
  usedCount?: number;
  totalCount?: number;
}

export const SemiCircleProgress = ({
  percentage,
  color,
  size = 150,
  usedCount = 0,
  totalCount = 0,
}: SemiCircleProgressProps) => {
  const radius = size / 2;
  const strokeWidth = size / 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const { t } = useTranslation('common');

  const centerY = radius * 0.6;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={radius * 2}
        height={radius}
        viewBox={`0 0 ${radius * 2} ${radius}`}
      >
        <path
          d={`M${strokeWidth / 2},${radius} a${normalizedRadius},${normalizedRadius} 0 1,1 ${radius * 2 - strokeWidth},0`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        <path
          d={`M${strokeWidth / 2},${radius} a${normalizedRadius},${normalizedRadius} 0 1,1 ${radius * 2 - strokeWidth},0`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />

        {/* Usage count in the center */}
        <text
          x={radius}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-3xl font-bold fill-current dark:text-textColor"
        >
          {usedCount}
        </text>
      </svg>

      {/* Description below the semicircle */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {t('Licenses Assigned')}
      </div>
    </div>
  );
};

export default SemiCircleProgress;
