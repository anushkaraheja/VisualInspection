import React, { useState } from 'react';
import ComplianceReports from './ComplianceReports';
import ButtonFromTheme from '../../../shared/ButtonFromTheme';

export const Reports: React.FC = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden mb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl leading-tight font-semibold text-gray-900 dark:text-textColor p-4 border-gray-200 dark:border-gray-700">
          Reports Dashboard
        </h2>
        <div className="p-0">
          <ComplianceReports />
        </div>
      </div>
    </div>
  );
};

export default Reports;
