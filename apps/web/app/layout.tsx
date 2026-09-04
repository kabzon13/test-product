import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'test',
  description: 'test',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          <Link href="/">test</Link>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/login">Login</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
