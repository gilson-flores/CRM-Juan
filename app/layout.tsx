import type {Metadata} from 'next';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'JC Eletricista CRM',
  description: 'Sistema de gestão para serviços elétricos residenciais e comerciais.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className="antialiased font-sans bg-background text-on-surface">
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
