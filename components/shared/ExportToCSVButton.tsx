import React from 'react';
import { useDownloadCSV } from 'hooks/useDownloadCSV';
import { exportToCSV } from '@/lib/exportToCSV';
import { PiExportBold } from 'react-icons/pi';
import ButtonFromTheme from './ButtonFromTheme';

interface ExportToCSVButtonProps {
  filters: any;
}

const ExportToCSVButton: React.FC<ExportToCSVButtonProps> = ({ filters }) => {
  const { downloadCSV, isLoading, error } = useDownloadCSV({ params: filters });

  const handleExport = async () => {
    try {
      await exportToCSV(downloadCSV);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  return (
    /* eslint-disable i18next/no-literal-string */
    <>
      <ButtonFromTheme
        outline={true}
        icon={<PiExportBold />}
        onClick={handleExport}
        iconClassName="text-lg"
        className="btn btn-secondary"
        disabled={isLoading}
      >
        {isLoading ? 'Exporting...' : 'Export to CSV'}
      </ButtonFromTheme>
      {error && (
        <div className="text-red-500">
          Error downloading CSV: {error.message}
        </div>
      )}
    </>
  );
};

export default ExportToCSVButton;
