import React from 'react';

const ShimmerCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-surfaceColor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Camera image area shimmer */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 shimmer-effect"></div>
      </div>

      {/* Content area shimmer */}
      <div className="p-5 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          {/* Title shimmer */}
          <div className="h-5 w-4/5 bg-gray-200 dark:bg-gray-700 rounded shimmer-effect"></div>

          {/* Subtitle shimmer */}
          <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-700 rounded shimmer-effect mt-1"></div>
        </div>
      </div>
    </div>
  );
};

export default ShimmerCard;
