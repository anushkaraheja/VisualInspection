import { useState } from 'react';
import { Loading } from '@/components/shared';
import { useSession } from 'next-auth/react';
import React from 'react';
import Header from './Header';
import Drawer from './Drawer';
import { useRouter } from 'next/router';
import useOrgTheme from 'hooks/useOrgTheme';

export default function AppShell({ children }) {
  const router = useRouter();
  const { status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useOrgTheme(router.query.slug as string);

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return;
  }

  return (
    <div>
      <Header setSidebarOpen={setSidebarOpen} />
      <Drawer sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <main className="py-0 bg-backgroundColor dark:bg-backgroundColor mx-0 px-0 h-full w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
