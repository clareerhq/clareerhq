// PostHog analytics helper — thin wrapper around posthog-js
// Use the `useAnalytics()` hook in client components to track events.

import posthog from 'posthog-js';

export function initPostHog() {
  if (
    typeof window === 'undefined' ||
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY.startsWith('phc_...')
  ) {
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false, // We fire pageviews manually via PostHogPageview
    persistence: 'localStorage+cookie',
  });
}

export { posthog };

// ── Typed event catalogue ──────────────────────────────────────────────────────

export type AnalyticsEvent =
  | { name: 'assessment_started'; props: { occupation_code: string; occupation_title: string } }
  | { name: 'assessment_domain_completed'; props: { domain: string; step: number; rated_count: number } }
  | { name: 'assessment_completed'; props: { occupation_code: string; occupation_title: string; fit_score: number } }
  | { name: 'waitlist_joined'; props: { source: string } }
  | { name: 'occupation_searched'; props: { query: string; result_count: number } }
  | { name: 'occupation_selected'; props: { occupation_code: string; occupation_title: string; source: 'search' | 'popular' } };

export function track(event: AnalyticsEvent['name'], props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, props);
}
