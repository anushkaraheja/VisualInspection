import React from 'react';
import { IconType } from 'react-icons';
import DashboardCard from '@/components/shared/DashboardCard';

interface StatusTileItem {
  title: string;
  value: number;
  icon: IconType;
  iconBgColor: string;
  iconColor: string;
  showDot: boolean;
  dotColor?: string;
  headingColor: string;
}

interface StatusTilesProps {
  tiles: StatusTileItem[];
}

const StatusTiles: React.FC<StatusTilesProps> = ({ tiles }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
      {tiles.map((tile, index) => (
        <DashboardCard
          key={index}
          title={tile.title}
          value={tile.value}
          icon={tile.icon}
          iconBgColor={tile.iconBgColor}
          iconColor={tile.iconColor}
          showDot={tile.showDot}
          dotColor={tile.dotColor}
          headingColor={tile.headingColor}
        />
      ))}
    </div>
  );
};

export default StatusTiles;
