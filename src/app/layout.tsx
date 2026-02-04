import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BathTV CMS - Admin Dashboard',
  description: 'Content Management System for BathTV',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="app-version" content="1.0.1-fix-api" />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log('BathTV CMS v1.0.1-fix-api Loaded');`,
          }}
        />
        {children}
      </body>
    </html >
  );
}
