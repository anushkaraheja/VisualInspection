import React, { useState } from 'react';
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaThumbsUp,
  FaThumbsDown,
} from 'react-icons/fa';
import { FiMapPin, FiUser, FiClock, FiEye } from 'react-icons/fi';

interface RealtimeAlertTileProps {
  alert: {
    id: number;
    type: string;
    message?: string;
    location: string;
    user: string;
    time: string;
    severity: 'low' | 'medium' | 'high';
    resolved?: boolean;
  };
  onResolve: (id: number) => void;
}

const RealtimeAlertTile: React.FC<RealtimeAlertTileProps> = ({
  alert,
  onResolve,
}) => {
  const [feedback, setFeedback] = useState<'none' | 'positive' | 'negative'>(
    'none'
  );
  const [isResolveDisabled, setIsResolveDisabled] = useState(false);

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Toggle feedback if clicking the same button again
    if (feedback === type) {
      setFeedback('none');
      // Re-enable resolve button if clearing negative feedback
      if (type === 'negative') {
        setIsResolveDisabled(false);
      }
    } else {
      setFeedback(type);
      // Disable resolve button only when selecting negative feedback
      setIsResolveDisabled(type === 'negative');
    }
  };

  const handleResolve = () => {
    if (!isResolveDisabled) {
      onResolve(alert.id);
    }
  };

  // Determine border color based on feedback
  const getBorderColor = () => {
    if (feedback === 'positive') {
      return 'border-green-500 dark:border-green-600';
    } else if (feedback === 'negative') {
      return 'border-red-500 dark:border-red-600';
    }
    return 'border-[#D5D5D5] dark:border-borderColor';
  };

  return (
    <li className="p-2">
      <div
        className={`border ${getBorderColor()} rounded-lg bg-[#FBFBFB] dark:bg-backgroundColor h-auto min-h-[118px] relative overflow-visible`}
      >
        <div className="flex items-start p-3 h-full">
          {/* Left side icon - optimized size */}
          <div className="mr-3 flex-shrink-0">
            <div
              className={`h-10 w-10 rounded-full ${alert.resolved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center`}
            >
              {alert.resolved ? (
                <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <FaExclamationTriangle
                  className={`h-5 w-5 
                  ${
                    alert.severity === 'high'
                      ? 'text-red-500 dark:text-red-400'
                      : alert.severity === 'medium'
                        ? 'text-orange-500 dark:text-orange-400'
                        : 'text-yellow-500 dark:text-yellow-400'
                  }`}
                />
              )}
            </div>
          </div>

          {/* Middle section with heading row and details */}
          <div className="flex-grow min-w-0">
            {/* Title row with horizontally aligned heading and resolve flag/button */}
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="font-medium text-lg leading-tight font-['Poppins'] text-gray-900 dark:text-textColor truncate">
                {alert.type}
              </h4>

              {/* Status indicators or resolve button */}
              {alert.resolved ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2FCD00] dark:bg-[#2FCD00]/80 text-white dark:text-white ml-2">
                  Resolved
                </span>
              ) : (
                <button
                  onClick={handleResolve}
                  disabled={isResolveDisabled}
                  className={`inline-flex items-center px-2 py-0.5 border border-gray-300 dark:border-borderColor text-xs leading-4 font-medium rounded-md ${
                    isResolveDisabled
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-700 dark:text-textColor bg-white dark:bg-surfaceColor hover:bg-gray-50 dark:hover:bg-hoverColor'
                  } focus:outline-none ml-2 transition-colors duration-200`}
                >
                  <svg
                    className={`mr-0.5 h-2.5 w-2.5 ${isResolveDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-green-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Resolve
                </button>
              )}
            </div>

            {/* Details section */}
            <div className="space-y-0.5 flex flex-col gap-1">
              <div className="flex items-center text-xs text-gray-600 dark:text-textColor">
                <FiMapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400 mr-1.5" />
                <span className="truncate">{alert.location}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-textColor">
                <FiUser className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400 mr-1.5" />
                <span className="truncate">{alert.user}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-textColor">
                <div className="flex items-center">
                  <FiClock className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="truncate">{alert.time}</span>
                </div>

                {/* Action buttons row - visible only for unresolved alerts */}
                {!alert.resolved && (
                  <div className="flex space-x-2 items-center">
                    <a
                      href="#view"
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      aria-label="View details"
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleFeedback('positive')}
                      className={`p-1 transition-colors duration-200 ${
                        feedback === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      aria-label={
                        feedback === 'positive'
                          ? 'Remove thumbs up'
                          : 'Thumbs up'
                      }
                      title={
                        feedback === 'positive'
                          ? 'Remove thumbs up'
                          : 'Thumbs up'
                      }
                    >
                      <FaThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback('negative')}
                      className={`p-1 transition-colors duration-200 ${
                        feedback === 'negative'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      aria-label={
                        feedback === 'negative'
                          ? 'Remove thumbs down'
                          : 'Thumbs down'
                      }
                      title={
                        feedback === 'negative'
                          ? 'Remove thumbs down'
                          : 'Thumbs down'
                      }
                    >
                      <FaThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default RealtimeAlertTile;
