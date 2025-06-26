import { HiOutlineUsers } from "react-icons/hi2";
import { IoLocationOutline } from 'react-icons/io5';
import { IoBusinessOutline } from "react-icons/io5";
import useTeams from 'hooks/useTeams';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import useCanAccess from 'hooks/useCanAccess';
import useOrgTheme from 'hooks/useOrgTheme';
import { GrDocumentText } from "react-icons/gr";
import { IoNewspaperOutline } from 'react-icons/io5';
import { MdLiveTv, MdOutlineAnalytics } from 'react-icons/md';
import { BsClipboard2Data } from "react-icons/bs";
import { GrHomeRounded } from "react-icons/gr";
import { BsFileEarmarkBarGraph } from 'react-icons/bs';
import { GrMultiple } from "react-icons/gr";
import { IconType } from 'react-icons';
import { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';
import { useTenantAccess, useVendorSettings } from 'utils/tenantAccess';
import { HiOutlineUserAdd } from "react-icons/hi";
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TbAlertSquareRounded } from "react-icons/tb";
import { MdOutlineMap } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";

// Define a type that can be either IconType or Heroicon component
type IconComponent =
  | IconType
  | ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;

// Define a type for menu items
interface MenuItem {
  id: number;
  name: string;
  href: string;
  icon: IconComponent;
}

// Define a type for menu sections
interface MenuSection {
  id: number;
  name: string;
  items: MenuItem[];
}

