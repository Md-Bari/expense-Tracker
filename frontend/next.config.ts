import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'creative-playback-introduced-forms.trycloudflare.com',
    'localhost:3009',
    'localhost:8007',
  ],
};

export default nextConfig;
