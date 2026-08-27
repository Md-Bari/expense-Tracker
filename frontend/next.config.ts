import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'joshua-intervention-offices-acquired.trycloudflare.com',
    'healthy-thumbzilla-veterinary-witnesses.trycloudflare.com',
    'creative-playback-introduced-forms.trycloudflare.com',
    'localhost:3009',
    'localhost:8007',
    '10.10.33.26:3009',
    '10.0.2.2:3009',
    '10.0.2.2',
  ],
  async rewrites() {
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://backend:8007';
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