const DrawerMenuList = () => {
  const router = useRouter();
  const { teams } = useTeams();
  const { t } = useTranslation('common');
  const { asPath } = useRouter();
  const { canAccess } = useCanAccess();
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  const teamSlug = router.query.slug as string;

  const currentTeam = (teams || []).find((team) => team.slug === teamSlug);
  const { theme } = useOrgTheme(teamSlug);
  
  const secondaryColor = theme?.secondaryColor;
  
  // Use the tenant access hook to determine feature visibility
  const { tenantType } = useTenantAccess('dashboard');
  
  // Get the location section name based on tenant type
  const getLocationSectionName = (): string => {
    if (tenantType === 'PPE') return 'Facilities';
    if (tenantType === 'Farm') return 'Farm';
    return t('locations');
  };

  // Get the warehouse section name based on tenant type
  const getWarehouseName = (): string => {
    if (tenantType === 'PPE') return 'Warehouse';
    return 'Storage';
  };
  
  // Dashboard group menu items for PPE tenant type
  const dashboardGroupItems = [
    {
      name: 'Home',
      id: 1,
      slug: 'home',
      href: currentTeam ? `/teams/${currentTeam.slug}/home` : '#',
      icon: GrHomeRounded,
      tenantTypes: ['PPE', 'Farm'],
    },
    {
      name: 'Live Monitoring',
      id: 2,
      slug: 'live-monitoring',
      href: currentTeam ? `/teams/${currentTeam.slug}/live-monitoring` : '#',
      icon: MdLiveTv,
      tenantTypes: ['PPE', 'Farm'],
    },
    {
      name: 'Analytics',
      id: 3,
      slug: 'analytics',
      href: currentTeam ? `/teams/${currentTeam.slug}/analytics` : '#',
      icon: MdOutlineAnalytics,
      tenantTypes: ['PPE'],
    },
    {
      name: 'Reports',
      id: 4,
      slug: 'reports',
      href: currentTeam ? `/teams/${currentTeam.slug}/reports` : '#',
      icon: BsFileEarmarkBarGraph,
      tenantTypes: ['PPE'],
    },
    {
      name: 'Records',
      id: 5,
      slug: 'records',
      href: currentTeam ? `/teams/${currentTeam.slug}/records` : '#',
      icon: BsClipboard2Data,
      tenantTypes: ['Farm'],
    },
  ];

  // Alert management group items
  const alertManagementItems = [
    {
      name: 'Alerts',
      id: 1,
      slug: 'alerts',
      href: currentTeam ? `/teams/${currentTeam.slug}/alerts` : '#',
      icon: TbAlertSquareRounded,
      tenantTypes: ['PPE', 'Farm'],
    },
    {
      name:'Incidents',
      id: 2,
      slug: 'incidents',
      href: currentTeam ? `/teams/${currentTeam.slug}/incidents` : '#',
      icon: TbReportAnalytics,
      tenantTypes: ['PPE', 'Farm'],
    },
    {
      name: `${getWarehouseName()} Map`,
      id: 3,
      slug: 'warehouse-map',
      href: currentTeam ? `/teams/${currentTeam.slug}/warehouse-map` : '#',
      icon: MdOutlineMap,
      tenantTypes: ['PPE', 'Farm'],
    },
  ];

  // Update location items to use tenant-specific naming
  const locationItems = [
    {
      name: `All ${getLocationSectionName()}`,
      id: 1,
      slug: 'all-locations',
      href: currentTeam ? `/teams/${currentTeam.slug}/locations` : '#',
      icon: GrMultiple,
    },
    {
      name: 'Zones',
      id: 2,
      slug: 'zones',
      href: currentTeam ? `/teams/${currentTeam.slug}/zones` : '#',
      icon: IoLocationOutline,
    },
  ];

  const {isTeamUsingVendors} = useVendorSettings({teamSlug})

  const vendorItem = {
    name: 'Vendors',
    id: 3,
    slug: 'vendors',
    href: currentTeam ? `/teams/${currentTeam.slug}/vendors` : '#',
    icon: IoBusinessOutline,
  }

  const userSettingItems = [
    {
      name: 'User List',
      id: 1,
      slug: 'user-list',
      href: currentTeam ? `/teams/${currentTeam.slug}/members` : '#',
      icon: HiOutlineUsers,
    },
    {
      name: 'Add New User',
      id: 2,
      slug: 'add-new-user',
      href: currentTeam ? `/teams/${currentTeam.slug}/members/new` : '#',
      icon: HiOutlineUserAdd,
    },
  ];

  const billingItems = [
    {
      name: 'Billing Information',
      id: 1,
      slug: 'billing',
      icon: IoNewspaperOutline,
      href: 'billing',
    },
    {
      name: 'Licenses',
      id: 2,
      slug: 'licenses',
      icon: GrDocumentText,
      href: 'licenses',
    },
  ];

  // Initialize with the correct type
  const menus: MenuSection[] = [];

  // Add dashboard group for tenant type if at least one item is accessible
  if (tenantType) {
    const filteredItems = dashboardGroupItems.filter((item) =>
      item.tenantTypes.includes(tenantType)
    );

    if (filteredItems.length > 0) {
      menus.push({
        id: 1,
        name: 'Dashboard',
        items: filteredItems.map((item) => ({
          id: item.id,
          name: item.name,
          href: item.href,
          icon: item.icon,
        })),
      });
    }
  }

  // Add alert management group only if user has team update permission or is admin
  if (tenantType && (canAccess('team', ['update']) || canAccess('team_member', ['update', 'delete']))) {
    const filteredAlertItems = alertManagementItems.filter((item) =>
      item.tenantTypes.includes(tenantType)
    );

    if (filteredAlertItems.length > 0) {
      menus.push({
        id: 2,
        name: 'Alert Management',
        items: filteredAlertItems.map((item) => ({
          id: item.id,
          name: item.name,
          href: item.href,
          icon: item.icon,
        })),
      });
    }
  }

  if (tenantType === 'Farm' && isTeamUsingVendors) {
    locationItems.push(vendorItem);
  }

  menus.push({
    id: 3,
    name: getLocationSectionName(),
    items: (locationItems || []).map((location) => ({
      id: location.id,
      name: location.name,
      href: location.href,
      icon: location.icon,
    })),
  });

  const bilingTile = {
    id: 5,
    name: 'billing & licensing',
    items: (billingItems || []).map((biling) => ({
      id: biling.id,
      name: biling.name,
      href: currentTeam ? `/teams/${currentTeam.slug}/${biling.href}` : '#',
      icon: biling.icon,
    })),
  };

  const userSettingTile = {
    id: 4,
    name: 'User Settings',
    items: (userSettingItems || []).map((userSetting) => ({
      id: userSetting.id,
      name: userSetting.name,
      href: userSetting.href,
      icon: userSetting.icon,
    })),
  };

  if (canAccess('team_member', ['create', 'update', 'read', 'delete'])) {
    menus.push(userSettingTile);
  }

  if (canAccess('team_payments', ['create', 'update', 'read', 'delete'])) {
    menus.push(bilingTile);
  }

  // Helper function to check if an item is active
  const isItemActive = (item: MenuItem): boolean => {
    if (item.name === 'User List') {
      return asPath === item.href;
    } else if (item.name === 'Add New User') {
      return asPath === item.href;
    } else {
      return asPath.startsWith(item.href + '');
    }
  };

  // Helper function to check if a section has any active item
  const sectionHasActiveItem = (items: MenuItem[]): boolean => {
    return items.some((item) => isItemActive(item));
  };

  // Auto-expand sections with active items on initial render
  useEffect(() => {
    const newExpandedState: Record<number, boolean> = {};

    menus.forEach((menu) => {
      if (sectionHasActiveItem(menu.items)) {
        newExpandedState[menu.id] = true;
      }
    });

    setExpandedSections((prev) => ({ ...prev, ...newExpandedState }));
  }, [asPath]);

  // Toggle section expanded/collapsed state
  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="w-full overflow-hidden flex flex-col">
      <ul className="w-full rounded flex-grow">
        {menus.map(({ id, name, items }) => {
          const isExpanded = expandedSections[id] !== false; // Default to expanded
          const isHovered = hoveredSection === id;
          const hasActiveItem = sectionHasActiveItem(items);

          return (
            <React.Fragment key={id}>
              {name && (
                <li
                  className="text-xs text-textColor dark:text-textColor py-1 px-2 relative cursor-pointer"
                  key={`${id}-name`}
                  onMouseEnter={() => setHoveredSection(id)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <div
                    className="flex items-center justify-between w-full"
                    onClick={() => toggleSection(id)}
                  >
                    <span>{name.toUpperCase()}</span>
                    <div
                      className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </li>
              )}

              {/* Container with fixed positioning to prevent layout shifts */}
              <div className="overflow-hidden">
                <div
                  className={`transition-all duration-200 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}
                >
                  {items.map((item) => {
                    const isActive = isItemActive(item);

                    return (
                      <li key={`${id}-${item.id}`} className="pl-3">
                        <Link href={item.href || '#'}>
                          <div
                            className={`flex ${isActive
                              ? 'text-black bg-gray-100 border-r-4 dark:bg-hoverColor shadow-[inset_0px_1px_2px_#0000000F]'
                              : 'text-textColor dark:text-textColor hover:text-black hover:bg-hoverColor dark:hover:bg-hoverColor hover:border-r-4 hover:shadow-[inset_0px_1px_2px_#0000000F]'
                              } my-1 focus:bg-gray-100 focus:outline-none py-1 px-3 rounded text-sm font-light gap-2 items-center`}
                            style={{
                              color: isActive ? secondaryColor : undefined,
                              borderColor: isActive
                                ? secondaryColor
                                : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = secondaryColor;
                              e.currentTarget.style.borderColor =
                                secondaryColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = isActive
                                ? secondaryColor
                                : '';
                              e.currentTarget.style.borderColor = isActive
                                ? secondaryColor
                                : 'transparent';
                            }}
                          >
                            <item.icon className="w-5 h-5" /> {item.name}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </div>
              </div>

              {name && <li className="mb-2 m-0" key={`${id}-divider`} />}
            </React.Fragment>
          );
        })}
      </ul>
      <div className="mt-auto"></div>
    </div>
  );
};

export default DrawerMenuList;
