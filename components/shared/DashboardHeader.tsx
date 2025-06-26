import React from 'react';
import Calendar from './calendar';

interface DashboardHeaderProps {
  title: string;
  primaryColor: string;
  showDatePicker?: boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  formattedDate?: string;
  currentTime?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  primaryColor,
  showDatePicker = false,
  selectedDate = new Date(),
  onDateChange,
  formattedDate,
  currentTime,
}) => {
  const formatDateForDisplay = (date: Date) => {
    return (
      formattedDate ||
      date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  };

  return (
    <div
      className="w-full py-4 px-4"
      style={{
        backgroundColor: primaryColor,
        height: '180px',
      }}
    >
      <div className="mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
          </div>

          <div className="flex items-center">
            {showDatePicker ? (
              <Calendar
                selectedDate={selectedDate}
                onDateChange={onDateChange || (() => {})}
                formatDateForDisplay={formatDateForDisplay}
              />
            ) : (
              currentTime && (
                <div className="text-white font-medium">
                  Today {formattedDate}, {currentTime}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
