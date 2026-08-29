import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'JC Eletricista CRM',
  description: 'Sistema de gestão para serviços elétricos residenciais e comerciais.',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body suppressHydrationWarning className="antialiased font-sans bg-background text-on-surface">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
