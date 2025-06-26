import React, { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  titleColor?: string;
  children: ReactNode;
  className?: string;
  selectedDate?: Date; // Add optional selectedDate parameter
  dynamicDateTitle?: boolean; // Flag to enable/disable dynamic date titles
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  titleColor = 'text-white',
  children,
  className = '',
  selectedDate,
  dynamicDateTitle = false,
}) => {
  // Generate dynamic title based on selected date
  const getDynamicTitle = (): string => {
    if (!selectedDate || !dynamicDateTitle) return title;
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset hours to compare only dates
    const todayDate = new Date(today.setHours(0, 0, 0, 0));
    const yesterdayDate = new Date(yesterday.setHours(0, 0, 0, 0));
    const selectedDateTime = new Date(selectedDate.setHours(0, 0, 0, 0));
    
    // Compare dates
    if (selectedDateTime.getTime() === todayDate.getTime()) {
      return "Today's Overview";
    } else if (selectedDateTime.getTime() === yesterdayDate.getTime()) {
      return "Yesterday's Overview";
    } else {
      // Format date for display
      return selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + " Overview";
    }
  };

  return (
    <section className={className}>
      <div className="mb-3">
        <h2 className={`text-xl font-thin ${titleColor} mb-1 ml-1`}>
          {dynamicDateTitle ? getDynamicTitle() : title}
        </h2>
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
