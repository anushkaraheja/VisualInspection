import React from 'react';
import { format } from 'date-fns';
import { Incident } from './index';

interface IncidentsListProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  isLoading: boolean;
  error: any;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading incidents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading incidents: {error.message}</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">No incidents found.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {incidents.map((incident) => (
        <li
          key={incident.id}
          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
            selectedIncidentId === incident.id
              ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
              : ''
          }`}
          onClick={() => onSelectIncident(incident.id)}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {incident.title}
            </p>
            <div className={`ml-2 flex-shrink-0 flex`}>
              <p
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  incident.status === 'open'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-200'
                    : incident.status === 'investigating'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-200'
                }`}
              >
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </p>
            </div>
          </div>
          <div className="mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(incident.dateReported), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {incident.location}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
