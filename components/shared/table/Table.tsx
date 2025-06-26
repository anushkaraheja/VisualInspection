import { TableHeader } from './TableHeader';
import { TableBody, TableBodyType } from './TableBody';
import { useState, ReactNode } from 'react';
import ButtonFromTheme from '../ButtonFromTheme';

const tableWrapperClass =
  'relative overflow-x-auto scrollbar bg-white rounded-[20px] bg-white border border-[#EFEFF4] dark:border-borderColor opacity-100';
const tableClass = 'w-full text-left text-sm text-gray-500 dark:text-textColor';

export const Table = ({
  heading,
  cols,
  body,
  noMoreResults,
  onPageChange,
  totalPages,
  currentPage: externalCurrentPage, // Accept current page from parent
  showDropdown = true,
  customDropdown = null,
}: {
  heading?: string | ReactNode;
  cols: string[];
  body: TableBodyType[];
  noMoreResults?: boolean;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  currentPage?: number; // New prop to control pagination from outside
  showDropdown?: boolean;
  customDropdown?: ReactNode;
}) => {
  // Use external current page if provided, otherwise manage internally
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;

  const handlePageChange = (newPage: number) => {
    // Only update internal state if we're not controlled externally
    if (externalCurrentPage === undefined) {
      setInternalCurrentPage(newPage);
    }
    
    // Call the parent's onPageChange handler
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    /* eslint-disable i18next/no-literal-string */
    <div
      className={tableWrapperClass}
      role="region"
      aria-label="Data Table"
      tabIndex={0}
    >
      {heading && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:bg-backgroundColor dark:border-borderColor">
          <div className="mb-2 sm:mb-0 text-center sm:text-left">
            {typeof heading === 'string' ? (
              <h2 className="text-md font-normal">{heading}</h2>
            ) : (
              heading
            )}
          </div>

          {/* Render custom dropdown if provided */}
          {customDropdown && <div>{customDropdown}</div>}

          {/* Render default dropdown if showDropdown is true and no custom dropdown */}
          {showDropdown && !customDropdown && (
            <div className="relative w-full sm:w-32">
              <select className="bg-[#F9F9F9] dark:bg-surfaceColor border border-[#EFEFF4] dark:border-borderColor rounded-lg w-full opacity-100 block appearance-none px-4 py-2 pr-8 leading-tight focus:outline-none focus:shadow-none">
                <option value="">All</option>
                <option value="">Some</option>
                {/* Add options here */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-textColor">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <table className={tableClass}>
          <TableHeader cols={cols} />
          <TableBody cols={cols} body={body} noMoreResults={noMoreResults} />
        </table>
      </div>
      {onPageChange && totalPages && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t dark:border-borderColor">
          <ButtonFromTheme
            className="btn btn-primary mb-2 sm:mb-0 w-full sm:w-auto"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </ButtonFromTheme>
          <span className="text-center mb-2 sm:mb-0 dark:text-textColor">
            Page {currentPage} of {totalPages}
          </span>
          <ButtonFromTheme
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </ButtonFromTheme>
        </div>
      )}
    </div>
    /* eslint-disable i18next/no-literal-string */
  );
};
