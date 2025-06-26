import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

interface AlertsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  primaryColor?: string | null;
}

// Type for page items in the pagination
type PageItem = number | 'ellipsis';

export const AlertsPagination: React.FC<AlertsPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  primaryColor
}) => {
  // Improved page range calculation to handle large number of pages
  const getPageRange = (): PageItem[] => {
    // Maximum number of page buttons to show
    const maxVisibleButtons = 5;
    const ellipsis: PageItem = 'ellipsis';
    
    // If we have fewer pages than the max, show all pages
    if (totalPages <= maxVisibleButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first and last page
    const firstPage = 1;
    const lastPage = totalPages;
    
    // Calculate middle pages
    let middlePages: PageItem[] = [];
    
    // Current page is close to the beginning
    if (currentPage <= 3) {
      middlePages = [2, 3, ellipsis];
    } 
    // Current page is close to the end
    else if (currentPage >= totalPages - 2) {
      middlePages = [ellipsis, totalPages - 2, totalPages - 1];
    } 
    // Current page is in the middle
    else {
      middlePages = [
        ellipsis,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        ellipsis
      ];
    }
    
    // Ensure we don't duplicate pages
    const pageRange: PageItem[] = [firstPage, ...middlePages];
    
    // Only add last page if it's not already included
    if (!pageRange.includes(lastPage)) {
      pageRange.push(lastPage);
    }
    
    // Remove any duplicates
    return pageRange.filter((page, index, arr) => {
      if (index > 0 && page === arr[index - 1]) {
        return false;
      }
      return true;
    });
  };
  
  const pageRange: PageItem[] = getPageRange();

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 mt-4">
      {/* Desktop pagination controls - Mobile view now uses the same layout */}
      <div className="flex-1 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing page{' '}
            <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span> pages
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            {/* Previous page button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                currentPage === 1
                  ? 'cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Previous Page"
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Page numbers with ellipsis */}
            {pageRange.map((page, index) => {
              // If the page item is an ellipsis, render it as a static element
              if (page === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center justify-center w-12 h-10 border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ...
                  </span>
                );
              }
              
              // Otherwise render it as a clickable button
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center justify-center w-12 h-10 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
            
            {/* Next page button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Next Page"
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
