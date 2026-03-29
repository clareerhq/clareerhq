'use client';

// Error boundary for /assess/domains — catches any unexpected rendering errors
// and shows a friendly recovery screen instead of the generic Next.js crash page.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DomainsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[assess/domains error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">
          There was a problem loading the assessment page. This is usually caused by
          missing O*NET credentials. Your progress has not been saved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/assess')}
            className="px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            ← Pick an occupation
          </button>
        </div>
      </div>
    </div>
  );
}
