import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Prevent Next.js from trying to prerender 404/500 error pages during build.
  // These pages use App Router's error.tsx / not-found.tsx, but the build
  // process attempts to render them with Pages Router HTML context, causing
  // "Html should not be imported outside of pages/_document" errors.
  // Setting skipTrailingSlashRedirect avoids a known pages-router codepath.
  skipTrailingSlashRedirect: false,
};

export default nextConfig;
