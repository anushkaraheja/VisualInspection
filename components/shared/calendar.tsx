import React, { useRef, useState, useEffect } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';
import classNames from 'classnames';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  formatDateForDisplay: (date: Date) => string;
  backgroundColor?: string; // Optional prop for background color
  textColor?: string; // New optional prop for text color
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateChange,
  formatDateForDisplay,
  backgroundColor,
  textColor, // Add text color parameter
}) => {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [viewedMonth, setViewedMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleCalendarClick = () => {
    setViewedMonth(new Date(selectedDate));
    setIsDatePickerVisible(!isDatePickerVisible);
  };

  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevMonthDay = new Date(year, month, 1 - i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        isToday: isSameDay(prevMonthDay, new Date()),
        isSelected: isSameDay(prevMonthDay, selectedDate),
      });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: isSameDay(currentDate, new Date()),
        isSelected: isSameDay(currentDate, selectedDate),
      });
    }
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isToday: isSameDay(nextMonthDay, new Date()),
        isSelected: isSameDay(nextMonthDay, selectedDate),
      });
    }
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const prevMonth = () => {
    setViewedMonth(
      new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setViewedMonth(
      new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    if (onDateChange) {
      onDateChange(date);
    }
    setIsDatePickerVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const calendarDays = generateCalendarDays(viewedMonth);
  const monthYearDisplay = viewedMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Apply background color using classNames if provided
  const calendarButtonClasses = classNames(
    "relative cursor-pointer flex gap-2 items-center justify-center p-2.5 rounded-full mr-3",
    {
      "bg-gray-500/20": !backgroundColor, // Default background
      [`bg-${backgroundColor}`]: backgroundColor && !backgroundColor.startsWith('#'), // For Tailwind classes
    }
  );

  // Apply text color using classNames if provided
  const textClasses = classNames("text-sm cursor-pointer", {
    "text-white": !textColor, // Default text color
    [`text-${textColor}`]: textColor && !textColor.startsWith('#'), // For Tailwind classes
  });

  const iconClasses = classNames("h-5 w-[1.25rem]", {
    "text-white": !textColor, // Default icon color
    [`text-${textColor}`]: textColor && !textColor.startsWith('#'), // For Tailwind classes
  });

  const chevronClasses = classNames("h-4 w-4 ml-1", {
    "text-white": !textColor, // Default chevron color
    [`text-${textColor}`]: textColor && !textColor.startsWith('#'), // For Tailwind classes
  });

  // Prepare inline styles for hex colors
  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor?.startsWith('#')) {
    inlineStyle.backgroundColor = backgroundColor;
  }
  if (textColor?.startsWith('#')) {
    inlineStyle.color = textColor;
  }

  return (
    <div className="relative flex items-center">
      <div
        className={calendarButtonClasses}
        onClick={handleCalendarClick}
        style={inlineStyle}
      >
        <FiCalendar className={iconClasses} />
        <span className={textClasses}>
          {formatDateForDisplay(selectedDate)}
        </span>
        <FiChevronDown className={chevronClasses} />
      </div>

      {isDatePickerVisible && (
        <div
          ref={datePickerRef}
          className="absolute top-12 right-0 z-50 bg-white dark:bg-surfaceColor rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-[16rem] py-2"
          style={{ maxHeight: '400px' }}
        >
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={prevMonth}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              <svg
                className="h-5 w-[1.25rem]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              {monthYearDisplay}
            </h2>
            <button
              onClick={nextMonth}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              <svg
                className="h-5 w-[1.25rem]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0 text-center my-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 text-center">
            {calendarDays.map((day: CalendarDay, index: number) => (
              <div
                key={index}
                onClick={() => handleDateSelect(day.date)}
                className={`
                  cursor-pointer text-sm py-2 leading-none
                  ${day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                  ${day.isSelected ? 'bg-primary text-white rounded-full' : ''}
                  ${day.isToday && !day.isSelected ? 'border border-primary rounded-full' : ''}
                  hover:bg-gray-100 dark:hover:bg-gray-800
                `}
                style={{
                  width: '30px',
                  height: '30px',
                  margin: '2px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {day.date.getDate()}
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 px-4">
            <button
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
                setViewedMonth(today);
              }}
              className="w-full py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
