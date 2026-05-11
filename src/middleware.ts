import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Webhook routes must never be intercepted by auth middleware —
// they use their own signature verification instead.
const isWebhookRoute = createRouteMatcher([
  '/api/stripe/webhook',
  '/api/webhooks/clerk',
]);

export default clerkMiddleware((auth, req) => {
  if (isWebhookRoute(req)) return; // skip auth entirely for webhooks
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
