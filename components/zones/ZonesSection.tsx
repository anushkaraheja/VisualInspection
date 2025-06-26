import React from 'react';
import { ImPencil } from 'react-icons/im';
import { BsThreeDots } from 'react-icons/bs';
import { Table } from '@/components/shared/table/Table';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { MdDeleteOutline } from 'react-icons/md';
import { Zone } from '../../services/zoneService';

interface ZonesSectionProps {
  zones: Zone[];
  groupFieldClass: string;
  onAddZone: () => void;
  onEditZone?: (zone: Partial<Zone>) => void;
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  locationId: string;
  slug: string;
}

const ZonesSection: React.FC<ZonesSectionProps> = ({
  zones,
  groupFieldClass,
  onAddZone,
  onEditZone,
  setZones,
  locationId,
  slug,
}) => {
  const handleDeleteZone = (zoneId: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      setZones(zones.filter((zone) => zone.id !== zoneId));

      // If we have a real location ID (not empty string), we should call the API to delete the zone
      if (locationId) {
        fetch(`/api/teams/${slug}/locations/${locationId}/zones/${zoneId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }
  };

  return (
    <div className={groupFieldClass}>
      <div className="flex justify-between border-b pb-3 items-center">
        <h2 className="font-semibold">Zones</h2>
        <ButtonFromTheme
          outline={true}
          className="py-2 px-10 border rounded-md hover:text-white"
          onClick={onAddZone}
        >
          Add Zone
        </ButtonFromTheme>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No zones have been added yet. Click "Add Zone" to create your first
          zone.
        </div>
      ) : (
        <div className="mt-4">
          <Table
            cols={['Zone Name', 'Description', 'Device Count', 'Actions']}
            body={zones.map((zone) => {
              return {
                id: zone.id,
                cells: [
                  {
                    wrap: true,
                    text: zone.name,
                  },
                  {
                    wrap: true,
                    text: zone.description || '-',
                  },
                  {
                    wrap: true,
                    text: String(zone.devices?.length || 0),
                  },
                  {
                    actions: [
                      {
                        text: 'Edit',
                        icon: (
                          <ImPencil className="text-[#606060] dark:text-textColor" />
                        ),
                        onClick: () => {
                          if (onEditZone) onEditZone(zone);
                        },
                      },
                      {
                        text: 'Delete',
                        icon: (
                          <MdDeleteOutline className="text-[#606060] dark:text-textColor" />
                        ),
                        onClick: () => handleDeleteZone(zone.id),
                      },
                      {
                        text: 'Options',
                        icon: (
                          <BsThreeDots className="text-[#606060] dark:text-textColor" />
                        ),
                        onClick: () => {
                          // Options action
                          console.log('Options clicked for zone:', zone.name);
                        },
                      },
                    ],
                  },
                ],
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

export default ZonesSection;
