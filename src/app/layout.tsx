import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClareerHQ — Know Your Career Fit',
  description:
    'Discover which careers truly match your strengths. Built on O*NET — the gold standard of occupational data used by career counselors and HR professionals nationwide.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://clareerhq.com'),
  openGraph: {
    title: 'ClareerHQ — Know Your Career Fit',
    description: 'Map your skills, knowledge, and work style to the careers that fit you best.',
    url: 'https://clareerhq.com',
    siteName: 'ClareerHQ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClareerHQ',
    description: 'Know your career fit. Built on O*NET data.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <PostHogProvider>{children}</PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
