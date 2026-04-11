import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClareerHQ — Your HQ for career clarity',
  description:
    'Map your skills, knowledge, and work style to the careers that fit you best. Powered by O*NET — the gold standard of occupational data.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://clareerhq.com'),
  openGraph: {
    title: 'ClareerHQ — Your HQ for career clarity',
    description: 'Map your skills, knowledge, and work style to the careers that fit you best. Powered by O*NET.',
    url: 'https://clareerhq.com',
    siteName: 'ClareerHQ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClareerHQ — Your HQ for career clarity',
    description: 'Map your skills, knowledge, and work style to the careers that fit you best.',
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
