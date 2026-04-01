import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
]);

/**
 * Clerk middleware wrapper that gracefully handles missing env vars.
 *
 * Without Clerk keys configured, the app is in "setup mode":
 * - Landing page (/), /checkout, /sign-in, /sign-up are fully public
 * - All other routes return 503 Service Unavailable with a setup notice
 *
 * This prevents the site from going down entirely when env vars are missing.
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  // If Clerk publishable key is not set, the app is not configured.
  // Allow only fully public routes; everything else gets a setup notice.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const publicPaths = ["/", "/checkout"];
    const isPublic =
      publicPaths.includes(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith("/sign-in") ||
      request.nextUrl.pathname.startsWith("/sign-up");
    if (!isPublic) {
      return new NextResponse(
        JSON.stringify({
          error: "Service Unavailable",
          message:
            "HelixForge is not configured yet. Environment variables (Clerk, Stripe, Supabase) must be set in the Vercel dashboard.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return NextResponse.next();
  }

  // Normal Clerk auth flow
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});
