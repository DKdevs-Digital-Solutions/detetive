import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Detetive IA — Totem Interativo',
  description: 'Tecnologia para investigar o que é real. Aprenda sobre IA, fake news e uso responsável da tecnologia.',
  robots: 'noindex',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
