import React from 'react';
import { format } from 'date-fns';
import { Incident } from './index';

interface IncidentDetailsProps {
  incident: Incident | undefined;
  teamSlug: string;
  onIncidentUpdated: () => void;
}

export const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incident,
  teamSlug,
  onIncidentUpdated,
}) => {
  if (!incident) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Select an incident to view its details
        </p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    // This would be implemented once the actual API endpoint exists
    console.log(`Changing status to: ${newStatus}`);
    // After successful API call
    onIncidentUpdated();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {incident.title}
        </h2>
        <div
          className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
            incident.priority === 'high'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-200'
              : incident.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-200'
          }`}
        >
          {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)} Priority
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
          <div className="flex items-center">
            <p
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                incident.status === 'open'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-200'
                  : incident.status === 'investigating'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-200'
              }`}
            >
              {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
            </p>

            <select
              className="ml-2 text-xs border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Reported</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {format(new Date(incident.dateReported), 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
          <p className="text-sm text-gray-900 dark:text-white">{incident.location}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {incident.assignedTo || 'Unassigned'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
        <p className="mt-1 text-sm text-gray-900 dark:text-white">{incident.description}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions</h3>
        <div className="mt-2 flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Edit Incident
          </button>
          {incident.status !== 'resolved' && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
              onClick={() => handleStatusChange('resolved')}
            >
              Resolve Incident
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
