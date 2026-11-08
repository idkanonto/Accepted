'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Nav from './nav';
import Footer from './footer';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={pathname === '/' ? 'site-shell' : 'workspace-shell'}>
      <Nav />
      <main id="main-content" tabIndex={-1} className="shell-main outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
