import React from 'react';
import {
  BsCameraVideoFill,
  BsLockFill,
  BsPeopleFill,
  BsServer,
  BsLightningChargeFill,
} from 'react-icons/bs';
import { IconType } from 'react-icons';
import { useSystemStatus } from 'hooks/useSystemStatus';

interface IntegrationItem {
  title: string;
  description: string;
  status: 'connected' | 'optimal';
  icon: IconType;
}

interface SystemIntegrationsCardProps {
  teamSlug?: string;
}

const SystemIntegrationsCard: React.FC<SystemIntegrationsCardProps> = ({
  teamSlug,
}) => {
  // Call the hook to log data, but don't use it for UI yet
  const { data, error } = useSystemStatus(teamSlug);

  // Static data for UI display
  const integrations: IntegrationItem[] = [
    {
      title: 'IP Cameras & Devices',
      description: '12 cameras online, 0.4s avg. latency',
      status: 'connected',
      icon: BsCameraVideoFill,
    },
    {
      title: 'Access Control System',
      description: 'Enforcing PPE compliance at 4 entry points',
      status: 'connected',
      icon: BsLockFill,
    },
    {
      title: 'Workforce Management',
      description: 'Tracking 87 workers across all zones',
      status: 'connected',
      icon: BsPeopleFill,
    },
    {
      title: 'Central Database',
      description: 'Last sync : 2 minutes ago',
      status: 'connected',
      icon: BsServer,
    },
    {
      title: 'AI Processing Engine',
      description: 'Processing at 30 FPS, 98.7 % accuracy',
      status: 'optimal',
      icon: BsLightningChargeFill,
    },
  ];

  return (
    <div className="overflow-hidden rounded-md">
      <div className="px-4 py-3 sm:px-1 border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl leading-6 font-semibold text-black dark:text-textColor">
          System Integrations
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Status of connected systems
        </p>
      </div>
      <div className="p-4 sm:p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-surfaceColor rounded-md p-3 flex items-center justify-between border border-gray-200 dark:border-gray-700"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-textColor">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-2xl text-[10px] leading-4 font-normal font-['Poppins'] ${
                  item.status === 'connected'
                    ? 'bg-[#52BA871A] border border-[#52BA8780] text-green-800 dark:text-green-300'
                    : 'bg-[#FF95001A] border border-[#FF950080] text-amber-800 dark:text-amber-300'
                }`}
              >
                {item.status === 'connected' ? 'Connected' : 'Optimal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemIntegrationsCard;
