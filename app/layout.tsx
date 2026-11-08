import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import AppShell from '@/components/app-shell';
import Analytics from '@/components/analytics';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#f7f8fa',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  title: {
    default: 'Accepted! | Ontario Supp App Hub & Community',
    template: '%s · Accepted!',
  },
  description:
    'Plan Ontario university applications, browse supplemental-program references, practise interview and writing prompts, and get direct feedback.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
