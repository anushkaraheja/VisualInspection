import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';
import { signOut } from 'next-auth/react';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { useTenantType } from 'utils/tenantAccess';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const MainNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');
  const { hasAccess: isPPETenant } = useTenantType('PPE');
  const { hasAccess: isFarmTenant } = useTenantType('Farm');

  const menus: MenuItem[] = [];

  // Only add Validate PPE menu item if the tenant type is PPE
  if (isFarmTenant) {
    menus.push({
      name: 'Configure Livestock',
      href: `/teams/${slug}/configure-livestock`,
      icon: ShieldCheckIcon,
      active: activePathname === `/teams/${slug}/configure-licestock`,
    });
  }
  if (isPPETenant) {
    menus.push({
      name: 'Configure PPE',
      href: `/teams/${slug}/configure-ppe`,
      icon: ShieldCheckIcon,
      active: activePathname === `/teams/${slug}/configure-ppe`,
    });
  }

  // Always add these menu items
  menus.push(
    {
      name: t('team-settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active: activePathname === `/teams/${slug}/settings`,
    },
    {
      name: 'Logout',
      href: `/teams/${slug}/settings`,
      icon: ArrowRightStartOnRectangleIcon,
      action: () => {
        signOut({ redirect: false });
      },
    }
  );

  return <NavigationItems menus={menus} />;
};

export default MainNavigation;
