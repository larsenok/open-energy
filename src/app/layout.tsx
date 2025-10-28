import type { Metadata } from 'next';
import './styles/globals.css';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Human Energy Exchange',
  description:
    'A meditative, real-time map of global electricity generation and consumption.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
