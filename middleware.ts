import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Define public routes (no authentication required)
 */
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/public(.*)',
  '/api/organizations/create',
]);

/**
 * Define setup route (requires authentication but no organization)
 */
const isSetupRoute = createRouteMatcher([
  '/setup',
]);

export default clerkMiddleware((auth, req) => {
  // If it's a public route, allow access
  if (isPublicRoute(req)) {
    return;
  }

  // Clerk middleware automatically handles auth redirects for unauthenticated users
  // You can add additional middleware logic here, such as:
  // - Checking if user belongs to an organization
  // - Role-based route protection
  // - Subscription checks, etc.
});

export const config = {
  // The following matcher runs the middleware on all routes
  // except static assets in the public folder
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

