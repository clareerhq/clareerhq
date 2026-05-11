import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider';
import { FeedbackButton } from '@/components/FeedbackButton';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skill-Print — The must-have pairing with your resume',
  description:
    'Map your skills, knowledge, and work style to the careers that fit you best. Powered by O*NET — the gold standard of occupational data.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://getmyskillprint.com'),
  openGraph: {
    title: 'Skill-Print — The must-have pairing with your resume',
    description: 'Map your skills, knowledge, and work style to the careers that fit you best. Powered by O*NET.',
    url: 'https://getmyskillprint.com',
    siteName: 'Skill-Print',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill-Print — The must-have pairing with your resume',
    description: 'Map your skills, knowledge, and work style to the careers that fit you best.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <PostHogProvider>{children}</PostHogProvider>
          <FeedbackButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
