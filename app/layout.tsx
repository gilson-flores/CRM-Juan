import type {Metadata} from 'next';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'JC Eletricista CRM',
  description: 'Sistema de gestão para serviços elétricos residenciais e comerciais.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body suppressHydrationWarning className="antialiased font-sans bg-background text-on-surface">
        <ErrorBoundary>
          <Shell>
            {children}
          </Shell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
