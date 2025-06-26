import React from 'react';
import { ImPencil } from 'react-icons/im';
import { BsThreeDots, BsCameraVideo } from 'react-icons/bs';
import { Table } from '@/components/shared/table/Table';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { Zone } from '../../services/zoneService';

interface ZoneViewSectionProps {
  zones: Zone[];
  onAddZone: () => void;
  onEditZone: (zone: Zone) => void;
  onZoneClick: (zone: Zone) => void;
  onViewDevices?: (zoneId: string) => void; // Add new prop for viewing devices
  locationId: string;
  teamSlug: string;
}

const ZoneViewSection: React.FC<ZoneViewSectionProps> = ({
  zones,
  onAddZone,
  onEditZone,
  onZoneClick,
  onViewDevices,
  locationId,
  teamSlug,
}) => {
  return (
    <div className="bg-white dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col px-8 py-4 gap-4 pb-10">
      <div className="flex justify-between border-b pb-3 items-center">
        <h2 className="font-semibold text-xl">Zones</h2>
        <ButtonFromTheme
          outline={true}
          className="py-2 px-10 border rounded-md hover:text-white"
          onClick={onAddZone}
        >
          Add Zone
        </ButtonFromTheme>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No zones have been added yet. Click "Add Zone" to create your first
          zone.
        </div>
      ) : (
        <div className="mt-4">
          <Table
            cols={['Zone Name', 'Description', 'Devices', 'Actions']}
            body={zones.map((zone) => {
              return {
                id: zone.id,
                cells: [
                  {
                    wrap: true,
                    element: (
                      <button
                        className="text-blue-600 hover:underline font-medium text-left"
                        onClick={() => onZoneClick(zone)}
                      >
                        {zone.name}
                      </button>
                    ),
                  },
                  {
                    wrap: true,
                    text: zone.description || 'No description provided',
                  },
                  {
                    wrap: true,
                    element: (
                      <span className="flex items-center">
                        <span className="bg-gray-100 dark:bg-surfaceColor px-2 py-1 rounded-full text-xs">
                          {Array.isArray(zone.devices)
                            ? zone.devices.length
                            : 0}{' '}
                          devices
                        </span>
                        <button
                          className="ml-2 text-blue-600 hover:underline text-xs"
                          onClick={() => onZoneClick(zone)}
                        >
                          View
                        </button>
                      </span>
                    ),
                  },
                  {
                    actions: [
                      ...(onViewDevices
                        ? [
                            {
                              text: 'View Devices',
                              icon: (
                                <BsCameraVideo className="text-[#606060] dark:text-textColor" />
                              ),
                              onClick: () => onViewDevices(zone.id),
                            },
                          ]
                        : []),
                      {
                        text: 'Edit',
                        icon: (
                          <ImPencil className="text-[#606060] dark:text-textColor" />
                        ),
                        onClick: () => onEditZone(zone),
                      },
                      {
                        text: 'Options',
                        icon: (
                          <BsThreeDots className="text-[#606060] dark:text-textColor" />
                        ),
                        onClick: () => {
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

export default ZoneViewSection;
