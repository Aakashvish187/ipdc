import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No standalone output needed for Vercel — it handles this automatically
  // Silence the middleware→proxy deprecation warning in build output
  experimental: {},
  // Allow images from Supabase storage if needed in future
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
