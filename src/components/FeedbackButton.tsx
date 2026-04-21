'use client';

import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';

export function FeedbackButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/feedback"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-md text-xs font-semibold text-gray-600 hover:text-brand-700 hover:border-brand-300 hover:shadow-lg transition-all"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        Feedback
      </Link>
    </div>
  );
}
