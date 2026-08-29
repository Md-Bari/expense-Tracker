import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/Railway — Vercel has its own build system
  // RAILWAY_ENVIRONMENT is automatically set by Railway, never by Vercel
  output: process.env.RAILWAY_ENVIRONMENT ? 'standalone' : undefined,
  // Dev origins for local + Cloudflare tunnel development
  allowedDevOrigins: [
    'localhost:3009',
    'localhost:8007',
    '10.10.33.26:3009',
    '10.0.2.2:3009',
    '10.0.2.2',
  ],

  async rewrites() {
    // On Vercel: set INTERNAL_BACKEND_URL to your Railway/Render backend URL
    // In Docker dev: defaults to the Docker service name
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      'http://backend:8007';

    return [
      {
        source: '/api/:path*/',
        destination: `${backendUrl}/api/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

