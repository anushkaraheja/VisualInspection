import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NewIncidentButtonProps {
  teamSlug: string;
  onIncidentCreated: () => void;
}

export const NewIncidentButton: React.FC<NewIncidentButtonProps> = ({ 
  teamSlug,
  onIncidentCreated
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateIncident = async () => {
    setIsCreating(true);
    try {
      // This would call an API endpoint to create a new incident
      // For now, just simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful API call
      onIncidentCreated();
      
      // Here you would navigate to the new incident or show a success message
      alert('New incident created! (This is just a placeholder)');
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Failed to create incident');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      type="button"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
      onClick={handleCreateIncident}
      disabled={isCreating}
    >
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
      {isCreating ? 'Creating...' : 'New Incident'}
    </button>
  );
};
