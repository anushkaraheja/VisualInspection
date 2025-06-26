import React, { useState } from 'react';
import { IncidentsList } from './IncidentsList';
import { IncidentDetails } from './IncidentDetails';
import { NewIncidentButton } from './NewIncidentButton';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { WithLoadingAndError } from '../shared';

// Mock incident type since there's no real incident endpoint yet
export interface Incident {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  dateReported: string;
  description: string;
  location: string;
  assignedTo?: string;
}

export const IncidentsComponent: React.FC = () => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // This should be replaced with a real API endpoint when available
  // For now we're returning mock data
  const { data, error, isLoading, mutate } = useSWR<{ data: Incident[] }>(
    teamSlug ? `/api/teams/${teamSlug}/incidents` : null,
    async (url: string) => {
      // Mock response for incidents
      return {
        data: [
          {
            id: '1',
            title: 'Missing Hard Hat in Zone A',
            status: 'open' as const,
            priority: 'high' as const,
            dateReported: new Date().toISOString(),
            description: 'Worker detected without hard hat in high risk area',
            location: 'Warehouse / Zone A',
          },
          {
            id: '2',
            title: 'Multiple Safety Violations in Processing Area',
            status: 'investigating' as const,
            priority: 'medium' as const,
            dateReported: new Date(Date.now() - 86400000).toISOString(),
            description: 'Multiple workers found without proper PPE during shift change',
            location: 'Processing / Zone C',
            assignedTo: 'John Doe',
          },
          {
            id: '3',
            title: 'Damaged Safety Equipment',
            status: 'resolved' as const,
            priority: 'low' as const,
            dateReported: new Date(Date.now() - 172800000).toISOString(),
            description: 'Safety harnesses found to be damaged in storage area',
            location: 'Equipment Room / Zone B',
            assignedTo: 'Jane Smith',
          },
        ],
      };
    }
  );
  
  const incidents = data?.data || [];
  const selectedIncident = incidents.find(inc => inc.id === selectedIncidentId);

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Incident Investigation
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Investigate and track safety incidents across your facilities
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <NewIncidentButton teamSlug={teamSlug} onIncidentCreated={() => mutate()} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Incidents list */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <IncidentsList 
              incidents={incidents} 
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Right column: Selected incident details */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow sm:rounded-md">
            <IncidentDetails 
              incident={selectedIncident} 
              teamSlug={teamSlug}
              onIncidentUpdated={() => mutate()}
            />
          </div>
        </div>
      </div>
    </WithLoadingAndError>
  );
};
