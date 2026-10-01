import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-custom-header',
            value: 'my custom header value',
          },
        ],
      },
    ];
  },
  // Increase timeout for large responses
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
