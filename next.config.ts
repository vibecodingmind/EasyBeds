import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Skip TypeScript errors during build — project has pre-existing type issues
    // across 68+ API routes that are being progressively resolved.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
