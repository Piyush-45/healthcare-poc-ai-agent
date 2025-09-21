import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ✅ Allow production builds to complete even with TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Allow builds even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
