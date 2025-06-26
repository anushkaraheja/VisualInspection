import Link from 'next/link';
import classNames from 'classnames';
import { useRouter } from 'next/router';
import useOrgTheme from 'hooks/useOrgTheme';

export interface MenuItem {
  name: string;
  href: string;
  icon?: any;
  active?: boolean;
  items?: Omit<MenuItem, 'icon' | 'items'>[];
  className?: string;
  action?: () => void;
}

export interface NavigationProps {
  activePathname: string | null;
}

interface NavigationItemsProps {
  menus: MenuItem[];
}

interface NavigationItemProps {
  menu: MenuItem;
  className?: string;
}

const NavigationItems = ({ menus }: NavigationItemsProps) => {
  return (
    <ul role="list" className="flex flex-1 flex-col">
      {menus.map((menu) => (
        <li key={menu.name}>
          <NavigationItem menu={menu} />
          {menu.items && (
            <ul className="flex flex-col gap-1 mt-1">
              {menu.items.map((subitem) => (
                <li key={subitem.name}>
                  <NavigationItem menu={subitem} className="pl-9" />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

const NavigationItem = ({ menu, className }: NavigationItemProps) => {
  const router = useRouter();
  const { slug } = router.query;
  const {
    theme: { primaryColor, secondaryColor },
  } = useOrgTheme(slug as string);

  const content = (
    <>
      {menu.icon && (
        <menu.icon
          className={classNames({
            'h-5 w-5 shrink-0 group-hover:text-white dark:group-hover:text-gray-100':
              true,
            'text-white': menu.active,
          })}
          aria-hidden="true"
        />
      )}
      {menu.name}
    </>
  );

  return menu.action ? (
    <div
      onClick={menu.action}
      className={`cursor-pointer group mb-4 flex items-center rounded text-sm text-[#8A8A8F] dark:text-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 px-2 p-2 gap-4 ${className}`}
      style={{
        backgroundColor: menu.active ? primaryColor : 'transparent',
        color: menu.active ? 'white' : '',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = secondaryColor;
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = menu.active
          ? primaryColor
          : 'transparent';
        e.currentTarget.style.color = menu.active ? 'white' : '';
      }}
    >
      {content}
    </div>
  ) : (
    <Link
      href={menu.href}
      className={`group mb-4 flex items-center rounded text-sm text-[#8A8A8F] dark:text-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 px-2 p-2 gap-4 ${className}`}
      style={{
        backgroundColor: menu.active ? primaryColor : 'transparent',
        color: menu.active ? 'white' : '',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = secondaryColor;
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = menu.active
          ? primaryColor
          : 'transparent';
        e.currentTarget.style.color = menu.active ? 'white' : '';
      }}
    >
      {content}
    </Link>
  );
};

export default NavigationItems;
