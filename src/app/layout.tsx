import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yahoo Mail Multi-Account Hub & Instant OTP Extractor',
  description: 'Search any Yahoo email and instantly fetch incoming emails and verification codes without repetitive logins.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col antialiased bg-[#080b11] text-gray-100 selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
