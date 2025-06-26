import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  primaryColor: string;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  primaryColor,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  // Calculate display info
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];

    // Always show first page
    pages.push(
      <button
        key="page-1"
        onClick={() => onPageChange(1)}
        style={
          currentPage === 1 ? { backgroundColor: primaryColor } : undefined
        }
        className={`relative inline-flex items-center justify-center text-sm font-medium ${
          currentPage === 1
            ? 'z-10 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-9 h-9 rounded-full'
            : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2'
        }`}
      >
        1
      </button>
    );

    // Logic for dots and surrounding pages
    if (totalPages > 1) {
      if (currentPage > 3) {
        pages.push(
          <span
            key="dots-1"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400"
          >
            ...
          </span>
        );
      }

      // Current page neighborhood
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
        pages.push(
          <button
            key={`page-${i}`}
            onClick={() => onPageChange(i)}
            style={
              currentPage === i ? { backgroundColor: primaryColor } : undefined
            }
            className={`relative inline-flex items-center justify-center text-sm font-medium ${
              currentPage === i
                ? 'z-10 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-9 h-9 rounded-full'
                : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2'
            }`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(
          <span
            key="dots-2"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400"
          >
            ...
          </span>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(
          <button
            key={`page-${totalPages}`}
            onClick={() => onPageChange(totalPages)}
            style={
              currentPage === totalPages
                ? { backgroundColor: primaryColor }
                : undefined
            }
            className={`relative inline-flex items-center justify-center text-sm font-medium ${
              currentPage === totalPages
                ? 'z-10 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-9 h-9 rounded-full'
                : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2'
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pages;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 mt-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            currentPage === 1
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> cameras
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                currentPage === 1
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {renderPageNumbers()}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                currentPage === totalPages
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;
