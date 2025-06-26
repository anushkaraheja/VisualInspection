import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainNavigation from './MainNavigation';

const Navigation = () => {
  const { asPath, isReady, query } = useRouter();
  const [activePathname, setActivePathname] = useState<null | string>(null);

  const { slug } = query as { slug: string };

  useEffect(() => {
    if (isReady && asPath) {
      const activePathname = new URL(asPath, location.href).pathname;
      setActivePathname(activePathname);
    }
  }, [asPath, isReady]);

  return (
    <nav className="flex flex-1 flex-col">
      <MainNavigation activePathname={activePathname} slug={slug} />
    </nav>
  );
};

export default Navigation;
