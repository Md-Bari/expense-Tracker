import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js 308 redirects on trailing slashes so POST payloads aren't lost
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: true,
  // Standalone output for Docker/Railway — Vercel has its own build system
  // RAILWAY_ENVIRONMENT is automatically set by Railway, never by Vercel
  output: process.env.RAILWAY_ENVIRONMENT ? 'standalone' : undefined,
  // Dev origins for local + Cloudflare tunnel development
  allowedDevOrigins: [
    'sharing-processors-without-virtual.trycloudflare.com',
    'farmers-specialties-responding-admit.trycloudflare.com',
    'expense-tracker-kappa-two-22.vercel.app',
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
        source: '/api',
        destination: `${backendUrl}/api/`,
      },
      {
        source: '/api/',
        destination: `${backendUrl}/api/`,
      },
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

