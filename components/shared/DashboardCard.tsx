import React, { ReactNode } from 'react';
import { IconType } from 'react-icons';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: IconType | ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  showDot?: boolean;
  dotColor?: string;
  headingColor?: string;
  valueColor?: string;
  valueSuffix?: ReactNode | string;
  showProgressBar?: boolean;
  progressPercentage?: number;
  progressBarColor?: string;
  height?: string;
  additionalClasses?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-[#EAEAEA] dark:bg-gray-600',
  iconColor = 'text-gray-600 dark:text-gray-400',
  showDot = false,
  dotColor = '',
  headingColor = 'text-gray-800 dark:text-textColor',
  valueColor = 'text-gray-800 dark:text-gray-200',
  valueSuffix,
  showProgressBar = false,
  progressPercentage = 0,
  progressBarColor = '',
  height = 'h-[84px]',
  additionalClasses = '',
}) => {
  // Handle both IconType components and pre-rendered ReactNodes
  const IconElement =
    typeof icon === 'function'
      ? React.createElement(icon as IconType, {
          className: `h-5 w-5 ${iconColor}`,
        })
      : icon;

  return (
    <div
      className={`relative bg-white dark:bg-surfaceColor rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full flex flex-col ${height} ${additionalClasses}`}
    >
      <div className="p-3 flex flex-col h-full">
        <div className="flex flex-grow">
          <div className="flex-shrink-0 mr-3">
            <div
              className={`rounded-full flex items-center justify-center h-12 w-12 ${iconBgColor}`}
            >
              {IconElement}
            </div>
          </div>

          <div className="flex-1">
            <h3
              className={`text-xs font-medium ${headingColor} flex items-center`}
            >
              {showDot && (
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5`}
                ></span>
              )}
              {title}
            </h3>

            <div className="flex items-baseline">
              <span className={`text-2xl font-medium ${valueColor}`}>
                {value}
              </span>
              {valueSuffix && (
                <span className="text-xs text-gray-500 font-medium ml-1">
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>
        </div>

        {showProgressBar && (
          <div className="w-full mt-auto">
            <div className="flex justify-end mb-0.5">
              <span className="text-sm font-thin text-gray-900 dark:text-textColor">
                {typeof progressPercentage === 'number'
                  ? Math.round(progressPercentage)
                  : progressPercentage}
                %
              </span>
            </div>

            <div className="bg-gray-200 dark:bg-gray-700 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-1.5 transition-all duration-500 ease-in-out"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: progressBarColor || 'currentColor',
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
